import type { DashboardSearchParams } from "../types";

/**
 * Utilitaires pour la page dashboard
 */

/**
 * Résout les searchParams en un objet simple
 */
export async function resolveSearchParams(
  searchParams?: DashboardSearchParams
): Promise<Record<string, string | string[] | undefined>> {
  if (!searchParams) {
    return {};
  }

  if (searchParams instanceof URLSearchParams) {
    return Object.fromEntries(searchParams.entries());
  }

  if (searchParams instanceof Promise) {
    const awaited = await searchParams;
    return awaited ?? {};
  }

  return searchParams;
}

/**
 * Parse un paramètre de page depuis les searchParams
 */
export function parsePageParam(value: string | string[] | undefined): number {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 1;
    }
    return parsePageParam(value[0]);
  }

  if (!value) {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

