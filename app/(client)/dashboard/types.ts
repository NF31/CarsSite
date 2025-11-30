import type { Prisma } from "@prisma/client";

/**
 * Types pour la page dashboard
 */

export type DashboardBooking = Prisma.BookingGetPayload<{
  include: {
    vehicle: {
      select: {
        brand: true;
        model: true;
        licensePlate: true;
      };
    };
    pickupLocation: {
      select: {
        name: true;
        city: true;
        address: true;
      };
    };
    returnLocation: {
      select: {
        name: true;
        city: true;
        address: true;
      };
    };
    serviceIds: true;
    invoices: {
      select: {
        id: true;
        invoiceNumber: true;
        status: true;
        total: true;
      };
    };
  };
}>;

export type DashboardBookingWithCancellation = DashboardBooking & {
  cancellationRequested?: boolean | null;
  cancellationRequestedAt?: Date | null;
  cancellationRequestedRefundRate?: number | null;
};

export type DashboardSearchParams =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | Promise<Record<string, string | string[] | undefined>>
  | undefined;

export interface DashboardPageProps {
  searchParams?: DashboardSearchParams;
}

export const RECENT_ACTIVITY_PAGE_SIZE = 5;

