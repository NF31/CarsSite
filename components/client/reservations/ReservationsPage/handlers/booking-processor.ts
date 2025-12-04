import { BookingStatus } from "@/lib/types/booking-status";
import { InvoiceStatus } from "@/lib/types/invoice-status";
import { deriveBookingStatus } from "@/lib/booking-status-sync";

export type ProcessedBooking = {
  id: string;
  reference: string;
  status: BookingStatus;
  startDate: Date;
  endDate: Date;
  startDateISO: string;
  endDateISO: string;
  derivedStatus: BookingStatus;
  isCancellationPending: boolean;
  cancellationRequestedAtISO: string | null;
  cancellationRequestedRefundRate: number | null;
  depositPaid: number;
  totalPrice: number | null;
  vehicleId: string;
  serviceIds: string[];
  notes: string | null;
  createdAt: Date | null;
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string | null;
  } | null;
  pickupLocation: {
    name: string;
    city: string;
    address: string | null;
  } | null;
  returnLocation: {
    name: string;
    city: string;
    address: string | null;
  } | null;
  invoices: Array<{
    id: string;
    invoiceNumber: string | null;
    status: InvoiceStatus;
    total: number;
  }>;
};

export function processBookings(
  bookings: Array<{
    id: string;
    reference: string;
    status: BookingStatus;
    startDate: Date;
    endDate: Date;
    totalPrice: number | null;
    depositPaid: number | null;
    vehicleId: string;
    serviceIds: string[];
    notes: string | null;
    createdAt: Date | null;
    vehicle: {
      brand: string;
      model: string;
      licensePlate: string | null;
    } | null;
    pickupLocation: {
      name: string;
      city: string;
      address: string | null;
    } | null;
    returnLocation: {
      name: string;
      city: string;
      address: string | null;
    } | null;
    invoices: Array<{
      id: string;
      invoiceNumber: string | null;
      status: InvoiceStatus;
      total: number;
    }>;
    cancellationRequested: boolean | null;
    cancellationRequestedAt: Date | null;
    cancellationRequestedRefundRate: number | null;
  }>,
  now: Date
): ProcessedBooking[] {
  return bookings.map((booking) => {
    const derivedStatus = deriveBookingStatus({
      status: booking.status,
      startDate: booking.startDate,
      endDate: booking.endDate,
      cancellationRequested: booking.cancellationRequested ?? false,
      modificationRequested: false,
      now,
    });

    return {
      ...booking,
      startDateISO: booking.startDate.toISOString(),
      endDateISO: booking.endDate.toISOString(),
      derivedStatus,
      isCancellationPending: booking.cancellationRequested ?? false,
      cancellationRequestedAtISO: booking.cancellationRequestedAt
        ? booking.cancellationRequestedAt.toISOString()
        : null,
      cancellationRequestedRefundRate: booking.cancellationRequestedRefundRate ?? null,
      depositPaid: booking.depositPaid ?? 0,
    };
  });
}

export function filterUpcomingBookings(bookings: ProcessedBooking[], now: Date): ProcessedBooking[] {
  return bookings
    .filter(
      (booking) =>
        booking.startDate > now &&
        booking.derivedStatus !== BookingStatus.CANCELLED &&
        booking.derivedStatus !== BookingStatus.IN_PROGRESS
    )
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

export function filterInProgressBookings(bookings: ProcessedBooking[]): ProcessedBooking[] {
  return bookings
    .filter((booking) => booking.derivedStatus === BookingStatus.IN_PROGRESS)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

export function filterPastBookings(bookings: ProcessedBooking[]): ProcessedBooking[] {
  return bookings
    .filter(
      (booking) =>
        booking.derivedStatus === BookingStatus.COMPLETED ||
        booking.derivedStatus === BookingStatus.CANCELLED
    )
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
}

