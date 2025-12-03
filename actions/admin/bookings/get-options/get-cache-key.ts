import type { GetBookingOptionsParams } from "./types";

/**
 * Génère une clé de cache basée sur les paramètres
 */
export function getCacheKey(params: GetBookingOptionsParams): string {
  return `options:${JSON.stringify(params)}`;
}

