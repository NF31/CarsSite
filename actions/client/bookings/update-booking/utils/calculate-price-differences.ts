/**
 * Calcule les différences de prix lors d'une modification de réservation
 */
export interface PriceDifferences {
  newTotalPrice: number;
  newDownPayment: number;
  depositDifference: number;
  newRemainingAmount: number;
  refundAmount?: number;
  additionalPaymentAmount?: number;
}

export function calculatePriceDifferences(
  newTotalPrice: number,
  oldDepositPaid: number
): PriceDifferences {
  // Calculer le nouvel acompte (30% du nouveau prix total)
  const newDownPayment = Math.round(newTotalPrice * 0.3 * 100) / 100;

  // Calculer la différence d'acompte
  const depositDifference = Math.round((newDownPayment - oldDepositPaid) * 100) / 100;

  // Calculer le nouveau solde restant
  const newRemainingAmount = Math.round((newTotalPrice - newDownPayment) * 100) / 100;

  // Calculer le remboursement si nécessaire
  const refundAmount = depositDifference < 0 ? Math.abs(depositDifference) : undefined;

  // Calculer le paiement supplémentaire si nécessaire
  const additionalPaymentAmount = depositDifference > 0 ? depositDifference : undefined;

  return {
    newTotalPrice,
    newDownPayment,
    depositDifference,
    newRemainingAmount,
    refundAmount,
    additionalPaymentAmount,
  };
}

