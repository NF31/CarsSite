import type { Prisma } from "@prisma/client";

/**
 * Sélection Prisma pour récupérer les réservations avec toutes les relations nécessaires
 */
export const BOOKING_INCLUDE: Prisma.BookingInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      driverLicense: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      brand: true,
      model: true,
      licensePlate: true,
      category: true,
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
};

