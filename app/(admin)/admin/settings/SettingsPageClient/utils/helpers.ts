import type { FieldErrors } from "../types";

/**
 * Utilitaires pour SettingsPageClient
 */

/**
 * Parse un input numérique en gérant les virgules et les valeurs vides
 */
export function parseNumberInput(value: string): number {
  const normalized = value.replace(",", ".").trim();
  if (normalized.length === 0) {
    return Number.NaN;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/**
 * Récupère la première erreur d'un champ
 */
export function getFirstError(errors: FieldErrors, field: string): string | undefined {
  return errors[field]?.[0] ?? undefined;
}

