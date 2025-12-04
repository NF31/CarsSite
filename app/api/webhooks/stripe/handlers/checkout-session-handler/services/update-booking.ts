import { BookingStatus } from "@/lib/types/booking-status";
import prisma from "@/lib/prisma";
import { UPDATED_BOOKING_SELECT_FIELDS } from "../constants";
import type { BookingUpdateData } from "../types";
import type { PaymentType } from "../../../types";

export async function updateBooking(
  bookingId: string,
  updateData: BookingUpdateData,
  paymentType: PaymentType
) {
  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: updateData,
    select: UPDATED_BOOKING_SELECT_FIELDS,
  });

  // Forcer CONFIRMED pour les paiements de modification
  if (paymentType.isModificationPayment && updatedBooking.status !== BookingStatus.CONFIRMED) {
    const correctedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
      select: { id: true, status: true, reference: true },
    });
    updatedBooking.status = correctedBooking.status;
  }

  return updatedBooking;
}


