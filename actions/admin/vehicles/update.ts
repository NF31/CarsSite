"use server";

import { prisma } from "@/lib/prisma";
import { updateVehicleSchema, type UpdateVehicleInput } from "@/lib/validations/vehicle";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { UpdateVehicleResult } from "./update/types";
import { validateVehicleUpdate } from "./update/validate-vehicle-update";
import { ensureLocation } from "./update/ensure-location";
import { handleVehicleImages, identifyImageChanges } from "./update/handle-vehicle-images";
import { updateVehicleData } from "./update/update-vehicle-data";
import { invalidateVehicleCache } from "./update/invalidate-cache";

// Ré-exporter le type pour compatibilité
export type { UpdateVehicleResult } from "./update/types";

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

    // Valider les données de mise à jour
    const validationError = await validateVehicleUpdate({
      updateData,
      vehicleId: id,
      existingVehicle: {
        licensePlate: existingVehicle.licensePlate,
      },
    });

    if (validationError) {
      return validationError;
    }

    // Vérifier et créer la localisation si nécessaire
    const locationResult = await ensureLocation(updateData.locationId);
    if (!locationResult.success) {
      return locationResult;
    }

    // Type guard : on sait que location existe car success === true
    const locationId = "location" in locationResult ? locationResult.location.id : updateData.locationId;

    // Identifier les changements d'images
    const oldImages = existingVehicle.images || [];
    const oldPublicIds: string[] = (existingVehicle as { imagePublicIds?: string[] }).imagePublicIds || [];
    const newImages = updateData.images || [];
    const newPublicIds = updateData.imagePublicIds || [];

    const brandChanged = existingVehicle.brand !== updateData.brand;
    const modelChanged = existingVehicle.model !== updateData.model;

    const imageChanges = identifyImageChanges(
      oldImages,
      oldPublicIds,
      newImages,
      newPublicIds,
      brandChanged,
      modelChanged
    );

    // Gérer les images (déplacement, suppression)
    const processedImages = await handleVehicleImages(
      oldImages,
      oldPublicIds,
      newImages,
      newPublicIds,
      brandChanged,
      modelChanged,
      updateData.brand,
      updateData.model
    );

    // Mettre à jour le véhicule dans la BDD
    const updateResult = await updateVehicleData({
      vehicleId: id,
      updateData,
      locationId,
      finalImages: processedImages.finalImages,
      finalPublicIds: processedImages.finalPublicIds,
      addedImages: imageChanges.addedImages,
      newImages,
      newPublicIds,
    });

    if (!updateResult.success) {
      return updateResult;
    }

    // Logs de synchronisation
    if (imageChanges.addedImages.length > 0) {
      console.log(`✅ ${imageChanges.addedImages.length} nouvelle(s) image(s) synchronisée(s) avec la BDD`);
    }
    if (imageChanges.deletedImages.length > 0) {
      console.log(`✅ ${imageChanges.deletedImages.length} image(s) supprimée(s) de Cloudinary et de la BDD`);
    }

    // Invalider le cache des véhicules
    await invalidateVehicleCache(id);

    return updateResult;
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour du véhicule",
    };
  }
}
