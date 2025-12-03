import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { BOOKING_INCLUDE } from "./get-booking-select";
import type { BookingWithRelations } from "./map-bookings";

export interface GetBookingsDataParams {
  where: Prisma.BookingWhereInput;
  orderBy: Prisma.BookingOrderByWithRelationInput;
  skip: number;
  take: number;
}

export interface GetBookingsDataResult {
  bookings: BookingWithRelations[];
  total: number;
}

/**
 * Récupère les réservations et le total depuis la base de données
 */
export async function getBookingsData(
  params: GetBookingsDataParams
): Promise<GetBookingsDataResult> {
  const { where, orderBy, skip, take } = params;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take,
      orderBy,
      include: BOOKING_INCLUDE,
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total };
}

