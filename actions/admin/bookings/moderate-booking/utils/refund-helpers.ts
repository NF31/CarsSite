/**
 * Utilitaires pour les calculs de remboursement
 */

/**
 * Calcule le taux de remboursement selon la date de début et la date de référence
 */
export function computeRefundRate(startDate: Date, referenceDate: Date): number {
  const hoursBeforeStart = (startDate.getTime() - referenceDate.getTime()) / 3600000;
  const daysBeforeStart = hoursBeforeStart / 24;

  if (daysBeforeStart > 7) {
    return 1;
  }

  if (daysBeforeStart >= 3) {
    return 0.5;
  }

  return 0;
}

/**
 * Arrondit une valeur monétaire à 2 décimales
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

