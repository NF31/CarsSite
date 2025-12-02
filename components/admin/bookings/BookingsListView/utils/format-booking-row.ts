import type { BookingListItem, FormattedBookingRow } from "../types";

/**
 * Formate une réservation avec ses métadonnées calculées
 */
export function formatBookingRow(
  booking: BookingListItem,
  index: number,
  startIndex: number
): FormattedBookingRow {
  const now = new Date();
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  const canEdit = start > now && end > now;

  return {
    booking,
    index: startIndex + index + 1,
    canEdit,
    start,
    end,
  };
}

