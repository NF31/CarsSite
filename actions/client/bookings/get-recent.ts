"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BookingStatus, InvoiceStatus } from "@prisma/client";

const DEFAULT_LIMIT = 5;

function deriveBookingStatus(start: Date, end: Date, status: BookingStatus, now: Date): BookingStatus {
  if (status === BookingStatus.CANCELLED) {
    return BookingStatus.CANCELLED;
  }

  if (end <= now) {
    return BookingStatus.COMPLETED;
  }

  if (start <= now && now < end) {
    return BookingStatus.IN_PROGRESS;
  }

  return status;
}

export interface ClientRecentBookingInvoice {
  id: string;
  invoiceNumber: string | null;
  status: InvoiceStatus;
  total: number;
}

export interface ClientRecentBooking {
  id: string;
  reference: string;
  startDate: string;
  endDate: string;
  derivedStatus: BookingStatus;
  status: BookingStatus;
  isCancellationPending: boolean;
  cancellationRequestedAt: string | null;
  cancellationRequestedRefundRate: number | null;
  depositPaid: number;
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string;
  } | null;
  invoices: ClientRecentBookingInvoice[];
}

export interface ClientRecentBookingsPagination {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface GetClientRecentBookingsInput {
  page?: number;
  limit?: number;
}

export interface GetClientRecentBookingsSuccess {
  bookings: ClientRecentBooking[];
  pagination: ClientRecentBookingsPagination;
}

export interface GetClientRecentBookingsResult {
  success: boolean;
  data?: GetClientRecentBookingsSuccess;
  error?: string;
}

export async function getClientRecentBookingsAction(
  input: GetClientRecentBookingsInput = {},
): Promise<GetClientRecentBookingsResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Non autorisé.",
      };
    }

    const rawPage = typeof input.page === "number" && Number.isFinite(input.page) ? input.page : 1;
    const rawLimit =
      typeof input.limit === "number" && Number.isFinite(input.limit) ? input.limit : DEFAULT_LIMIT;

    const page = rawPage > 0 ? rawPage : 1;
    const limit = rawLimit > 0 ? rawLimit : DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where = {
      userId: session.user.id,
      startDate: {
        lte: now,
      },
    };

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy: {
          startDate: "desc",
        },
        include: {
          vehicle: {
            select: {
              brand: true,
              model: true,
              licensePlate: true,
            },
          },
          invoices: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              total: true,
            },
            orderBy: {
              issuedAt: "desc",
            },
          },
        },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const normalizedPage = Math.min(page, totalPages);

    const normalizedSkip = (normalizedPage - 1) * limit;
    const bookingsForPage =
      normalizedPage === page
        ? bookings
        : await prisma.booking.findMany({
            where,
            orderBy: {
              startDate: "desc",
            },
            include: {
              vehicle: {
                select: {
                  brand: true,
                  model: true,
                  licensePlate: true,
                },
              },
              invoices: {
                select: {
                  id: true,
                  invoiceNumber: true,
                  status: true,
                  total: true,
                },
                orderBy: {
                  issuedAt: "desc",
                },
              },
            },
            skip: normalizedSkip,
            take: limit,
          });

    const data: ClientRecentBooking[] = bookingsForPage.map((booking) => {
      const derivedStatus = deriveBookingStatus(
        booking.startDate,
        booking.endDate,
        booking.status,
        now,
      );

      return {
        id: booking.id,
        reference: booking.reference,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        derivedStatus,
        status: booking.status,
        isCancellationPending: booking.cancellationRequested ?? false,
        cancellationRequestedAt: booking.cancellationRequestedAt
          ? booking.cancellationRequestedAt.toISOString()
          : null,
        cancellationRequestedRefundRate: booking.cancellationRequestedRefundRate ?? null,
        depositPaid: booking.depositPaid ?? 0,
        vehicle: booking.vehicle
          ? {
              brand: booking.vehicle.brand,
              model: booking.vehicle.model,
              licensePlate: booking.vehicle.licensePlate,
            }
          : null,
        invoices: booking.invoices.map((invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          total: invoice.total,
        })),
      };
    });

    return {
      success: true,
      data: {
        bookings: data,
        pagination: {
          total,
          limit,
          page: normalizedPage,
          totalPages,
          hasNext: normalizedPage < totalPages,
          hasPrev: normalizedPage > 1,
        },
      },
    };
  } catch (error) {
    console.error("[Client Dashboard] get recent bookings action error", error);
    return {
      success: false,
      error: "Impossible de charger vos réservations récentes.",
    };
  }
}


