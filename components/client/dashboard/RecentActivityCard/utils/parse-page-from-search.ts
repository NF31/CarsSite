/**
 * Parse le numéro de page depuis les paramètres de recherche
 */
export function parsePageFromSearch(value: string | null): number {
  if (!value) {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

