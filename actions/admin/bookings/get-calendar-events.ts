"use server";

import prisma from '@/lib/prisma'
import { mapBookingToCalendarEvent } from "@/lib/bookings/calendar";

export interface CalendarRange {
  start: string;
  end: string;
}

export async function getCalendarEventsAction(range: CalendarRange) {
  try {
    if (!range?.start || !range?.end) {
      throw new Error("Plage de dates invalide.");
    }

    const start = new Date(range.start);
    const end = new Date(range.end);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("Impossible d'interpréter les dates fournies.");
    }

    const bookings = await prisma.booking.findMany({
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

    const events = bookings.map(mapBookingToCalendarEvent);

    return {
      success: true,
      data: events,
    };
  } catch (error) {
    console.error("[BookingsCalendar] Erreur lors du chargement des évènements:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Une erreur inattendue est survenue lors du chargement du calendrier.",
    };
  }
}

