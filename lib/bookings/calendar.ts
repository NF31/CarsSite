"use strict";

import { BookingStatus, type Prisma } from "@prisma/client";
import { differenceInCalendarDays, isAfter, isBefore } from "date-fns";

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        phone: true;
      };
    };
    vehicle: {
      select: {
        id: true;
        brand: true;
        model: true;
        licensePlate: true;
      };
    };
    pickupLocation: {
      select: {
        id: true;
        name: true;
        city: true;
      };
    };
    returnLocation: {
      select: {
        id: true;
        name: true;
        city: true;
      };
    };
  };
}>;

export interface BookingCalendarEvent {
  id: string;
  reference: string;
  title: string;
  start: string;
  end: string;
  status: BookingStatus;
  durationDays: number;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  vehicle: {
    id: string;
    label: string;
    licensePlate: string;
  };
  pickupLocation: {
    id: string;
    name: string;
    city: string;
  };
  returnLocation: {
    id: string;
    name: string;
    city: string;
  };
}

export function computeCalendarStatus(booking: BookingWithRelations): BookingStatus {
  if (booking.status === BookingStatus.CANCELLED) {
    return BookingStatus.CANCELLED;
  }

  const now = new Date();

  if (isBefore(booking.endDate, now) || booking.endDate.getTime() === now.getTime()) {
    return BookingStatus.COMPLETED;
  }

  if (isBefore(booking.startDate, now) && isAfter(booking.endDate, now)) {
    return BookingStatus.IN_PROGRESS;
  }

  if (booking.startDate <= now && booking.endDate > now) {
    return BookingStatus.IN_PROGRESS;
  }

  return booking.status;
}

export function mapBookingToCalendarEvent(booking: BookingWithRelations): BookingCalendarEvent {
  const status = computeCalendarStatus(booking);

  return {
    id: booking.id,
    reference: booking.reference,
    title: `${booking.vehicle.brand} ${booking.vehicle.model}`,
    start: booking.startDate.toISOString(),
    end: booking.endDate.toISOString(),
    status,
    durationDays: Math.max(differenceInCalendarDays(booking.endDate, booking.startDate), 1),
    user: {
      id: booking.user.id,
      name: booking.user.name,
      email: booking.user.email,
      phone: booking.user.phone ?? null,
    },
    vehicle: {
      id: booking.vehicle.id,
      label: `${booking.vehicle.brand} ${booking.vehicle.model}`,
      licensePlate: booking.vehicle.licensePlate,
    },
    pickupLocation: {
      id: booking.pickupLocation.id,
      name: booking.pickupLocation.name,
      city: booking.pickupLocation.city,
    },
    returnLocation: {
      id: booking.returnLocation.id,
      name: booking.returnLocation.name,
      city: booking.returnLocation.city,
    },
  };
}

