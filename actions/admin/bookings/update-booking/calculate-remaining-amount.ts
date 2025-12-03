/**
 * Calcule le montant restant à payer
 */
export function calculateRemainingAmount(
  totalPrice: number,
  depositPaid: number
): number {
  return Math.max(totalPrice - depositPaid, 0);
}

