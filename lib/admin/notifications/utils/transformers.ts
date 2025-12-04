import { BookingStatus } from "@/lib/types/booking-status";
import type { BookingNotificationType, BookingNotificationItem } from "../types";

type BookingData = {
  id: string;
  reference: string;
  startDate: Date;
  endDate: Date;
  updatedAt: Date;
  status: BookingStatus;
  depositPaid: number | null;
  cancellationRequested: boolean;
  cancellationReason: string | null;
  cancellationRequestedAt: Date | null;
  cancellationRequestedRefundRate: number | null;
  originalStartDate: Date | null;
  originalEndDate: Date | null;
  user: {
    name: string | null;
    email: string;
  } | null;
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string | null;
  } | null;
};

export function determineNotificationType(
  booking: BookingData
): { type: BookingNotificationType; requiresAction: boolean } {
  if (booking.cancellationRequested) {
    return { type: "cancellation", requiresAction: true };
  }
  
  if (booking.status === BookingStatus.PENDING) {
    return { type: "modification", requiresAction: true };
  }
  
  if (booking.status === BookingStatus.CONFIRMED && (booking.depositPaid ?? 0) > 0) {
    // Détecter spécifiquement les paiements de modification
    const isModificationPayment = !!(booking.originalStartDate || booking.originalEndDate);
    return {
      type: isModificationPayment ? "modificationPayment" : "payment",
      requiresAction: false,
    };
  }
  
  return { type: "creation", requiresAction: true };
}

export function mapBookingToNotificationItem(
  booking: BookingData
): BookingNotificationItem {
  const { type, requiresAction } = determineNotificationType(booking);
  
  return {
    id: booking.id,
    reference: booking.reference,
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    userName: booking.user?.name ?? "Client inconnu",
    userEmail: booking.user?.email ?? "",
    vehicleLabel: booking.vehicle
      ? `${booking.vehicle.brand} ${booking.vehicle.model}`
      : "Véhicule non renseigné",
    vehiclePlate: booking.vehicle?.licensePlate ?? null,
    type,
    cancellationReason: booking.cancellationReason,
    cancellationRequestedAt: booking.cancellationRequestedAt
      ? booking.cancellationRequestedAt.toISOString()
      : null,
    cancellationRefundRate: booking.cancellationRequestedRefundRate,
    depositPaid: booking.depositPaid ?? 0,
    requiresAction,
  };
}

