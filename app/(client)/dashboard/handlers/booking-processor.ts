import { BookingStatus } from "@prisma/client";
import type { DashboardBookingWithCancellation } from "../types";

/**
 * Handler pour le traitement des réservations
 */

export interface ProcessedBooking extends DashboardBookingWithCancellation {
  derivedStatus: BookingStatus;
  isCancellationPending: boolean;
}

/**
 * Dérive le statut d'une réservation
 */
export async function deriveBookingStatusForBooking(
  booking: DashboardBookingWithCancellation,
  now: Date
): Promise<BookingStatus> {
  const { deriveBookingStatus } = await import("@/lib/booking-status-sync");
  return deriveBookingStatus({
    status: booking.status,
    startDate: booking.startDate,
    endDate: booking.endDate,
    cancellationRequested: booking.cancellationRequested ?? false,
    modificationRequested: booking.modificationRequested ?? false,
    now,
  });
}

/**
 * Traite toutes les réservations pour ajouter le statut dérivé
 */
export async function processBookings(
  bookings: DashboardBookingWithCancellation[],
  now: Date
): Promise<ProcessedBooking[]> {
  return Promise.all(
    bookings.map(async (booking) => {
      const cancellationRequested = booking.cancellationRequested ?? false;
      const derivedStatus = await deriveBookingStatusForBooking(booking, now);
      return {
        ...booking,
        cancellationRequested,
        cancellationRequestedAt: booking.cancellationRequestedAt ?? null,
        cancellationRequestedRefundRate: booking.cancellationRequestedRefundRate ?? null,
        derivedStatus,
        isCancellationPending: cancellationRequested,
      };
    })
  );
}

/**
 * Filtre les réservations actives
 */
export function filterActiveBookings(bookings: ProcessedBooking[]): ProcessedBooking[] {
  return bookings.filter((booking) => booking.derivedStatus === BookingStatus.IN_PROGRESS);
}

/**
 * Filtre les prochaines réservations (limitées à 3)
 */
export function filterUpcomingBookings(
  bookings: ProcessedBooking[],
  now: Date
): ProcessedBooking[] {
  return bookings
    .filter(
      (booking) =>
        booking.startDate > now &&
        booking.derivedStatus !== BookingStatus.CANCELLED &&
        booking.derivedStatus !== BookingStatus.IN_PROGRESS
    )
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 3);
}

/**
 * Filtre les réservations passées
 */
export function filterPastBookings(bookings: ProcessedBooking[], now: Date): ProcessedBooking[] {
  return bookings.filter(
    (booking) =>
      booking.endDate < now &&
      (booking.derivedStatus === BookingStatus.COMPLETED ||
        booking.derivedStatus === BookingStatus.CANCELLED)
  );
}

