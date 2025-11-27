"use server";

import { prisma } from "@/lib/prisma";
import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";
import { mapBookingToCalendarEvent, type CalendarRange } from "@/actions/admin/bookings";

export async function getCalendarInitialDataAction() {
  const now = new Date();
  const start = startOfMonth(subMonths(now, 1));
  const end = endOfMonth(addMonths(now, 2));

  const initialRange: CalendarRange = {
    start: start.toISOString(),
    end: end.toISOString(),
  };

  const initialBookings = await prisma.booking.findMany({
    where: {
      startDate: {
        lte: end,
      },
      endDate: {
        gte: start,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          brand: true,
          model: true,
          licensePlate: true,
        },
      },
      pickupLocation: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
      returnLocation: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },
    orderBy: {
      startDate: "asc",
    },
  });

  const initialEvents = initialBookings.map(mapBookingToCalendarEvent);

  return {
    initialRange,
    initialEvents,
  };
}

