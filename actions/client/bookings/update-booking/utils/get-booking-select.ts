import type { Prisma } from '@/lib/prisma'

/**
 * Sélection Prisma pour récupérer une réservation avec toutes les informations nécessaires
 */
export const BOOKING_SELECT: Prisma.BookingSelect = {
  id: true,
  userId: true,
  reference: true,
  vehicleId: true,
  startDate: true,
  endDate: true,
  status: true,
  totalPrice: true,
  depositPaid: true,
  securityDepositPaid: true,
  remainingAmount: true,
  serviceIds: true,
  cancellationRequested: true,
  modificationRequested: true,
  user: {
    select: {
      name: true,
      email: true,
    },
  },
  vehicle: {
    select: {
      brand: true,
      model: true,
      licensePlate: true,
      pricePerDay: true,
    },
  },
  pickupLocation: {
    select: {
      name: true,
    },
  },
  returnLocation: {
    select: {
      name: true,
    },
  },
};

