import { BookingStatus } from "@/lib/types/booking-status";

export function computeDynamicStatus(booking: {
  status: BookingStatus;
  startDate: Date | string;
  endDate: Date | string;
}): BookingStatus {
  if (booking.status === BookingStatus.CANCELLED) {
    return BookingStatus.CANCELLED;
  }

  const now = new Date();
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);

  if (endDate <= now) {
    return BookingStatus.COMPLETED;
  }

  if (startDate <= now && now < endDate) {
    return BookingStatus.IN_PROGRESS;
  }

  return booking.status;
}

