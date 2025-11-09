"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Prisma, BookingStatus } from "@prisma/client";
import { UserRole } from "@prisma/client";

export type ClientStatus = "ACTIVE" | "INACTIVE" | "LOCKED";

export type ClientReservationsFilter = "all" | "with" | "without" | "returning" | "vip";

export interface GetClientsFilters {
  search?: string;
  status?: "all" | "active" | "inactive" | "locked";
  reservations?: ClientReservationsFilter;
  registrationFrom?: string;
  registrationTo?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "bookingsCount";
  sortOrder?: "asc" | "desc";
}

export interface ClientListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  status: ClientStatus;
  bookingsCount: number;
  hasDriverLicense: boolean;
  driverLicenseUrl: string | null;
  lockedUntil: string | null;
  deletedAt: string | null;
  lastBooking:
    | {
        id: string;
        startDate: string;
        endDate: string | null;
        status: BookingStatus;
        vehicle: {
          id: string;
          brand: string;
          model: string;
          licensePlate: string;
        } | null;
      }
    | null;
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  lockedClients: number;
  returningClients: number;
  newClientsLast30Days: number;
}

export interface GetClientsResult {
  success: boolean;
  data?: {
    clients: ClientListItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    stats: ClientStats;
  };
  error?: string;
  status?: number;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function getClientsAction(filters: GetClientsFilters = {}): Promise<GetClientsResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour consulter les clients.",
        status: 403,
      };
    }

    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filters.limit) || 12, 1), 50);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * ONE_DAY_MS);

    const [
      totalClients,
      activeClients,
      inactiveClients,
      lockedClients,
      returningGroups,
      newClientsLast30Days,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          role: UserRole.CLIENT,
        },
      }),
      prisma.user.count({
        where: {
          role: UserRole.CLIENT,
          deletedAt: null,
        },
      }),
      prisma.user.count({
        where: {
          role: UserRole.CLIENT,
          deletedAt: {
            not: null,
          },
        },
      }),
      prisma.user.count({
        where: {
          role: UserRole.CLIENT,
          deletedAt: null,
          lockedUntil: {
            gt: now,
          },
        },
      }),
      prisma.booking.groupBy({
        by: ["userId"],
        _count: {
          _all: true,
        },
        where: {
          user: {
            role: UserRole.CLIENT,
          },
        },
      }),
      prisma.user.count({
        where: {
          role: UserRole.CLIENT,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    const stats: ClientStats = {
      totalClients,
      activeClients,
      inactiveClients,
      lockedClients,
      returningClients: returningGroups.length,
      newClientsLast30Days,
    };

    const where: Prisma.UserWhereInput = {
      role: UserRole.CLIENT,
    };

    if (filters.status && filters.status !== "all") {
      if (filters.status === "active") {
        where.deletedAt = null;
      } else if (filters.status === "inactive") {
        where.deletedAt = {
          not: null,
        };
      } else if (filters.status === "locked") {
        where.deletedAt = null;
        where.lockedUntil = {
          gt: now,
        };
      }
    }

    if (filters.search) {
      const searchTerm = filters.search.trim();
      if (searchTerm.length > 0) {
        where.OR = [
          {
            name: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ];
      }
    }

    if (filters.registrationFrom || filters.registrationTo) {
      const createdAtFilter: Prisma.DateTimeFilter = {};
      let fromDateUtc: Date | null = null;
      if (filters.registrationTo) {
        const toDate = new Date(filters.registrationTo);
        if (!Number.isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          createdAtFilter.lte = toDate;
        }
      }
      if (filters.registrationFrom) {
        const fromDate = new Date(filters.registrationFrom);
        if (!Number.isNaN(fromDate.getTime())) {
          fromDate.setHours(0, 0, 0, 0);
          createdAtFilter.gte = fromDate;
          fromDateUtc = fromDate;
        }
      }

      if (!createdAtFilter.lte && fromDateUtc) {
        const endOfDay = new Date(fromDateUtc);
        endOfDay.setHours(23, 59, 59, 999);
        createdAtFilter.lte = endOfDay;
      }

      if (Object.keys(createdAtFilter).length > 0) {
        where.createdAt = createdAtFilter;
      }
    }

    let idsConstraint: string[] | null = null;
    const reservationsFilter = filters.reservations ?? "all";

    if (reservationsFilter === "with") {
      where.bookings = {
        some: {},
      };
    } else if (reservationsFilter === "without") {
      where.bookings = {
        none: {},
      };
    } else if (reservationsFilter === "returning" || reservationsFilter === "vip") {
      const minimumCount = reservationsFilter === "vip" ? 5 : 2;
      const matchingIds = returningGroups
        .filter((group) => group._count._all >= minimumCount)
        .map((group) => group.userId);
      idsConstraint = matchingIds;
    }

    if (idsConstraint !== null) {
      if (idsConstraint.length === 0) {
        return {
          success: true,
          data: {
            clients: [],
            pagination: {
              total: 0,
              page,
              limit,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
            stats,
          },
        };
      }
      where.id = {
        in: idsConstraint,
      };
    }

    const sortBy = filters.sortBy ?? "createdAt";
    const sortOrder = filters.sortOrder === "asc" ? "asc" : "desc";

    let orderBy: Prisma.UserOrderByWithRelationInput;
    if (sortBy === "bookingsCount") {
      orderBy = {
        bookings: {
          _count: sortOrder,
        },
      };
    } else {
      orderBy = {
        createdAt: sortOrder,
      };
    }

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          deletedAt: true,
          lockedUntil: true,
          driverLicense: true,
          bookings: {
            orderBy: {
              startDate: "desc",
            },
            take: 1,
            select: {
              id: true,
              startDate: true,
              endDate: true,
              status: true,
              vehicle: {
                select: {
                  id: true,
                  brand: true,
                  model: true,
                  licensePlate: true,
                },
              },
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      }),
      prisma.user.count({
        where,
      }),
    ]);

    const clientsMapped: ClientListItem[] = clients.map((client) => {
      const lastBooking = client.bookings[0];
      let status: ClientStatus = "ACTIVE";
      if (client.deletedAt) {
        status = "INACTIVE";
      } else if (client.lockedUntil && client.lockedUntil > now) {
        status = "LOCKED";
      }

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        createdAt: client.createdAt.toISOString(),
        status,
        bookingsCount: client._count.bookings,
        hasDriverLicense: Boolean(client.driverLicense),
        driverLicenseUrl: client.driverLicense ?? null,
        lockedUntil: client.lockedUntil ? client.lockedUntil.toISOString() : null,
        deletedAt: client.deletedAt ? client.deletedAt.toISOString() : null,
        lastBooking: lastBooking
          ? {
              id: lastBooking.id,
              startDate: lastBooking.startDate.toISOString(),
              endDate: lastBooking.endDate ? lastBooking.endDate.toISOString() : null,
              status: lastBooking.status,
              vehicle: lastBooking.vehicle
                ? {
                    id: lastBooking.vehicle.id,
                    brand: lastBooking.vehicle.brand,
                    model: lastBooking.vehicle.model,
                    licensePlate: lastBooking.vehicle.licensePlate,
                  }
                : null,
            }
          : null,
      };
    });

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return {
      success: true,
      data: {
        clients: clientsMapped,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        stats,
      },
    };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la récupération des clients.",
      status: 500,
    };
  }
}


