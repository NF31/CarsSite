import type { Prisma } from '@/lib/prisma'
import type { GetClientsFilters } from "./types";
import { DEFAULT_SORT_BY, DEFAULT_SORT_ORDER } from "./constants";

export function buildOrderBy(
  filters: GetClientsFilters
): Prisma.UserOrderByWithRelationInput {
  const sortBy = filters.sortBy ?? DEFAULT_SORT_BY;
  const sortOrder = filters.sortOrder === "asc" ? "asc" : DEFAULT_SORT_ORDER;

  if (sortBy === "bookingsCount") {
    return {
      bookings: {
        _count: sortOrder,
      },
    };
  }

  return {
    createdAt: sortOrder,
  };
}

