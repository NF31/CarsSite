"use server";

import { auth } from "@/auth";
import { cloudinary } from "@/lib/cloudinary";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export interface UploadImageResult {
  success: boolean;
  data?: {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
  };
  error?: string;
}

/**
 * Nettoie le nom pour créer un dossier valide dans Cloudinary
 */
function cleanFolderName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, "") // Supprimer les caractères spéciaux
    .replace(/\s+/g, "-") // Remplacer les espaces par des tirets
    .replace(/-+/g, "-") // Supprimer les tirets multiples
    .trim();
}

/**
 * Crée le chemin du dossier Cloudinary basé sur la marque et le modèle
 */
function getVehicleFolderPath(brand?: string, model?: string): string {
  const baseFolder = "vehicles";

  if (!brand && !model) {
    return baseFolder;
  }

  if (brand && model) {
    const cleanBrand = cleanFolderName(brand);
    const cleanModel = cleanFolderName(model);
    return `${baseFolder}/${cleanBrand}-${cleanModel}`;
  }

  if (brand) {
    const cleanBrand = cleanFolderName(brand);
    return `${baseFolder}/${cleanBrand}`;
  }

  if (model) {
    const cleanModel = cleanFolderName(model);
    return `${baseFolder}/${cleanModel}`;
  }

  return baseFolder;
}

export async function uploadImageAction(
  formData: FormData
): Promise<UploadImageResult> {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Non authentifié",
      };
    }

    // Vérifier que c'est un admin
    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Accès refusé",
      };
    }

    const file = formData.get("file") as File;
    const brand = (formData.get("brand") as string) || undefined;
    const model = (formData.get("model") as string) || undefined;

    if (!file) {
      return {
        success: false,
        error: "Aucun fichier fourni",
      };
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "Le fichier doit être une image",
      };
    }

    // Vérifier la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "Le fichier est trop volumineux (max 10MB)",
      };
    }

    // Créer le chemin du dossier basé sur la marque et le modèle
    const folderPath = getVehicleFolderPath(brand, model);

    // Sauvegarder temporairement le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = join(tmpdir(), `upload-${Date.now()}-${file.name}`);
    await writeFile(tempPath, buffer);

    try {
      // Générer un nom de fichier unique
      const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Upload vers Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          tempPath,
          {
            folder: folderPath,
            public_id: fileName,
            resource_type: "image",
            transformation: [
              { width: 1920, height: 1080, crop: "limit", quality: "auto" },
            ],
            tags: ["vehicle", "admin"],
            context: {
              alt: brand && model ? `${brand} ${model}` : "Véhicule",
              source: "admin-panel",
            },
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });

      // Supprimer le fichier temporaire
      await unlink(tempPath);

      // Type pour le résultat Cloudinary
      type CloudinaryResult = {
        secure_url: string;
        public_id: string;
        width: number;
        height: number;
        format: string;
        bytes: number;
      };

      const cloudinaryResult = result as CloudinaryResult;

      return {
        success: true,
        data: {
          url: cloudinaryResult.secure_url,
          publicId: cloudinaryResult.public_id,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          format: cloudinaryResult.format,
          bytes: cloudinaryResult.bytes,
        },
      };
    } catch (uploadError) {
      // Supprimer le fichier temporaire en cas d'erreur
      await unlink(tempPath).catch(() => {});
      throw uploadError;
    }
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return {
      success: false,
      error: "Erreur lors de l'upload de l'image",
    };
  }
}

