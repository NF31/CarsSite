import { formatDistanceStrict } from "date-fns";
import { fr } from "date-fns/locale";
import { BookingStatus } from "@prisma/client";
import type { ClientDetailBooking } from "@/actions/admin/clients";

export function formatRelativeBooking(booking: ClientDetailBooking): string {
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);

  return formatDistanceStrict(start, end, {
    locale: fr,
  });
}

export function computeBookingStatus(booking: ClientDetailBooking): BookingStatus {
  if (booking.status === BookingStatus.CANCELLED) {
    return BookingStatus.CANCELLED;
  }

  const now = new Date();
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);

  if (end <= now) {
    return BookingStatus.COMPLETED;
  }

  if (start <= now && now < end) {
    return BookingStatus.IN_PROGRESS;
  }

  return booking.status;
}

