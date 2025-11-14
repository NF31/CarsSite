"use server";

import { cloudinary } from "@/lib/cloudinary";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

interface UploadDriverLicenseResult {
  success: boolean;
  data?: {
    url: string;
    publicId: string;
    format: string;
  };
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set(["application/pdf"]);

function buildDriverLicenseFolder(sessionId: string): string {
  const baseFolder = "cars/driver-licenses/public";
  return `${baseFolder}/${sessionId}`;
}

/**
 * Upload du permis de conduire pour un client (public)
 * Utilise une session ID temporaire pour organiser les fichiers
 */
export async function uploadPublicDriverLicenseAction(
  formData: FormData
): Promise<UploadDriverLicenseResult> {
  try {
    const file = formData.get("file");
    const sessionId = formData.get("sessionId") as string || `temp-${Date.now()}`;

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

    // Créer un fichier temporaire
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = join(tmpdir(), `driver-license-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`);
    await writeFile(tempPath, buffer);

    try {
      const folder = buildDriverLicenseFolder(sessionId);
      const publicId = `license-${Date.now()}`;

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          tempPath,
          {
            folder,
            public_id: publicId,
            resource_type: "raw",
            type: "upload",
            access_mode: "public",
            overwrite: true,
            use_filename: false,
            unique_filename: false,
            tags: ["driver-license", "public", "booking"],
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

      return {
        success: true,
        data: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          format: uploadResult.format || "pdf",
        },
      };
    } catch (uploadError) {
      await unlink(tempPath).catch(() => {
        // Ignorer les erreurs de suppression du fichier temporaire
      });

      console.error("[Public Booking] Erreur lors de l'upload du permis", uploadError);
      return {
        success: false,
        error: "Erreur lors de l'upload du permis de conduire.",
      };
    }
  } catch (error) {
    console.error("[Public Booking] Erreur inattendue lors de l'upload du permis", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de l'upload du permis de conduire.",
    };
  }
}

