"use server";

import { prisma } from "@/lib/prisma";
import { updateVehicleSchema, type UpdateVehicleInput } from "@/lib/validations/vehicle";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { deleteImageByPublicIdAction, cleanupEmptyFolder } from "./delete-image";
import { moveImagesAction } from "./move-images";

export interface UpdateVehicleResult {
  success: boolean;
  data?: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
  };
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function updateVehicleAction(
  input: UpdateVehicleInput
): Promise<UpdateVehicleResult> {
  try {
    // Vérifier l'authentification et le rôle
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires",
      };
    }

    // Valider les données
    const validationResult = updateVehicleSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;
    const { id, ...updateData } = validatedData;

    // Vérifier que le véhicule existe
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!existingVehicle) {
      return {
        success: false,
        error: "Véhicule introuvable",
        fieldErrors: {
          id: ["Véhicule introuvable"],
        },
      };
    }

    // VALIDATIONS SUPPLÉMENTAIRES DE SÉCURITÉ
    
    // Vérifier que les prix sont cohérents
    if (updateData.pricePerWeek && updateData.pricePerWeek < updateData.pricePerDay * 5) {
      return {
        success: false,
        error: "Le prix par semaine doit être au moins 5 fois le prix par jour",
        fieldErrors: {
          pricePerWeek: ["Le prix par semaine doit être au moins 5 fois le prix par jour"],
        },
      };
    }

    if (updateData.pricePerMonth && updateData.pricePerMonth < updateData.pricePerDay * 25) {
      return {
        success: false,
        error: "Le prix par mois doit être au moins 25 fois le prix par jour",
        fieldErrors: {
          pricePerMonth: ["Le prix par mois doit être au moins 25 fois le prix par jour"],
        },
      };
    }

    // Vérifier que le dépôt n'est pas supérieur à 100 fois le prix par jour
    // (augmenté pour permettre des dépôts plus élevés pour les véhicules de luxe)
    if (updateData.deposit > updateData.pricePerDay * 100) {
      return {
        success: false,
        error: "Le dépôt ne peut pas être supérieur à 100 fois le prix par jour",
        fieldErrors: {
          deposit: ["Le dépôt ne peut pas être supérieur à 100 fois le prix par jour"],
        },
      };
    }

    // Vérifier que toutes les URLs d'images sont bien des URLs Cloudinary valides
    const cloudinaryUrlPattern = /^https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/.+/;
    for (const imageUrl of updateData.images) {
      if (!cloudinaryUrlPattern.test(imageUrl)) {
        return {
          success: false,
          error: "Toutes les images doivent provenir de Cloudinary",
          fieldErrors: {
            images: ["Une ou plusieurs images ne proviennent pas de Cloudinary"],
          },
        };
      }
    }

    // Vérifier que les équipements ne contiennent pas de caractères dangereux
    const dangerousPattern = /[<>\"'%;()&+]/;
    for (const feature of updateData.features) {
      if (dangerousPattern.test(feature)) {
        return {
          success: false,
          error: "Les équipements contiennent des caractères invalides",
          fieldErrors: {
            features: ["Les équipements contiennent des caractères invalides"],
          },
        };
      }
    }

    // Vérifier que la description ne contient pas de caractères dangereux si elle existe
    if (updateData.description) {
      const scriptPattern = /<script|javascript:|on\w+\s*=/i;
      if (scriptPattern.test(updateData.description)) {
        return {
          success: false,
          error: "La description contient du code potentiellement dangereux",
          fieldErrors: {
            description: ["La description contient du code potentiellement dangereux"],
          },
        };
      }
    }

    // Vérifier que le kilométrage est réaliste par rapport à l'année
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - updateData.year;
    const maxRealisticMileage = vehicleAge * 50000; // Maximum 50 000 km par an
    if (updateData.mileage > maxRealisticMileage && vehicleAge > 0) {
      return {
        success: false,
        error: `Le kilométrage semble irréaliste pour un véhicule de ${updateData.year} (maximum ${maxRealisticMileage.toLocaleString()} km attendu)`,
        fieldErrors: {
          mileage: [`Le kilométrage semble irréaliste pour un véhicule de ${updateData.year}`],
        },
      };
    }

    // Vérifier que la plaque d'immatriculation n'est pas déjà utilisée par un autre véhicule
    if (updateData.licensePlate !== existingVehicle.licensePlate) {
      const vehicleWithSamePlate = await prisma.vehicle.findUnique({
        where: { licensePlate: updateData.licensePlate },
      });

      if (vehicleWithSamePlate && vehicleWithSamePlate.id !== id) {
        return {
          success: false,
          error: "Un véhicule avec cette plaque d'immatriculation existe déjà",
          fieldErrors: {
            licensePlate: ["Cette plaque d'immatriculation est déjà utilisée"],
          },
        };
      }
    }

    // Vérifier que la localisation existe, sinon créer Paris si locationId = "PARIS"
    let location = await prisma.location.findUnique({
      where: { id: updateData.locationId },
    });

    // Si locationId = "PARIS" et que la location n'existe pas, créer Paris
    if (!location && updateData.locationId === "PARIS") {
      console.log("📍 DEBUG: Création de la location Paris car elle n'existe pas");
      location = await prisma.location.create({
        data: {
          name: "Agence Paris",
          city: "Paris",
          address: "À définir",
          postalCode: "75000",
          country: "France",
          phone: "",
          email: "",
          active: true,
          openingHours: {
            monday: { open: "09:00", close: "18:00" },
            tuesday: { open: "09:00", close: "18:00" },
            wednesday: { open: "09:00", close: "18:00" },
            thursday: { open: "09:00", close: "18:00" },
            friday: { open: "09:00", close: "18:00" },
            saturday: { open: "09:00", close: "18:00" },
            sunday: { closed: true },
          },
        },
      });
      console.log("📍 DEBUG: Location Paris créée avec l'ID:", location.id);
    }

    if (!location) {
      console.log("❌ DEBUG: Localisation introuvable - locationId:", updateData.locationId);
      return {
        success: false,
        error: "Localisation introuvable",
        fieldErrors: {
          locationId: ["Localisation introuvable"],
        },
      };
    }

    // Identifier les images supprimées et les nouvelles images ajoutées
    const oldImages = existingVehicle.images || [];
    // @ts-expect-error - imagePublicIds existe dans le schéma mais TypeScript ne le reconnaît pas encore
    const oldPublicIds: string[] = existingVehicle.imagePublicIds || [];
    const newImages = updateData.images || [];
    const newPublicIds = updateData.imagePublicIds || [];
    
    // Trouver les images supprimées avec leurs publicIds
    const deletedImages: Array<{ url: string; publicId: string }> = [];
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

    // Vérifier si la marque ou le modèle a changé
    const brandChanged = existingVehicle.brand !== updateData.brand;
    const modelChanged = existingVehicle.model !== updateData.model;
    const needsImageMove = brandChanged || modelChanged;

    // Si la marque ou le modèle a changé, déplacer les images existantes vers le nouveau dossier
    let finalImages = newImages;
    let finalPublicIds = updateData.imagePublicIds || [];
    
    // Extraire le chemin de l'ancien dossier depuis tous les publicIds existants
    const oldFolderPaths = new Set<string>();
    oldPublicIds.forEach((publicId: string) => {
      if (publicId) {
        const lastSlashIndex = publicId.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
          const folderPath = publicId.substring(0, lastSlashIndex);
          oldFolderPaths.add(folderPath);
        }
      }
    });
    
    if (needsImageMove && existingImages.length > 0) {
      console.log(`📁 Déplacement de ${existingImages.length} image(s) vers le nouveau dossier (${updateData.brand} ${updateData.model})`);
      
      // Récupérer les publicIds correspondants aux images existantes
      const existingPublicIds = oldPublicIds
        .map((publicId: string, index: number) => existingImages.includes(oldImages[index]) ? publicId : null)
        .filter((id: string | null): id is string => id !== null && id !== "");
      
      const moveResult = await moveImagesAction(existingImages, updateData.brand, updateData.model, existingPublicIds);
      
      if (moveResult.success) {
        // Remplacer les anciennes URLs par les nouvelles dans la liste complète
        // Et mettre à jour les publicIds correspondants
        finalImages = newImages.map((url) => {
          const index = existingImages.indexOf(url);
          if (index !== -1 && moveResult.newUrls[index]) {
            return moveResult.newUrls[index];
          }
          return url;
        });
        
        // Mettre à jour les publicIds pour les images déplacées
        // Utiliser directement les nouveaux publicIds retournés par Cloudinary
        finalPublicIds = (updateData.imagePublicIds || []).map((publicId, index) => {
          const url = newImages[index];
          const existingIndex = existingImages.indexOf(url);
          if (existingIndex !== -1 && moveResult.newPublicIds[existingIndex]) {
            // Utiliser le nouveau publicId retourné directement par Cloudinary
            return moveResult.newPublicIds[existingIndex];
          }
          return publicId;
        });
        
        console.log(`✅ Images déplacées avec succès vers vehicles/${updateData.brand.toLowerCase()}-${updateData.model.toLowerCase()}`);
        
        // Supprimer TOUTES les images restantes dans les anciens dossiers
        // (au cas où certaines n'auraient pas été déplacées ou supprimées)
        for (const oldFolderPath of oldFolderPaths) {
          console.log(`🧹 Suppression de toutes les images restantes dans l'ancien dossier: ${oldFolderPath}`);
          await cleanupEmptyFolder(oldFolderPath).catch((error) => {
            console.error(`Erreur lors du nettoyage de l'ancien dossier ${oldFolderPath}:`, error);
          });
        }
      } else {
        console.error("⚠️ Erreur lors du déplacement des images:", moveResult.errors);
        // On continue avec les anciennes URLs si le déplacement échoue
      }
    }

    // Supprimer les images retirées de Cloudinary AVANT la mise à jour
    if (deletedImages.length > 0) {
      console.log(`🗑️ Suppression de ${deletedImages.length} image(s) retirée(s) de Cloudinary`);
      
      // Supprimer les images de Cloudinary en utilisant les publicIds stockés
      const deletePromises = deletedImages
        .filter((img) => img.publicId) // Filtrer celles qui ont un publicId
        .map((img) => deleteImageByPublicIdAction(img.publicId));
      
      await Promise.allSettled(deletePromises).catch((error) => {
        console.error("Erreur lors de la suppression des images de Cloudinary:", error);
        // On continue quand même la mise à jour du véhicule
      });

      // Nettoyer les dossiers vides après suppression
      // Extraire les chemins de dossiers uniques des images supprimées en utilisant les publicIds
      const folderPaths = new Set<string>();
      for (const deletedImage of deletedImages) {
        if (deletedImage.publicId) {
          const lastSlashIndex = deletedImage.publicId.lastIndexOf('/');
          if (lastSlashIndex !== -1) {
            const folderPath = deletedImage.publicId.substring(0, lastSlashIndex);
            folderPaths.add(folderPath);
          }
        }
      }

      // Nettoyer chaque dossier potentiellement vide (seulement s'il est vraiment vide)
      // On attend un peu pour que Cloudinary se synchronise après les suppressions
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      for (const folderPath of folderPaths) {
        await cleanupEmptyFolder(folderPath).catch((error) => {
          console.error(`Erreur lors du nettoyage du dossier ${folderPath}:`, error);
          // On continue même en cas d'erreur
        });
      }
    }

    // Mettre à jour le véhicule dans la BDD
    // Si ça échoue, on devra supprimer les nouvelles images uploadées
    let vehicle;
    try {
      vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        brand: updateData.brand,
        model: updateData.model,
        year: updateData.year,
        licensePlate: updateData.licensePlate,
        mileage: updateData.mileage,
        category: updateData.category,
        seats: updateData.seats,
        transmission: updateData.transmission,
        fuelType: updateData.fuelType,
        color: updateData.color,
        pricePerDay: updateData.pricePerDay,
        pricePerWeek: updateData.pricePerWeek,
        pricePerMonth: updateData.pricePerMonth,
        deposit: updateData.deposit,
        locationId: location.id, // Utiliser l'ID réel de la location (créée ou existante)
        features: updateData.features || [],
        images: finalImages, // Utiliser les images avec les nouvelles URLs si déplacées
        // @ts-expect-error - imagePublicIds existe dans le schéma mais TypeScript ne le reconnaît pas encore
        imagePublicIds: finalPublicIds, // Utiliser les publicIds mis à jour si images déplacées
        description: updateData.description,
        // Ne pas modifier le status lors de la mise à jour
      },
    });
    } catch (updateError) {
      // Si la mise à jour échoue, supprimer les nouvelles images uploadées de Cloudinary
      // pour éviter d'avoir des images orphelines
      if (addedImages.length > 0) {
        console.error("❌ Erreur lors de la mise à jour du véhicule, suppression des nouvelles images uploadées");
        // Supprimer les nouvelles images uploadées en utilisant leurs publicIds
        const addedPublicIds = newPublicIds.filter((_, index) => addedImages.includes(newImages[index]));
        const deletePromises = addedPublicIds
          .filter((publicId) => publicId)
          .map((publicId) => deleteImageByPublicIdAction(publicId));
        await Promise.allSettled(deletePromises).catch((deleteError: unknown) => {
          console.error("Erreur lors du nettoyage des images après échec de mise à jour:", deleteError);
        });
      }
      throw updateError;
    }

    // Si tout s'est bien passé, on log la synchronisation
    if (addedImages.length > 0) {
      console.log(`✅ ${addedImages.length} nouvelle(s) image(s) synchronisée(s) avec la BDD`);
    }
    if (deletedImages.length > 0) {
      console.log(`✅ ${deletedImages.length} image(s) supprimée(s) de Cloudinary et de la BDD`);
    }

    // Invalider le cache des véhicules
    const { invalidateVehicleCache } = await import("@/lib/cache-invalidation");
    await invalidateVehicleCache(id).catch((error) => {
      console.error("Error invalidating vehicle cache:", error);
      // Ne pas faire échouer la mise à jour si l'invalidation échoue
    });

    return {
      success: true,
      data: {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
      },
    };
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour du véhicule",
    };
  }
}

