"use server";

import { auth } from "@/auth";
import { cloudinary } from "@/lib/cloudinary";
import { deleteImageByPublicIdAction } from "./delete-image";

export interface MoveImageResult {
  success: boolean;
  newUrl?: string;
  newPublicId?: string;
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

/**
 * Extrait le public_id depuis une URL Cloudinary
 */
function extractPublicIdFromUrl(url: string): string | null {
  try {
    const pattern = /\/image\/upload\/(?:[^\/]+\/)*(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/;
    const match = url.match(pattern);
    
    if (match && match[1]) {
      let publicId = match[1];
      const extensionPattern = /\.(jpg|jpeg|png|gif|webp)$/i;
      publicId = publicId.replace(extensionPattern, '');
      return publicId;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Extrait le nom de fichier depuis un public_id (sans le dossier)
 */
function extractFileName(publicId: string): string {
  const parts = publicId.split('/');
  return parts[parts.length - 1];
}

/**
 * Déplace une image vers un nouveau dossier dans Cloudinary
 * Utilise upload avec l'URL existante puis supprime l'ancienne image
 */
export async function moveImageAction(
  imageUrl: string,
  newBrand: string,
  newModel: string,
  oldPublicId?: string
): Promise<MoveImageResult> {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Non authentifié",
      };
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Accès refusé",
      };
    }

    // Utiliser le publicId fourni ou l'extraire depuis l'URL
    const currentPublicId = oldPublicId || extractPublicIdFromUrl(imageUrl);
    if (!currentPublicId) {
      return {
        success: false,
        error: "Impossible d'extraire l'ID de l'image depuis l'URL",
      };
    }

    // Créer le nouveau chemin de dossier
    const newFolderPath = getVehicleFolderPath(newBrand, newModel);
    
    // Si le public_id est déjà dans le bon dossier, pas besoin de déplacer
    if (currentPublicId.startsWith(newFolderPath + "/")) {
      return {
        success: true,
        newUrl: imageUrl,
        newPublicId: currentPublicId,
      };
    }

    // Générer un nouveau nom de fichier unique
    const generatedPublicId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newPublicId = `${newFolderPath}/${generatedPublicId}`;

    // Uploader l'image vers le nouveau dossier en utilisant l'URL existante
    // Cloudinary va récupérer l'image depuis l'ancienne URL
    let uploadResult;
    try {
      uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          imageUrl,
          {
            folder: newFolderPath,
            public_id: generatedPublicId,
            resource_type: "image",
            transformation: [
              { width: 1920, height: 1080, crop: "limit", quality: "auto" },
            ],
            tags: ["vehicle", "admin", "moved"],
            context: {
              alt: `${newBrand} ${newModel}`,
              source: "admin-panel-move",
            },
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
      });
    } catch (uploadError: unknown) {
      // Si l'image n'existe plus (404), on garde l'ancienne URL
      const error = uploadError as { http_code?: number; message?: string };
      if (error.http_code === 404) {
        console.warn("Image introuvable dans Cloudinary, conservation de l'URL existante");
        return {
          success: true,
          newUrl: imageUrl, // Garder l'ancienne URL
          newPublicId: currentPublicId, // Garder l'ancien publicId
        };
      }
      throw uploadError;
    }

    // Type pour le résultat Cloudinary
    type CloudinaryUploadResult = {
      secure_url: string;
      public_id: string;
    };

    const uploadResultTyped = uploadResult as CloudinaryUploadResult;

    // Supprimer l'ancienne image seulement si l'upload a réussi
    // Utiliser le publicId directement au lieu d'extraire depuis l'URL
    if (uploadResultTyped.secure_url && currentPublicId) {
      try {
        await deleteImageByPublicIdAction(currentPublicId);
      } catch (deleteError) {
        console.error("Erreur lors de la suppression de l'ancienne image:", deleteError);
        // On continue quand même car la nouvelle image est créée
      }
    }

    return {
      success: true,
      newUrl: uploadResultTyped.secure_url,
      newPublicId: uploadResultTyped.public_id, // Retourner le nouveau publicId depuis Cloudinary
    };
  } catch (error) {
    console.error("Error moving image in Cloudinary:", error);
    return {
      success: false,
      error: `Erreur lors du déplacement de l'image: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
    };
  }
}

/**
 * Déplace plusieurs images vers un nouveau dossier
 */
export async function moveImagesAction(
  imageUrls: string[],
  newBrand: string,
  newModel: string,
  oldPublicIds?: string[]
): Promise<{ success: boolean; newUrls: string[]; newPublicIds: string[]; errors: string[] }> {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        newUrls: [],
        newPublicIds: [],
        errors: ["Accès refusé"],
      };
    }

    const newUrls: string[] = [];
    const newPublicIds: string[] = [];
    const errors: string[] = [];

    // Déplacer toutes les images en parallèle
    const movePromises = imageUrls.map(async (url, index) => {
      const oldPublicId = oldPublicIds?.[index];
      const result = await moveImageAction(url, newBrand, newModel, oldPublicId);
      if (result.success && result.newUrl) {
        newUrls[index] = result.newUrl;
        newPublicIds[index] = result.newPublicId || ""; // Retourner le nouveau publicId
      } else {
        errors.push(`Image ${index + 1}: ${result.error || "Erreur inconnue"}`);
        // En cas d'erreur, garder l'ancienne URL et publicId
        newUrls[index] = url;
        newPublicIds[index] = oldPublicId || "";
      }
    });

    await Promise.allSettled(movePromises);

    return {
      success: errors.length === 0,
      newUrls,
      newPublicIds, // Retourner les nouveaux publicIds
      errors,
    };
  } catch (error) {
    console.error("Error moving images:", error);
    return {
      success: false,
      newUrls: imageUrls, // Retourner les URLs originales en cas d'erreur
      newPublicIds: oldPublicIds || [], // Retourner les publicIds originaux
      errors: ["Erreur lors du déplacement des images"],
    };
  }
}

