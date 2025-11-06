"use server";

import { auth } from "@/auth";
import { cloudinary } from "@/lib/cloudinary";

export interface DeleteImageResult {
  success: boolean;
  error?: string;
}

/**
 * Extrait le public_id depuis une URL Cloudinary
 * Formats supportés:
 * - https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
 * - https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.{format}
 * - https://res.cloudinary.com/{cloud_name}/image/upload/{transformation}/{version}/{public_id}.{format}
 */
export async function extractPublicIdFromUrl(url: string): Promise<string | null> {
  try {
    // Pattern pour extraire le public_id depuis l'URL Cloudinary
    // On cherche la partie après /image/upload/ et on ignore les transformations et versions
    const pattern = /\/image\/upload\/(?:[^\/]+\/)*(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/;
    const match = url.match(pattern);
    
    if (match && match[1]) {
      // Le public_id peut contenir des slashes (pour les dossiers), donc on le retourne tel quel
      // Mais on doit enlever l'extension si elle est présente
      let publicId = match[1];
      
      // Enlever l'extension de fichier si présente
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
 * Supprime une image de Cloudinary à partir de son publicId
 */
export async function deleteImageByPublicIdAction(
  publicId: string
): Promise<DeleteImageResult> {
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

    if (!publicId) {
      return {
        success: false,
        error: "Public ID requis pour la suppression",
      };
    }

    // Supprimer l'image de Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: "image" },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });

    if (result.result === "ok") {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        error: `Erreur Cloudinary: ${result.result}`,
      };
    }
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de la suppression",
    };
  }
}

/**
 * Supprime une image de Cloudinary à partir de son URL
 */
export async function deleteImageAction(
  imageUrl: string
): Promise<DeleteImageResult> {
  try {
    // Extraire le public_id depuis l'URL
    const publicId = await extractPublicIdFromUrl(imageUrl);
    
    if (!publicId) {
      return {
        success: false,
        error: "Impossible d'extraire l'ID de l'image depuis l'URL",
      };
    }

    // Utiliser la fonction avec publicId
    return await deleteImageByPublicIdAction(publicId);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de la suppression",
    };
  }
}

/**
 * Supprime plusieurs images de Cloudinary
 */
export async function deleteImagesAction(
  imageUrls: string[]
): Promise<DeleteImageResult> {
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

    // Supprimer toutes les images en parallèle
    const deletePromises = imageUrls.map((url) => deleteImageAction(url));
    const results = await Promise.allSettled(deletePromises);

    // Vérifier s'il y a des erreurs
    const errors = results
      .filter((result) => result.status === "rejected" || (result.status === "fulfilled" && !result.value.success))
      .map((result, index) => {
        if (result.status === "rejected") {
          return `Image ${index + 1}: ${result.reason}`;
        }
        return `Image ${index + 1}: ${result.value.error || "Erreur inconnue"}`;
      });

    if (errors.length > 0) {
      console.error("Some images failed to delete:", errors);
      // On continue même si certaines images n'ont pas pu être supprimées
      // car ce n'est pas critique pour la mise à jour du véhicule
    }

    // Note: Cloudinary supprime automatiquement les dossiers vides
    // Pas besoin de supprimer manuellement les dossiers

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting images from Cloudinary:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression des images",
    };
  }
}

/**
 * Extrait le chemin du dossier depuis un publicId
 */
function extractFolderPath(publicId: string): string | null {
  try {
    const lastSlashIndex = publicId.lastIndexOf('/');
    if (lastSlashIndex === -1) {
      return null; // Pas de dossier
    }
    return publicId.substring(0, lastSlashIndex);
  } catch {
    return null;
  }
}

/**
 * Vérifie si un dossier est vide et le nettoie si nécessaire
 * Note: Cloudinary supprime automatiquement les dossiers vides,
 * mais cette fonction peut être utilisée pour forcer le nettoyage
 */
export async function cleanupEmptyFolder(folderPath: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Accès refusé",
      };
    }

    // Lister TOUTES les ressources dans le dossier pour vérifier s'il est vraiment vide
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.search
        .expression(`folder:${folderPath}`)
        .max_results(500) // Augmenter pour voir toutes les ressources
        .execute((error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
    });

    // Si le dossier est vide (pas de ressources) - supprimer le dossier
    if (!result.resources || result.resources.length === 0) {
      console.log(`📁 Dossier ${folderPath} est vide - suppression du dossier...`);
      try {
        // Supprimer le dossier vide avec l'API Cloudinary
        const deleteFolderResult = await new Promise<any>((resolve, reject) => {
          cloudinary.api.delete_folder(folderPath, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        });
        console.log(`✅ Dossier ${folderPath} supprimé avec succès`);
        return {
          success: true,
        };
      } catch (deleteFolderError: any) {
        // Si l'erreur est que le dossier n'existe pas, c'est OK
        if (deleteFolderError.http_code === 404 || deleteFolderError.message?.includes("not found")) {
          console.log(`📁 Dossier ${folderPath} n'existe plus (déjà supprimé)`);
          return {
            success: true,
          };
        }
        console.error(`Erreur lors de la suppression du dossier ${folderPath}:`, deleteFolderError);
        return {
          success: false,
          error: `Erreur lors de la suppression du dossier: ${deleteFolderError.message || "Erreur inconnue"}`,
        };
      }
    }

    // Le dossier contient encore des ressources
    // On ne supprime PAS les autres images - elles peuvent appartenir à d'autres véhicules
    // On supprime seulement le dossier s'il est vide (ce qui ne devrait pas arriver ici)
    console.log(`⚠️ Dossier ${folderPath} contient encore ${result.resources.length} ressource(s) - ces images ne seront PAS supprimées (peuvent appartenir à d'autres véhicules)`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error checking folder:", error);
    // On ne retourne pas d'erreur car Cloudinary gère automatiquement les dossiers vides
    return {
      success: true,
    };
  }
}

