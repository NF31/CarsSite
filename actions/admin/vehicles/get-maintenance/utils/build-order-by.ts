import type { GetMaintenanceFilters } from "../types";
import type { Prisma } from '@/lib/prisma'

export function buildOrderBy(
  filters: GetMaintenanceFilters,
  status?: string
): Prisma.MaintenanceOrderByWithRelationInput {
  const orderField = filters.sortBy ?? "startDate";
  const orderDirection =
    filters.sortOrder ?? (status === "PAST" ? "desc" : "asc");

  return {
    [orderField]: orderDirection,
  };
}

