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


export async function uploadDriverLicenseAction(
  formData: FormData
): Promise<UploadDriverLicenseResult> {
  console.log("[Upload Driver License Action] ===== DÉBUT ACTION =====");
  console.log("[Upload Driver License Action] Timestamp:", new Date().toISOString());
  
  try {
    const session = await auth();
    console.log("[Upload Driver License Action] Session:", {
      userId: session?.user?.id,
      role: session?.user?.role,
      email: session?.user?.email,
    });

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
    
    console.log("[Upload Driver License Action] Données reçues:", {
      userId,
      fileName: file instanceof File ? file.name : "N/A",
      fileSize: file instanceof File ? file.size : "N/A",
      fileType: file instanceof File ? file.type : "N/A",
    });

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
      const publicId = `license-${Date.now()}`;
      console.log("[Upload Driver License Action] Public ID généré:", publicId);

      let previousPublicId = user.driverLicensePublicId;
      console.log("[Upload Driver License Action] Ancien public_id stocké:", previousPublicId);
      
      if (!previousPublicId && user.driverLicense) {
        console.log("[Upload Driver License Action] Extraction depuis URL driverLicense...");
        const info = extractCloudinaryAssetInfo(user.driverLicense);
        console.log("[Upload Driver License Action] Info extraite:", info);
        if (info) {
          previousPublicId = `${info.publicId}.${info.format}`;
          console.log("[Upload Driver License Action] Previous public_id reconstruit:", previousPublicId);
        }
      }

      // Supprimer l'ancien permis si présent
      if (previousPublicId) {
        console.log("[Upload Driver License Action] Tentative de suppression de l'ancien permis:", previousPublicId);
        try {
          const destroyResult = await cloudinary.uploader.destroy(previousPublicId, {
            resource_type: "raw",
            type: "private", // Utiliser "private" au lieu de "authenticated"
          });
          console.log("[Upload Driver License Action] ✅ Ancien permis supprimé:", destroyResult);
        } catch (destroyError) {
          const errorMsg = destroyError instanceof Error ? destroyError.message : String(destroyError);
          console.warn("[Upload Driver License Action] ⚠️ Impossible de supprimer l'ancien permis Cloudinary:", {
            error: errorMsg,
            previousPublicId,
          });
        }
      } else {
        console.log("[Upload Driver License Action] Pas d'ancien permis à supprimer");
      }

      // Utiliser la fonction sécurisée uploadDriverLicensePDF qui utilise type: "private"
      console.log("[Upload Driver License Action] ===== APPEL UPLOAD CLOUDINARY =====");
      console.log("[Upload Driver License Action] Paramètres:", {
        bufferSize: buffer.length,
        userId,
        userName: user.name,
        publicId,
      });
      
      const uploadResult = await uploadDriverLicensePDF(
        buffer,
        userId,
        user.name,
        publicId
      );
      
      console.log("[Upload Driver License Action] ✅ Upload Cloudinary terminé");

      await unlink(tempPath);

      const format = uploadResult.format ?? "pdf";
      // IMPORTANT : Le public_id retourné par uploadDriverLicensePDF inclut déjà l'extension
      // Car pour les fichiers privés, Cloudinary stocke le public_id AVEC l'extension
      // On stocke tel quel car c'est le vrai public_id utilisé par Cloudinary
      const publicIdForStorage = uploadResult.public_id;

      console.log("[Upload Driver License] ===== DÉBUT DEBUG UPLOAD =====");
      console.log("[Upload Driver License] User ID:", userId);
      console.log("[Upload Driver License] Upload result public_id:", uploadResult.public_id);
      console.log("[Upload Driver License] Upload result secure_url:", uploadResult.secure_url);
      console.log("[Upload Driver License] Upload result format:", uploadResult.format);
      console.log("[Upload Driver License] Public ID pour stockage:", publicIdForStorage);
      console.log("[Upload Driver License] Type de publicIdForStorage:", typeof publicIdForStorage);
      console.log("[Upload Driver License] Longueur de publicIdForStorage:", publicIdForStorage.length);
      console.log("[Upload Driver License] publicIdForStorage contient '.pdf':", publicIdForStorage.includes(".pdf"));

      // Enregistrer l'URL, le public_id et le nom du fichier dans la base de données
      // L'URL contiendra /private/ et nécessitera une URL signée pour être accessible
      // Le public_id stocké doit inclure le chemin complet du dossier
      await prisma.user.update({
        where: { id: userId },
        data: {
          driverLicense: uploadResult.secure_url, // URL privée Cloudinary
          driverLicensePublicId: publicIdForStorage, // public_id complet avec chemin du dossier
          driverLicenseFileName: file.name, // Nom original du fichier PDF
          driverLicenseUploadCount: uploadCount + 1,
          driverLicenseLastUploadedAt: now,
        },
      });

      console.log("[Upload Driver License] Données enregistrées en BDD:");
      console.log("[Upload Driver License] - driverLicense:", uploadResult.secure_url);
      console.log("[Upload Driver License] - driverLicensePublicId:", publicIdForStorage);
      console.log("[Upload Driver License] ===== FIN DEBUG UPLOAD =====");

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


 