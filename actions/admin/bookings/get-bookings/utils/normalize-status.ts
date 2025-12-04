import { BookingStatus } from "@/lib/types/booking-status";

export interface BookingForStatusNormalization {
  status: BookingStatus;
  startDate: Date;
  endDate: Date;
}

/**
 * Normalise le statut d'une réservation en fonction des dates
 */
export function normalizeStatus(
  booking: BookingForStatusNormalization,
  currentDate: Date
): BookingStatus {
  const { status, startDate, endDate } = booking;

  if (status === BookingStatus.CANCELLED) {
    return BookingStatus.CANCELLED;
  }

  if (endDate <= currentDate) {
    return BookingStatus.COMPLETED;
  }

  if (startDate <= currentDate && currentDate < endDate) {
    return BookingStatus.IN_PROGRESS;
  }

  return status;
}

