import { PAGINATION_LIMITS } from "../constants";

export function normalizePagination(page?: number, limit?: number) {
  const normalizedLimit = Math.min(
    Math.max(limit ?? 10, PAGINATION_LIMITS.MIN),
    PAGINATION_LIMITS.MAX
  );
  const normalizedPage = Math.max(page ?? 1, 1);
  return { normalizedPage, normalizedLimit };
}

