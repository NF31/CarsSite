import { BookingStatus } from "@/lib/types/booking-status";
import { MaintenanceStatus } from "@/lib/types/maintenance-status";
import { MaintenanceType } from "@/lib/types/maintenance-type";
import prisma from '@/lib/prisma'

/**
 * Vérifie s'il y a des réservations qui se chevauchent
 */
export async function checkBookingOverlap(
  vehicleId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId: string
): Promise<boolean> {
  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      id: { not: excludeBookingId },
      vehicleId,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
      },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
    select: { id: true },
  });

  return Boolean(overlappingBooking);
}

/**
 * Vérifie s'il y a des maintenances qui se chevauchent
 */
export async function checkMaintenanceOverlap(
  vehicleId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  const overlappingMaintenance = await prisma.maintenance.findFirst({
    where: {
      vehicleId,
      status: {
        in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
      },
      type: {
        not: MaintenanceType.BLOCKED,
      },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
    select: { id: true },
  });

  return Boolean(overlappingMaintenance);
}

