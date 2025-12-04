import { prisma } from "@/lib/prisma";
import { MaintenanceType } from "@/lib/types/maintenance-type";
import {
  ACTIVE_BOOKING_STATUSES,
  ACTIVE_MAINTENANCE_STATUSES,
} from "./constants";

export interface OverlapError {
  success: false;
  error: string;
}

export type OverlapResult = { success: true } | OverlapError;

/**
 * Vérifie s'il y a un chevauchement avec une autre réservation
 */
export async function checkBookingOverlap(
  vehicleId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId: string
): Promise<OverlapResult> {
  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      id: { not: excludeBookingId },
      vehicleId,
      status: { in: ACTIVE_BOOKING_STATUSES },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
    select: {
      reference: true,
      startDate: true,
      endDate: true,
    },
  });

  if (overlappingBooking) {
    return {
      success: false,
      error:
        "Ce véhicule est déjà réservé sur les dates choisies. Vérifiez les réservations existantes avant de continuer.",
    };
  }

  return { success: true };
}

/**
 * Vérifie s'il y a un chevauchement avec une maintenance planifiée
 */
export async function checkMaintenanceOverlap(
  vehicleId: string,
  startDate: Date,
  endDate: Date
): Promise<OverlapResult> {
  const overlappingMaintenance = await prisma.maintenance.findFirst({
    where: {
      vehicleId,
      status: { in: ACTIVE_MAINTENANCE_STATUSES },
      type: { not: MaintenanceType.BLOCKED },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
    select: {
      id: true,
    },
  });

  if (overlappingMaintenance) {
    return {
      success: false,
      error:
        "Une maintenance est planifiée pour ce véhicule sur les dates choisies. Merci de vérifier l'agenda de maintenance.",
    };
  }

  return { success: true };
}

