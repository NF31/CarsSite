import { BookingStatus } from "@/lib/types/booking-status";
import type { BookingListItem } from "./types";
import { formatPeriod } from "./utils/format-period";
import { normalizeStatus, type BookingForStatusNormalization } from "./utils/normalize-status";

export interface BookingWithRelations {
  id: string;
  reference: string;
  status: BookingStatus;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  totalPrice: number;
  depositPaid: number;
  remainingAmount: number;
  securityDepositPaid: number | null;
  serviceIds: string[] | null;
  notes: string | null;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    driverLicense: string | null;
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    category: string;
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

/**
 * Mappe les réservations Prisma vers le format BookingListItem
 */
export function mapBookings(
  bookings: BookingWithRelations[],
  currentDate: Date
): BookingListItem[] {
  return bookings.map((booking) => ({
    id: booking.id,
    reference: booking.reference,
    status: normalizeStatus(
      {
        status: booking.status,
        startDate: booking.startDate,
        endDate: booking.endDate,
      } as BookingForStatusNormalization,
      currentDate
    ),
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    period: formatPeriod(booking.startDate, booking.endDate),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    cancelledAt: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
    totalPrice: booking.totalPrice,
    depositPaid: booking.depositPaid,
    remainingAmount: booking.remainingAmount,
    securityDepositPaid: booking.securityDepositPaid,
    servicesCount: booking.serviceIds?.length || 0,
    notes: booking.notes ?? null,
    user: {
      id: booking.user.id,
      name: booking.user.name,
      email: booking.user.email,
      phone: booking.user.phone,
      hasDriverLicense: Boolean(booking.user.driverLicense),
    },
    vehicle: {
      id: booking.vehicle.id,
      brand: booking.vehicle.brand,
      model: booking.vehicle.model,
      licensePlate: booking.vehicle.licensePlate,
      category: booking.vehicle.category,
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
  }));
}

