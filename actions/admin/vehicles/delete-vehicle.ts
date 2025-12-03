"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { deleteImageByPublicIdAction, cleanupEmptyFolder } from "./delete-image";

export interface DeleteVehicleResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Supprime un véhicule et toutes ses images associées
 */
export async function deleteVehicleAction(
  vehicleId: string
): Promise<DeleteVehicleResult> {
  try {
    // Vérifier l'authentification
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

    if (!vehicleId || vehicleId.trim() === "") {
      return {
        success: false,
        error: "ID du véhicule requis",
        fieldErrors: {
          id: ["L'ID du véhicule est requis"],
        },
      };
    }

    // Récupérer le véhicule avec ses images et publicIds
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        bookings: {
          select: { id: true },
        },
        reviews: {
          select: { id: true },
        },
      },
    });

    if (!vehicle) {
      return {
        success: false,
        error: "Véhicule introuvable",
        fieldErrors: {
          id: ["Véhicule introuvable"],
        },
      };
    }

    // Vérifier s'il y a des réservations actives
    if (vehicle.bookings.length > 0) {
      return {
        success: false,
        error: "Impossible de supprimer un véhicule avec des réservations actives",
        fieldErrors: {
          bookings: [`Ce véhicule a ${vehicle.bookings.length} réservation(s) active(s)`],
        },
      };
    }

    // Supprimer toutes les images de Cloudinary
    const imagePublicIds: string[] = vehicle.imagePublicIds || [];
    if (imagePublicIds.length > 0) {
      console.log(`🗑️ Suppression de ${imagePublicIds.length} image(s) de Cloudinary pour le véhicule ${vehicleId}`);
      
      const deletePromises = imagePublicIds
        .filter((publicId) => publicId && publicId.trim() !== "")
        .map((publicId) => deleteImageByPublicIdAction(publicId));
      
      await Promise.allSettled(deletePromises).catch((error) => {
        console.error("Erreur lors de la suppression des images de Cloudinary:", error);
        // On continue quand même la suppression du véhicule
      });

      // Nettoyer les dossiers vides après suppression
      const folderPaths = new Set<string>();
      imagePublicIds.forEach((publicId: string) => {
        if (publicId) {
          const lastSlashIndex = publicId.lastIndexOf('/');
          if (lastSlashIndex !== -1) {
            const folderPath = publicId.substring(0, lastSlashIndex);
            folderPaths.add(folderPath);
          }
        }
      });

      // Attendre un peu pour que Cloudinary se synchronise
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Nettoyer chaque dossier potentiellement vide
      for (const folderPath of folderPaths) {
        await cleanupEmptyFolder(folderPath).catch((error) => {
          console.error(`Erreur lors du nettoyage du dossier ${folderPath}:`, error);
        });
      }
    }

    // Supprimer le véhicule de la BDD
    await prisma.vehicle.delete({
      where: { id: vehicleId },
    });

    console.log(`✅ Véhicule ${vehicleId} (${vehicle.brand} ${vehicle.model}) supprimé avec succès`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    
    // Gérer les erreurs de contrainte de clé étrangère
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      return {
        success: false,
        error: "Impossible de supprimer ce véhicule car il est référencé par d'autres données",
      };
    }

    return {
      success: false,
      error: "Erreur lors de la suppression du véhicule",
    };
  }
}

