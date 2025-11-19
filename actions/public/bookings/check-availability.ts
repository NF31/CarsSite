"use server";

import { prisma } from "@/lib/prisma";
import { BookingStatus, MaintenanceStatus, MaintenanceType } from "@prisma/client";
import { z } from "zod";

const checkAvailabilitySchema = z.object({
  vehicleId: z.string().min(1, "Véhicule requis"),
  startDate: z
    .string()
    .min(1, "Date de début requise")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date invalide")
    .transform((value) => new Date(value)),
  endDate: z
    .string()
    .min(1, "Date de fin requise")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date invalide")
    .transform((value) => new Date(value)),
  excludeBookingId: z.string().optional(), // ID de réservation à exclure de la vérification (pour les modifications)
});

export type CheckAvailabilityResponse =
  | {
      success: true;
      available: true;
    }
  | {
      success: true;
      available: false;
      reason: "booking_conflict" | "maintenance_conflict" | "vehicle_unavailable";
      conflict?: {
        reference?: string;
        startDate: string;
        endDate: string;
      };
      maintenance?: {
        id: string;
        type: MaintenanceType;
        startDate: string;
        endDate: string;
      };
    }
  | {
      success: false;
      error: string;
    };

export async function checkVehicleAvailabilityAction(
  rawInput: z.input<typeof checkAvailabilitySchema>
): Promise<CheckAvailabilityResponse> {
  try {
    const parsed = checkAvailabilitySchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: "Données invalides",
      };
    }

    const { vehicleId, startDate, endDate, excludeBookingId } = parsed.data;

    // Vérifier que les dates sont valides
    if (endDate <= startDate) {
      return {
        success: false,
        error: "La date de fin doit être postérieure à la date de début",
      };
    }

    const now = new Date();
    if (startDate <= now) {
      return {
        success: false,
        error: "La date de début doit être dans le futur",
      };
    }

    // Vérifier que le véhicule existe et est disponible
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!vehicle) {
      return {
        success: false,
        error: "Véhicule introuvable",
      };
    }

    if (vehicle.status === "UNAVAILABLE" || vehicle.status === "MAINTENANCE") {
      return {
        success: true,
        available: false,
        reason: "vehicle_unavailable",
      };
    }

    // Vérifier les conflits de réservation (en excluant la réservation spécifiée si fournie)
    const bookingConflictWhere: any = {
      vehicleId,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
      },
      startDate: {
        lt: endDate,
      },
      endDate: {
        gt: startDate,
      },
    };

    // Exclure la réservation spécifiée si elle est fournie (pour les modifications)
    if (excludeBookingId) {
      bookingConflictWhere.id = {
        not: excludeBookingId,
      };
    }

    const bookingConflict = await prisma.booking.findFirst({
      where: bookingConflictWhere,
      select: {
        reference: true,
        startDate: true,
        endDate: true,
      },
    });

    if (bookingConflict) {
      return {
        success: true,
        available: false,
        reason: "booking_conflict",
        conflict: {
          reference: bookingConflict.reference,
          startDate: bookingConflict.startDate.toISOString(),
          endDate: bookingConflict.endDate.toISOString(),
        },
      };
    }

    // Vérifier les conflits de maintenance
    const maintenanceConflict = await prisma.maintenance.findFirst({
      where: {
        vehicleId,
        status: {
          in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
        },
        type: {
          not: MaintenanceType.BLOCKED,
        },
        startDate: {
          lt: endDate,
        },
        endDate: {
          gt: startDate,
        },
      },
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
      },
    });

    if (maintenanceConflict) {
      return {
        success: true,
        available: false,
        reason: "maintenance_conflict",
        maintenance: {
          id: maintenanceConflict.id,
          type: maintenanceConflict.type,
          startDate: maintenanceConflict.startDate.toISOString(),
          endDate: maintenanceConflict.endDate.toISOString(),
        },
      };
    }

    return {
      success: true,
      available: true,
    };
  } catch (error) {
    console.error("[Public Booking] Erreur lors de la vérification de disponibilité", error);
    return {
      success: false,
      error: "Impossible de vérifier la disponibilité du véhicule",
    };
  }
}

