"use server";

import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/lib/types/booking-status";
import { startOfMonth, endOfMonth } from "date-fns";

interface CalendarStats {
  totalBookings: number;
  activeBookings: number;
  upcomingBookings: number;
  completedThisMonth: number;
  cancelledThisMonth: number;
}

export async function getCalendarStatsAction(now: Date): Promise<CalendarStats> {
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [totalBookings, activeBookings, upcomingBookings, completedThisMonth, cancelledThisMonth] =
    await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          status: {
            not: BookingStatus.CANCELLED,
          },
          startDate: {
            lte: now,
          },
          endDate: {
            gt: now,
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
          },
          startDate: {
            gt: now,
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: {
            not: BookingStatus.CANCELLED,
          },
          endDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: BookingStatus.CANCELLED,
          updatedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
    ]);

  return {
    totalBookings,
    activeBookings,
    upcomingBookings,
    completedThisMonth,
    cancelledThisMonth,
  };
}

