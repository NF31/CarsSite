import type { Prisma } from '@/lib/prisma'

/**
 * Sélection Prisma pour récupérer une réservation existante
 */
export const EXISTING_BOOKING_SELECT: Prisma.BookingSelect = {
  id: true,
  reference: true,
  userId: true,
  vehicleId: true,
  pickupLocationId: true,
  returnLocationId: true,
  startDate: true,
  endDate: true,
  status: true,
  totalPrice: true,
  depositPaid: true,
  remainingAmount: true,
  serviceIds: true,
};

/**
 * Sélection Prisma pour la réservation mise à jour
 */
export const UPDATED_BOOKING_SELECT: Prisma.BookingSelect = {
  id: true,
  reference: true,
  vehicleId: true,
  status: true,
  startDate: true,
  endDate: true,
  totalPrice: true,
  depositPaid: true,
  remainingAmount: true,
};

