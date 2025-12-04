import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/lib/types/booking-status";

export async function checkOverlappingBooking(
  vehicleId: string,
  startDate: Date,
  endDate: Date
): Promise<{ hasOverlap: boolean; reference?: string }> {
  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      vehicleId,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
      },
      startDate: {
        lt: endDate,
      },
      endDate: {
        gt: startDate,
      },
    },
    select: {
      reference: true,
    },
  });

  if (overlappingBooking) {
    return {
      hasOverlap: true,
      reference: overlappingBooking.reference,
    };
  }

  return { hasOverlap: false };
}

