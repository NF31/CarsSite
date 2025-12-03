import { deleteImageByPublicIdAction, cleanupEmptyFolder } from "../delete-image";
import { moveImagesAction } from "../move-images";

export interface ImageInfo {
  url: string;
  publicId: string;
}

export interface ImageChanges {
  deletedImages: ImageInfo[];
  addedImages: string[];
  existingImages: string[];
  needsImageMove: boolean;
}

export interface ProcessedImages {
  finalImages: string[];
  finalPublicIds: string[];
}

/**
 * Identifie les changements d'images entre l'ancien et le nouveau véhicule
 */
export function identifyImageChanges(
  oldImages: string[],
  oldPublicIds: string[],
  newImages: string[],
  newPublicIds: string[],
  brandChanged: boolean,
  modelChanged: boolean
): ImageChanges {
  // Trouver les images supprimées avec leurs publicIds
  const deletedImages: ImageInfo[] = [];
  oldImages.forEach((url, index) => {
    if (!newImages.includes(url)) {
      deletedImages.push({
        url,
        publicId: oldPublicIds[index] || "",
      });
    }
  });

  const addedImages = newImages.filter((newUrl) => !oldImages.includes(newUrl));
  const existingImages = oldImages.filter((oldUrl) => newImages.includes(oldUrl));
  const needsImageMove = brandChanged || modelChanged;

  return {
    deletedImages,
    addedImages,
    existingImages,
    needsImageMove,
  };
}

/**
 * Extrait les chemins de dossiers uniques depuis les publicIds
 */
export function extractFolderPaths(publicIds: string[]): Set<string> {
  const folderPaths = new Set<string>();
  publicIds.forEach((publicId: string) => {
    if (publicId) {
      const lastSlashIndex = publicId.lastIndexOf('/');
      if (lastSlashIndex !== -1) {
        const folderPath = publicId.substring(0, lastSlashIndex);
        folderPaths.add(folderPath);
      }
    }
  });
  return folderPaths;
}

/**
 * Déplace les images existantes vers un nouveau dossier si la marque/modèle a changé
 */
export async function moveExistingImages(
  existingImages: string[],
  oldPublicIds: string[],
  oldImages: string[],
  newImages: string[],
  newPublicIds: string[],
  brand: string,
  model: string
): Promise<ProcessedImages> {
  // Récupérer les publicIds correspondants aux images existantes
  const existingPublicIds = oldPublicIds
    .map((publicId: string, index: number) => existingImages.includes(oldImages[index]) ? publicId : null)
    .filter((id: string | null): id is string => id !== null && id !== "");

  const moveResult = await moveImagesAction(existingImages, brand, model, existingPublicIds);

  if (!moveResult.success) {
    console.error("⚠️ Erreur lors du déplacement des images:", moveResult.errors);
    // On continue avec les anciennes URLs si le déplacement échoue
    return {
      finalImages: newImages,
      finalPublicIds: newPublicIds,
    };
  }

  // Remplacer les anciennes URLs par les nouvelles dans la liste complète
  const finalImages = newImages.map((url) => {
    const index = existingImages.indexOf(url);
    if (index !== -1 && moveResult.newUrls[index]) {
      return moveResult.newUrls[index];
    }
    return url;
  });

  // Mettre à jour les publicIds pour les images déplacées
  const finalPublicIds = (newPublicIds || []).map((publicId, index) => {
    const url = newImages[index];
    const existingIndex = existingImages.indexOf(url);
    if (existingIndex !== -1 && moveResult.newPublicIds[existingIndex]) {
      return moveResult.newPublicIds[existingIndex];
    }
    return publicId;
  });

  console.log(`✅ Images déplacées avec succès vers vehicles/${brand.toLowerCase()}-${model.toLowerCase()}`);

  return {
    finalImages,
    finalPublicIds,
  };
}

/**
 * Nettoie les anciens dossiers après déplacement des images
 */
export async function cleanupOldFolders(oldFolderPaths: Set<string>): Promise<void> {
  for (const oldFolderPath of oldFolderPaths) {
    console.log(`🧹 Suppression de toutes les images restantes dans l'ancien dossier: ${oldFolderPath}`);
    await cleanupEmptyFolder(oldFolderPath).catch((error) => {
      console.error(`Erreur lors du nettoyage de l'ancien dossier ${oldFolderPath}:`, error);
    });
  }
}

/**
 * Supprime les images retirées de Cloudinary
 */
export async function deleteRemovedImages(deletedImages: ImageInfo[]): Promise<void> {
  if (deletedImages.length === 0) {
    return;
  }

  console.log(`🗑️ Suppression de ${deletedImages.length} image(s) retirée(s) de Cloudinary`);

  // Supprimer les images de Cloudinary en utilisant les publicIds stockés
  const deletePromises = deletedImages
    .filter((img) => img.publicId)
    .map((img) => deleteImageByPublicIdAction(img.publicId));

  await Promise.allSettled(deletePromises).catch((error) => {
    console.error("Erreur lors de la suppression des images de Cloudinary:", error);
  });

  // Nettoyer les dossiers vides après suppression
  const folderPaths = extractFolderPaths(deletedImages.map((img) => img.publicId));

  // On attend un peu pour que Cloudinary se synchronise après les suppressions
  await new Promise(resolve => setTimeout(resolve, 1000));

  for (const folderPath of folderPaths) {
    await cleanupEmptyFolder(folderPath).catch((error) => {
      console.error(`Erreur lors du nettoyage du dossier ${folderPath}:`, error);
    });
  }
}

/**
 * Supprime les nouvelles images uploadées en cas d'échec de mise à jour
 */
export async function cleanupAddedImagesOnError(
  addedImages: string[],
  newImages: string[],
  newPublicIds: string[]
): Promise<void> {
  if (addedImages.length === 0) {
    return;
  }

  console.error("❌ Erreur lors de la mise à jour du véhicule, suppression des nouvelles images uploadées");
  
  const addedPublicIds = newPublicIds.filter((_, index) => addedImages.includes(newImages[index]));
  const deletePromises = addedPublicIds
    .filter((publicId) => publicId)
    .map((publicId) => deleteImageByPublicIdAction(publicId));

  await Promise.allSettled(deletePromises).catch((deleteError: unknown) => {
    console.error("Erreur lors du nettoyage des images après échec de mise à jour:", deleteError);
  });
}

/**
 * Gère toutes les opérations sur les images lors de la mise à jour d'un véhicule
 */
export async function handleVehicleImages(
  oldImages: string[],
  oldPublicIds: string[],
  newImages: string[],
  newPublicIds: string[],
  brandChanged: boolean,
  modelChanged: boolean,
  newBrand: string,
  newModel: string
): Promise<ProcessedImages> {
  const changes = identifyImageChanges(
    oldImages,
    oldPublicIds,
    newImages,
    newPublicIds,
    brandChanged,
    modelChanged
  );

  let finalImages = newImages;
  let finalPublicIds = newPublicIds;

  // Extraire les chemins de dossiers anciens
  const oldFolderPaths = extractFolderPaths(oldPublicIds);

  // Déplacer les images si nécessaire
  if (changes.needsImageMove && changes.existingImages.length > 0) {
    console.log(`📁 Déplacement de ${changes.existingImages.length} image(s) vers le nouveau dossier (${newBrand} ${newModel})`);

    const moved = await moveExistingImages(
      changes.existingImages,
      oldPublicIds,
      oldImages,
      newImages,
      newPublicIds,
      newBrand,
      newModel
    );

    finalImages = moved.finalImages;
    finalPublicIds = moved.finalPublicIds;

    // Nettoyer les anciens dossiers
    await cleanupOldFolders(oldFolderPaths);
  }

  // Supprimer les images retirées
  await deleteRemovedImages(changes.deletedImages);

  return {
    finalImages,
    finalPublicIds,
  };
}

