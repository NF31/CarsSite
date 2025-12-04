import { BookingStatus } from "@/lib/types/booking-status";
import { MaintenanceStatus } from "@/lib/types/maintenance-status";
import { MaintenanceType } from "@/lib/types/maintenance-type";

/**
 * Statuts de réservation qui indiquent qu'un véhicule est occupé
 */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
];

/**
 * Statuts de maintenance qui indiquent qu'un véhicule est en maintenance
 */
export const ACTIVE_MAINTENANCE_STATUSES: MaintenanceStatus[] = [
  MaintenanceStatus.SCHEDULED,
  MaintenanceStatus.IN_PROGRESS,
];

/**
 * Types de maintenance qui ne bloquent pas la réservation
 */
export const NON_BLOCKING_MAINTENANCE_TYPES: MaintenanceType[] = [
  MaintenanceType.BLOCKED,
];

