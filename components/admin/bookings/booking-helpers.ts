import type { BookingStatus } from "@/lib/types/booking-status";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900 border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-900 border-blue-200",
  IN_PROGRESS: "bg-purple-100 text-purple-900 border-purple-200",
  COMPLETED: "bg-green-100 text-green-900 border-green-200",
  CANCELLED: "bg-red-100 text-red-900 border-red-200",
};

export const bookingCurrencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});


