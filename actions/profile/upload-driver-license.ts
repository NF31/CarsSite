"use server";

import { auth } from "@/auth";
import prisma from '@/lib/prisma'
import { cloudinary, uploadDriverLicensePDF } from "@/lib/cloudinary";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { User } from "@prisma/client";
import { extractCloudinaryAssetInfo } from "@/lib/cloudinary-utils";

interface UploadMyDriverLicenseResult {
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

export async function uploadMyDriverLicenseAction(
  formData: FormData
): Promise<UploadMyDriverLicenseResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Non authentifié.",
      };
    }

    const file = formData.get("file");

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
        error: "Le document dépasse la taille maximale autorisée (10 MB).",
      };
    }

    const userId = session.user.id;

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
        error: "Utilisateur introuvable.",
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
      const publicId = `license-${Date.now()}`;

      let previousPublicId = user.driverLicensePublicId;
      
      if (!previousPublicId && user.driverLicense) {
        const info = extractCloudinaryAssetInfo(user.driverLicense);
        if (info) {
          previousPublicId = `${info.publicId}.${info.format}`;
        }
      }

      // Supprimer l'ancien permis si présent
      if (previousPublicId) {
        try {
          await cloudinary.uploader.destroy(previousPublicId, {
            resource_type: "raw",
            type: "private",
          });
        } catch (destroyError) {
          console.warn("Impossible de supprimer l'ancien permis Cloudinary:", destroyError);
        }
      }

      const uploadResult = await uploadDriverLicensePDF(
        buffer,
        userId,
        user.name,
        publicId
      );

      await unlink(tempPath);

      const format = uploadResult.format ?? "pdf";
      const publicIdForStorage = uploadResult.public_id;

      await prisma.user.update({
        where: { id: userId },
        data: {
          driverLicense: uploadResult.secure_url,
          driverLicensePublicId: publicIdForStorage,
          driverLicenseFileName: file.name,
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
          publicId: publicIdForStorage,
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

