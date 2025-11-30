import type { PaymentMetadata, PaymentData } from "../types";

/**
 * Utilitaires pour la manipulation des paiements
 */

/**
 * Vérifie si un paiement est un paiement de modification
 */
export function isModificationPayment(payment: PaymentData): boolean {
  const metadata = payment.metadata as PaymentMetadata;
  return metadata?.isModificationPayment === true;
}

/**
 * Filtre les paiements non-modification
 */
export function filterNonModificationPayments(payments: PaymentData[]): PaymentData[] {
  return payments.filter((p) => !isModificationPayment(p));
}

/**
 * Trouve le paiement initial (non-modification) qui correspond à un montant
 */
export function findInitialPayment(
  payments: PaymentData[],
  targetAmount: number,
  tolerance: number = 5
): PaymentData | undefined {
  // 1. Chercher un paiement qui correspond exactement au montant (tolérance 5€)
  // et qui n'est PAS un paiement de modification
  let initialPayment = payments.find((p) => {
    const isModification = isModificationPayment(p);
    const matchesAmount = Math.abs(p.amount - targetAmount) < tolerance;
    return !isModification && matchesAmount;
  });

  // 2. Si pas trouvé, prendre le paiement le plus ancien qui n'est PAS une modification
  if (!initialPayment) {
    initialPayment = payments.find((p) => !isModificationPayment(p));
  }

  return initialPayment;
}

/**
 * Calcule le montant total remboursable sur une liste de paiements
 */
export function calculateTotalRefundableAmount(payments: PaymentData[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Trouve le meilleur paiement (montant le plus élevé) parmi une liste
 */
export function findBestPayment(payments: PaymentData[]): PaymentData | undefined {
  if (payments.length === 0) return undefined;
  return payments.sort((a, b) => b.amount - a.amount)[0];
}

/**
 * Récupère le Payment Intent ID depuis les métadonnées d'un paiement
 */
export function getPaymentIntentIdFromMetadata(payment: PaymentData): string | null {
  if (payment.metadata && typeof payment.metadata === "object") {
    const metadata = payment.metadata as PaymentMetadata;
    return (metadata.stripePaymentIntentId as string) || null;
  }
  return null;
}

/**
 * Calcule le montant effectif de dépôt payé
 */
export function getEffectiveDepositPaid(
  originalDepositPaid: number | null,
  depositPaid: number | null
): number {
  return originalDepositPaid ?? depositPaid ?? 0;
}

