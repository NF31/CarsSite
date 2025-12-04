import type { Prisma } from "@prisma/client";
import { UserRole } from "@/lib/types/user-role";
import type { GetClientsFilters, ClientReservationsFilter } from "./types";
import { RETURNING_CLIENTS_MIN_BOOKINGS, VIP_CLIENTS_MIN_BOOKINGS } from "./constants";

interface BuildWhereClauseParams {
  filters: GetClientsFilters;
  now: Date;
  returningGroups: Array<{ userId: string; _count: { _all: number } }>;
}

export function buildWhereClause({
  filters,
  now,
  returningGroups,
}: BuildWhereClauseParams): {
  where: Prisma.UserWhereInput;
  idsConstraint: string[] | null;
} {
  const where: Prisma.UserWhereInput = {
    role: UserRole.CLIENT,
  };

  // Filtrer par statut
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

  // Filtrer par recherche
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

  // Filtrer par dates d'inscription
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

  // Filtrer par réservations
  let idsConstraint: string[] | null = null;
  const reservationsFilter: ClientReservationsFilter = filters.reservations ?? "all";

  if (reservationsFilter === "with") {
    where.bookings = {
      some: {},
    };
  } else if (reservationsFilter === "without") {
    where.bookings = {
      none: {},
    };
  } else if (reservationsFilter === "returning" || reservationsFilter === "vip") {
    const minimumCount = reservationsFilter === "vip" ? VIP_CLIENTS_MIN_BOOKINGS : RETURNING_CLIENTS_MIN_BOOKINGS;
    const matchingIds = returningGroups
      .filter((group) => group._count._all >= minimumCount)
      .map((group) => group.userId);
    idsConstraint = matchingIds;
  }

  if (idsConstraint !== null && idsConstraint.length > 0) {
    where.id = {
      in: idsConstraint,
    };
  }

  return {
    where,
    idsConstraint,
  };
}

