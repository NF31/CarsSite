import { Prisma } from "@prisma/client";
import { BookingStatus } from "@/lib/types/booking-status";
import type { GetBookingsFilters } from "./types";
import { normalizeDateFilter } from "./utils/normalize-date-filter";

/**
 * Construit la clause WHERE Prisma avec tous les filtres
 */
export function buildWhereClause(
  filters: GetBookingsFilters,
  currentDate: Date
): Prisma.BookingWhereInput {
  const {
    status,
    pickupLocationId,
    returnLocationId,
    search,
    startDateFrom,
    startDateTo,
  } = filters;

  const where: Prisma.BookingWhereInput = {};

  // Filtre par statut (avec logique spéciale pour CONFIRMED, IN_PROGRESS, COMPLETED)
  if (status) {
    if (status === BookingStatus.CONFIRMED) {
      where.status = BookingStatus.CONFIRMED;
      const startFilter = normalizeDateFilter(
        where.startDate as Prisma.DateTimeFilter | Date | string | undefined
      );
      const endFilter = normalizeDateFilter(
        where.endDate as Prisma.DateTimeFilter | Date | string | undefined
      );
      where.startDate = {
        ...startFilter,
        gt: currentDate,
      };
      where.endDate = {
        ...endFilter,
        gt: currentDate,
      };
    } else if (status === BookingStatus.IN_PROGRESS) {
      where.status = {
        in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
      };
      const startFilter = normalizeDateFilter(
        where.startDate as Prisma.DateTimeFilter | Date | string | undefined
      );
      const endFilter = normalizeDateFilter(
        where.endDate as Prisma.DateTimeFilter | Date | string | undefined
      );
      where.startDate = {
        ...startFilter,
        lte: currentDate,
      };
      where.endDate = {
        ...endFilter,
        gt: currentDate,
      };
    } else if (status === BookingStatus.COMPLETED) {
      const allowedStatuses = [
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
        BookingStatus.IN_PROGRESS,
        BookingStatus.COMPLETED,
      ];

      const existingAnd = Array.isArray(where.AND)
        ? where.AND
        : where.AND
        ? [where.AND]
        : [];

      where.AND = [
        ...existingAnd,
        {
          OR: [
            { status: BookingStatus.COMPLETED },
            {
              status: { in: allowedStatuses },
              endDate: { lte: currentDate },
            },
          ],
        },
      ];
    } else {
      where.status = status;
    }
  }

  // Filtre par agence de départ
  if (pickupLocationId) {
    where.pickupLocationId = pickupLocationId;
  }

  // Filtre par agence de retour
  if (returnLocationId) {
    where.returnLocationId = returnLocationId;
  }

  // Filtre par dates de début
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

  // Filtre par recherche textuelle
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

  return where;
}

