"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { User } from "@prisma/client";
import { extractCloudinaryAssetInfo } from "@/lib/cloudinary-utils";

interface UploadDriverLicenseResult {
  success: boolean;
  data?: {
    url: string;
    publicId: string;
    format: string;
    uploadCount: number;
    lastUploadedAt: string;
    nextAllowedAt: string | null;
    maxReplacements: number;
    cooldownDays: number;
  };
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set(["application/pdf"]);
const PDF_MAGIC_BYTES = Buffer.from("%PDF");
const PDF_EOF_MARKER = Buffer.from("%%EOF");
const FORBIDDEN_PATTERNS = [/<!DOCTYPE\s+html/i, /<script/i, /<?php/i];
const MAX_REPLACEMENTS_PER_WINDOW = 3;
const COOLDOWN_DAYS = 21;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

function formatDateFr(date: Date): string {
  return format(date, "d MMMM yyyy", { locale: fr });
}

function cleanSegment(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function buildDriverLicenseFolder(userId: string, userName?: string | null): string {
  const baseFolder = "vehicles/users";

  if (userName && userName.trim().length > 0) {
    const cleaned = cleanSegment(userName);
    if (cleaned.length > 0) {
      return `${baseFolder}/${cleaned}-${userId}/driver-license`;
    }
  }

  return `${baseFolder}/${userId}/driver-license`;
}

export async function uploadDriverLicenseAction(
  formData: FormData
): Promise<UploadDriverLicenseResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Non authentifié.",
      };
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Accès refusé.",
      };
    }

    const userId = formData.get("userId");
    const file = formData.get("file");

    if (typeof userId !== "string" || userId.trim().length === 0) {
      return {
        success: false,
        error: "Client invalide.",
      };
    }

    if (!(file instanceof File)) {
      return {
        success: false,
        error: "Aucun document n'a été fourni.",
      };
    }

    const fileName = file.name?.toLowerCase() ?? "";
    if (!fileName.endsWith(".pdf")) {
      return {
        success: false,
        error: "Le document doit avoir une extension .pdf.",
      };
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return {
        success: false,
        error: "Le permis doit être un fichier PDF.",
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "Le document dépasse la taille maximale autorisée (10 MB).",
      };
    }

    const user = (await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    })) as (User & {
      driverLicensePublicId: string | null;
      driverLicenseUploadCount: number;
      driverLicenseLastUploadedAt: Date | null;
    }) | null;

    if (!user) {
      return {
        success: false,
        error: "Client introuvable.",
      };
    }

    const now = new Date();
    let uploadCount = user.driverLicenseUploadCount ?? 0;
    let lastUploadedAt = user.driverLicenseLastUploadedAt ?? null;

    if (lastUploadedAt && now.getTime() - lastUploadedAt.getTime() > COOLDOWN_MS) {
      uploadCount = 0;
      lastUploadedAt = null;
    }

    if (uploadCount >= MAX_REPLACEMENTS_PER_WINDOW) {
      const nextAllowed = lastUploadedAt
        ? new Date(lastUploadedAt.getTime() + COOLDOWN_MS)
        : new Date(now.getTime() + COOLDOWN_MS);
      return {
        success: false,
        error: `Le permis a déjà été remplacé ${MAX_REPLACEMENTS_PER_WINDOW} fois. Vous pourrez téléverser un nouveau document à partir du ${formatDateFr(
          nextAllowed
        )}.`,
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < PDF_MAGIC_BYTES.length || !buffer.slice(0, 4).equals(PDF_MAGIC_BYTES)) {
      return {
        success: false,
        error: "Le fichier PDF est invalide ou corrompu.",
      };
    }

    if (!buffer.includes(PDF_EOF_MARKER)) {
      return {
        success: false,
        error: "Le fichier PDF semble incomplet ou mal formé.",
      };
    }

    const preview = buffer.toString("utf8", 0, Math.min(buffer.length, 4096));
    if (FORBIDDEN_PATTERNS.some((pattern) => pattern.test(preview))) {
      return {
        success: false,
        error: "Le PDF contient des instructions interdites.",
      };
    }

    const tempPath = join(tmpdir(), `driver-license-${userId}-${Date.now()}.pdf`);
    await writeFile(tempPath, buffer);

    try {
      const folder = buildDriverLicenseFolder(userId, user.name);
      const publicId = `license-${Date.now()}`;

      let previousPublicId = user.driverLicensePublicId;
      if (!previousPublicId && user.driverLicense) {
        const info = extractCloudinaryAssetInfo(user.driverLicense);
        if (info) {
          previousPublicId = `${info.publicId}.${info.format}`;
        }
      }

      if (previousPublicId) {
        try {
          await cloudinary.uploader.destroy(previousPublicId, {
            resource_type: "raw",
            type: "authenticated",
          });
        } catch (destroyError) {
          console.warn("Impossible de supprimer l'ancien permis Cloudinary:", destroyError);
        }
      }

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          tempPath,
          {
            folder,
            public_id: publicId,
            resource_type: "raw",
            type: "authenticated",
            access_mode: "authenticated",
            overwrite: true,
            use_filename: false,
            unique_filename: false,
            tags: ["driver-license", "admin"],
          },
          (error, uploadResult) => {
            if (error) {
              reject(error);
            } else {
              resolve(uploadResult);
            }
          }
        );
      });

      await unlink(tempPath);

      type CloudinaryRawResult = {
        secure_url: string;
        public_id: string;
        format?: string;
      };

      const uploadResult = result as CloudinaryRawResult;
      const format = uploadResult.format ?? "pdf";
      const publicIdWithExtension = uploadResult.public_id?.includes(".")
        ? uploadResult.public_id
        : `${uploadResult.public_id}.${format}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma.user.update as any)({
        where: { id: userId },
        data: {
          driverLicense: uploadResult.secure_url,
          driverLicensePublicId: publicIdWithExtension,
          driverLicenseUploadCount: uploadCount + 1,
          driverLicenseLastUploadedAt: now,
        },
      });

      const newCount = uploadCount + 1;
      const nextAllowedAt =
        newCount >= MAX_REPLACEMENTS_PER_WINDOW
          ? new Date(now.getTime() + COOLDOWN_MS).toISOString()
          : null;

      return {
        success: true,
        data: {
          url: uploadResult.secure_url,
          publicId: publicIdWithExtension,
          format,
          uploadCount: newCount,
          lastUploadedAt: now.toISOString(),
          nextAllowedAt,
          maxReplacements: MAX_REPLACEMENTS_PER_WINDOW,
          cooldownDays: COOLDOWN_DAYS,
        },
      };
    } catch (uploadError) {
      await unlink(tempPath).catch(() => undefined);
      throw uploadError;
    }
  } catch (error) {
    console.error("Upload driver license error:", error);
    return {
      success: false,
      error: "Impossible de téléverser le permis de conduire.",
    };
  }
}


 