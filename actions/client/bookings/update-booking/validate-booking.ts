import { BookingStatus } from "@prisma/client";
import { canModifyBooking } from "@/lib/booking-status-sync";

export interface BookingValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valide qu'une réservation peut être modifiée
 */
export function validateBookingForUpdate(
  booking: {
    userId: string;
    startDate: Date;
    status: BookingStatus;
    cancellationRequested: boolean | null;
    modificationRequested: boolean | null;
  },
  userId: string,
  now: Date = new Date()
): BookingValidationResult {
  if (booking.userId !== userId) {
    return {
      valid: false,
      error: "Réservation introuvable.",
    };
  }

  if (booking.startDate <= now) {
    return {
      valid: false,
      error: "Cette réservation a déjà commencé et ne peut plus être modifiée.",
    };
  }

  if (
    booking.status === BookingStatus.CANCELLED ||
    booking.status === BookingStatus.COMPLETED
  ) {
    return {
      valid: false,
      error: "Cette réservation ne peut plus être modifiée.",
    };
  }

  const { canModify, reason } = canModifyBooking({
    currentStatus: booking.status,
    cancellationRequested: booking.cancellationRequested ?? false,
    modificationRequested: booking.modificationRequested ?? false,
    startDate: booking.startDate,
  });

  if (!canModify) {
    return {
      valid: false,
      error: reason || "Cette réservation ne peut pas être modifiée.",
    };
  }

  return { valid: true };
}

