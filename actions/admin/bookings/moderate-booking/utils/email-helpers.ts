import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookingStatus } from "@/lib/types/booking-status";
import type { BookingModerationPayload } from "../types";

/**
 * Utilitaires pour la préparation des emails
 */

/**
 * Génère le message de salutation selon l'heure
 */
export function getEmailGreeting(): string {
  const hour = new Date().getHours();
  return hour >= 18 ? "Bonsoir" : "Bonjour";
}

/**
 * Formate la période de réservation pour l'affichage
 */
export function formatBookingPeriod(startDate: Date, endDate: Date): string {
  return `${format(startDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })} → ${format(
    endDate,
    "dd MMMM yyyy 'à' HH:mm",
    { locale: fr }
  )}`;
}

/**
 * Prépare les informations de modification pour l'email
 */
export function prepareModificationInfo(data: {
  originalTotalPrice: number;
  originalDepositPaid: number;
  originalRemainingAmount: number;
  depositDifference: number;
  refundAmount?: number;
  additionalPaymentAmount?: number;
  paymentUrl?: string;
  securityDepositPaid?: number;
}) {
  const modificationInfo: {
    originalTotalPrice?: number;
    originalDepositPaid?: number;
    originalRemainingAmount?: number;
    depositDifference?: number;
    refundAmount?: number;
    additionalPaymentAmount?: number;
    paymentUrl?: string;
    securityDepositPaid?: number;
  } = {};

  modificationInfo.originalTotalPrice = data.originalTotalPrice;
  modificationInfo.originalDepositPaid = data.originalDepositPaid;
  modificationInfo.originalRemainingAmount = data.originalRemainingAmount;
  modificationInfo.depositDifference = data.depositDifference;

  if (data.depositDifference < 0 && data.refundAmount) {
    modificationInfo.refundAmount = data.refundAmount;
  } else if (data.depositDifference > 0) {
    modificationInfo.additionalPaymentAmount = data.additionalPaymentAmount || data.depositDifference;
    if (data.paymentUrl) {
      modificationInfo.paymentUrl = data.paymentUrl;
    }
  }

  if (data.securityDepositPaid && data.securityDepositPaid > 0) {
    modificationInfo.securityDepositPaid = data.securityDepositPaid;
  }

  return modificationInfo;
}

/**
 * Vérifie si les données de modification sont valides pour l'email
 */
export function hasModificationData(modificationInfo: {
  originalTotalPrice?: number;
  originalDepositPaid?: number;
  originalRemainingAmount?: number;
  depositDifference?: number;
}): boolean {
  return (
    (modificationInfo.originalTotalPrice !== undefined && modificationInfo.originalTotalPrice !== null) ||
    (modificationInfo.originalDepositPaid !== undefined && modificationInfo.originalDepositPaid !== null) ||
    (modificationInfo.depositDifference !== undefined && modificationInfo.depositDifference !== null) ||
    (modificationInfo.originalRemainingAmount !== undefined && modificationInfo.originalRemainingAmount !== null)
  );
}

/**
 * Prépare les données de booking pour l'email
 */
export function prepareBookingEmailData(
  booking: BookingModerationPayload,
  updated: {
    startDate: Date;
    endDate: Date;
    totalPrice: number | null;
    depositPaid: number | null;
    remainingAmount: number | null;
    status: BookingStatus;
  }
) {
  return {
    reference: booking.reference,
    totalPrice: updated.totalPrice ?? 0,
    depositPaid: updated.depositPaid ?? 0,
    remainingAmount: updated.remainingAmount ?? 0,
    startDate: updated.startDate,
    endDate: updated.endDate,
    status: updated.status,
    period: formatBookingPeriod(updated.startDate, updated.endDate),
  };
}

/**
 * Prépare les données de véhicule pour l'email
 */
export function prepareVehicleEmailData(booking: BookingModerationPayload) {
  return {
    label: booking.vehicle
      ? `${booking.vehicle.brand} ${booking.vehicle.model}`
      : "Véhicule",
    licensePlate: booking.vehicle?.licensePlate ?? "ND",
  };
}

/**
 * Prépare les données de localisation pour l'email
 */
export function prepareLocationsEmailData(booking: BookingModerationPayload) {
  return {
    pickup: booking.pickupLocation?.name ?? "Agence de départ",
    return: booking.returnLocation?.name ?? "Agence de retour",
  };
}

