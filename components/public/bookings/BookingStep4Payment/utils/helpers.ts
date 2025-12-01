import { PaymentOption, PaymentType } from "../types";

/**
 * Détermine le type de paiement selon l'option choisie
 */
export function getPaymentType(paymentOption: PaymentOption): PaymentType {
  if (paymentOption === "deposit") {
    return "deposit";
  } else if (paymentOption === "deposit_and_deposit") {
    return "full";
  } else if (paymentOption === "on_site") {
    return "authorization";
  }
  return "full";
}

/**
 * Combine une date et une heure en un objet Date
 */
export function combineDateAndTime(dateString: string, timeString: string): Date {
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date(dateString);
  date.setHours(
    !isNaN(hours) ? hours : 0,
    !isNaN(minutes) ? minutes : 0,
    0,
    0
  );
  return date;
}

/**
 * Extrait l'ID de réservation depuis l'URL
 */
export function getBookingIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("bookingId");
}

