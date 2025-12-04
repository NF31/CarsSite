import prisma from '@/lib/prisma'
import type { UpdateBookingInput } from "@/lib/validations/booking";

export interface BookingDataValidation {
  user: {
    id: string;
    name: string;
    email: string;
    driverLicense: string | null;
  };
  vehicle: {
    id: string;
    status: string;
    deposit: number;
    brand: string;
    model: string;
    licensePlate: string;
  };
  pickupLocation: {
    id: string;
    name: string;
  };
  returnLocation: {
    id: string;
    name: string;
  };
}

export interface ValidationError {
  success: false;
  error: string;
}

export type ValidationResult =
  | { success: true; data: BookingDataValidation }
  | ValidationError;

/**
 * Valide et récupère toutes les données nécessaires pour la mise à jour d'une réservation
 */
export async function validateBookingData(
  data: UpdateBookingInput
): Promise<ValidationResult> {
  const [user, vehicle, pickupLocation, returnLocation] = await Promise.all([
    prisma.user.findFirst({
      where: { id: data.userId },
      select: {
        id: true,
        name: true,
        email: true,
        driverLicense: true,
      },
    }),
    prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      select: {
        id: true,
        status: true,
        deposit: true,
        brand: true,
        model: true,
        licensePlate: true,
      },
    }),
    prisma.location.findUnique({
      where: { id: data.pickupLocationId },
      select: { id: true, name: true },
    }),
    prisma.location.findUnique({
      where: { id: data.returnLocationId },
      select: { id: true, name: true },
    }),
  ]);

  if (!user) {
    return { success: false, error: "Client introuvable." };
  }

  if (!user.driverLicense) {
    return {
      success: false,
      error:
        "Ce client n'a pas encore de permis de conduire enregistré. Ajoutez le document avant de modifier la réservation.",
    };
  }

  if (!vehicle) {
    return { success: false, error: "Véhicule introuvable." };
  }

  if (!pickupLocation || !returnLocation) {
    return { success: false, error: "Les agences sélectionnées sont invalides." };
  }

  return {
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name ?? "",
        email: user.email ?? "",
        driverLicense: user.driverLicense,
      },
      vehicle: {
        id: vehicle.id,
        status: vehicle.status,
        deposit: vehicle.deposit,
        brand: vehicle.brand,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
      },
      pickupLocation: {
        id: pickupLocation.id,
        name: pickupLocation.name,
      },
      returnLocation: {
        id: returnLocation.id,
        name: returnLocation.name,
      },
    },
  };
}

