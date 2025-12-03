/**
 * Valeurs par défaut pour la pagination
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 12;
export const MIN_LIMIT = 1;
export const MAX_LIMIT = 48;

/**
 * Valeurs par défaut pour le tri
 */
export const DEFAULT_SORT_BY = "startDate" as const;
export const DEFAULT_SORT_ORDER = "desc" as const;

/**
 * Champs autorisés pour le tri
 */
export const ALLOWED_SORT_FIELDS: Record<string, true> = {
  startDate: true,
  endDate: true,
  createdAt: true,
};

