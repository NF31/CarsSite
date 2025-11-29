import { BookingStatus } from "@prisma/client";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: "En attente",
  [BookingStatus.CONFIRMED]: "Confirmée",
  [BookingStatus.IN_PROGRESS]: "En cours",
  [BookingStatus.COMPLETED]: "Terminée",
  [BookingStatus.CANCELLED]: "Annulée",
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, { text: string; background: string }> = {
  [BookingStatus.PENDING]: { text: "#92400e", background: "#fef3c7" },
  [BookingStatus.CONFIRMED]: { text: "#1d4ed8", background: "#dbeafe" },
  [BookingStatus.IN_PROGRESS]: { text: "#7c3aed", background: "#ede9fe" },
  [BookingStatus.COMPLETED]: { text: "#065f46", background: "#d1fae5" },
  [BookingStatus.CANCELLED]: { text: "#991b1b", background: "#fee2e2" },
};

