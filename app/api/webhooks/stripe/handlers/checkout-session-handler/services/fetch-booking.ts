import prisma from "@/lib/prisma";
import { BOOKING_SELECT_FIELDS } from "../constants";

export async function fetchBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: BOOKING_SELECT_FIELDS,
  });

  if (!booking || booking.userId !== userId) {
    return null;
  }

  return booking;
}


