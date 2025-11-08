"use server";

import { prisma } from "@/lib/prisma";
import type { BookingStatus, Prisma } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface GetBookingsFilters {
  status?: BookingStatus;
  pickupLocationId?: string;
  returnLocationId?: string;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: "startDate" | "endDate" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface BookingListItem {
  id: string;
  reference: string;
  status: BookingStatus;
  startDate: string;
  endDate: string;
  period: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  totalPrice: number;
  depositPaid: number;
  remainingAmount: number;
  servicesCount: number;
  notes: string | null;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    hasDriverLicense: boolean;
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

export interface GetBookingsResult {
  success: boolean;
  data?: {
    bookings: BookingListItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error?: string;
}

export async function getBookingsAction(
  filters: GetBookingsFilters = {}
): Promise<GetBookingsResult> {
  try {
    const {
      status,
      pickupLocationId,
      returnLocationId,
      search,
      startDateFrom,
      startDateTo,
      page = 1,
      limit = 12,
      sortBy = "startDate",
      sortOrder = "desc",
    } = filters;

    const parsedLimit = Math.min(Math.max(limit, 1), 48);
    const currentPage = Math.max(page, 1);

    const where: Prisma.BookingWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (pickupLocationId) {
      where.pickupLocationId = pickupLocationId;
    }

    if (returnLocationId) {
      where.returnLocationId = returnLocationId;
    }

    if (startDateFrom || startDateTo) {
      where.startDate = {};
      if (startDateFrom) {
        const fromDate = new Date(startDateFrom);
        if (!Number.isNaN(fromDate.getTime())) {
          where.startDate.gte = fromDate;
        }
      }
      if (startDateTo) {
        const toDate = new Date(startDateTo);
        if (!Number.isNaN(toDate.getTime())) {
          where.startDate.lte = toDate;
        }
      }
    }

    if (search) {
      const trimmed = search.trim();
      if (trimmed.length > 0) {
        where.OR = [
          {
            reference: {
              contains: trimmed,
              mode: "insensitive",
            },
          },
          {
            user: {
              name: {
                contains: trimmed,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              email: {
                contains: trimmed,
                mode: "insensitive",
              },
            },
          },
          {
            vehicle: {
              brand: {
                contains: trimmed,
                mode: "insensitive",
              },
            },
          },
          {
            vehicle: {
              model: {
                contains: trimmed,
                mode: "insensitive",
              },
            },
          },
          {
            vehicle: {
              licensePlate: {
                contains: trimmed,
                mode: "insensitive",
              },
            },
          },
        ];
      }
    }

    const allowedSortFields: Record<string, true> = {
      startDate: true,
      endDate: true,
      createdAt: true,
    };

    const safeSortBy = allowedSortFields[sortBy] ? sortBy : "startDate";
    const safeSortOrder = sortOrder === "asc" ? "asc" : "desc";
    const orderBy: Prisma.BookingOrderByWithRelationInput = {
      [safeSortBy]: safeSortOrder,
    };

    const skip = (currentPage - 1) * parsedLimit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: parsedLimit,
        orderBy,
        include: {
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
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const totalPages = Math.max(Math.ceil(total / parsedLimit), 1);

    const periodFormatter = (start: Date, end: Date) =>
      `${format(start, "d MMMM yyyy 'à' HH:mm", { locale: fr })} → ${format(
        end,
        "d MMMM yyyy 'à' HH:mm",
        { locale: fr }
      )}`;

    return {
      success: true,
      data: {
        bookings: bookings.map((booking) => ({
          id: booking.id,
          reference: booking.reference,
          status: booking.status,
          startDate: booking.startDate.toISOString(),
          endDate: booking.endDate.toISOString(),
          period: periodFormatter(booking.startDate, booking.endDate),
          createdAt: booking.createdAt.toISOString(),
          updatedAt: booking.updatedAt.toISOString(),
          cancelledAt: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
          totalPrice: booking.totalPrice,
          depositPaid: booking.depositPaid,
          remainingAmount: booking.remainingAmount,
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
        })),
        pagination: {
          total,
          page: currentPage,
          limit: parsedLimit,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des réservations",
    };
  }
}


