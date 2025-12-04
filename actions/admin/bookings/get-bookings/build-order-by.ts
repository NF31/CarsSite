import type { Prisma } from "@prisma/client";
import { ALLOWED_SORT_FIELDS, DEFAULT_SORT_BY, DEFAULT_SORT_ORDER } from "./constants";

/**
 * Construit la clause ORDER BY Prisma
 */
export function buildOrderBy(
  sortBy?: string,
  sortOrder?: string
): Prisma.BookingOrderByWithRelationInput {
  const safeSortBy = ALLOWED_SORT_FIELDS[sortBy ?? ""] ? sortBy : DEFAULT_SORT_BY;
  const safeSortOrder = sortOrder === "asc" ? "asc" : DEFAULT_SORT_ORDER;

  return {
    [safeSortBy!]: safeSortOrder,
  };
}

