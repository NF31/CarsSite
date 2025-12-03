import {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MIN_LIMIT,
  MAX_LIMIT,
} from "./constants";

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Calcule et valide les paramètres de pagination
 */
export function calculatePagination(
  params: PaginationParams
): PaginationResult {
  const parsedLimit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, MIN_LIMIT), MAX_LIMIT);
  const currentPage = Math.max(params.page ?? DEFAULT_PAGE, 1);
  const skip = (currentPage - 1) * parsedLimit;

  return {
    page: currentPage,
    limit: parsedLimit,
    skip,
  };
}

/**
 * Construit la réponse de pagination complète
 */
export function buildPaginationResponse(
  total: number,
  page: number,
  limit: number
) {
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

