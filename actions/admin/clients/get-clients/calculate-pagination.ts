import type { GetClientsFilters } from "./types";
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT, MIN_LIMIT } from "./constants";

export function calculatePagination(filters: GetClientsFilters): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(Number(filters.page) || DEFAULT_PAGE, DEFAULT_PAGE);
  const limit = Math.min(Math.max(Number(filters.limit) || DEFAULT_LIMIT, MIN_LIMIT), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
}

export function buildPaginationResponse(
  total: number,
  page: number,
  limit: number
): {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

