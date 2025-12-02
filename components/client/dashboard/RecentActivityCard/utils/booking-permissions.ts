import { BookingStatus } from "@prisma/client";
import type { ClientRecentBooking } from "@/actions/client/bookings/get-recent";

/**
 * Détermine si une réservation peut être modifiée
 */
export function canEditBooking(booking: ClientRecentBooking, now: Date): boolean {
  const startDate = new Date(booking.startDate);
  return startDate > now && booking.derivedStatus !== BookingStatus.PENDING;
}

/**
 * Détermine si une réservation peut être annulée
 */
export function canCancelBooking(booking: ClientRecentBooking, now: Date): boolean {
  const startDate = new Date(booking.startDate);
  return (
    startDate > now &&
    !booking.isCancellationPending &&
    (booking.derivedStatus === BookingStatus.PENDING ||
      booking.derivedStatus === BookingStatus.CONFIRMED)
  );
}

