import prisma from '@/lib/prisma'
import type { UpdateVehicleInput } from "@/lib/validations/vehicle";
import type { UpdateVehicleResult } from "./types";
import { cleanupAddedImagesOnError } from "./handle-vehicle-images";

interface UpdateVehicleDataParams {
  vehicleId: string;
  updateData: Omit<UpdateVehicleInput, "id">;
  locationId: string;
  finalImages: string[];
  finalPublicIds: string[];
  addedImages: string[];
  newImages: string[];
  newPublicIds: string[];
}

export async function updateVehicleData(
  params: UpdateVehicleDataParams
): Promise<UpdateVehicleResult> {
  const {
    vehicleId,
    updateData,
    locationId,
    finalImages,
    finalPublicIds,
    addedImages,
    newImages,
    newPublicIds,
  } = params;

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
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
        locationId,
        features: updateData.features || [],
        images: finalImages,
        imagePublicIds: finalPublicIds,
        description: updateData.description,
        // Ne pas modifier le status lors de la mise à jour
      },
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
  } catch (updateError) {
    // Si la mise à jour échoue, supprimer les nouvelles images uploadées
    await cleanupAddedImagesOnError(addedImages, newImages, newPublicIds);
    throw updateError;
  }
}

