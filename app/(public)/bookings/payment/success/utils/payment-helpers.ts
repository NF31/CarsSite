import type Stripe from "stripe";
import type { BookingData, PaymentMetadata, PaymentAmounts, PaymentType } from "../types";

/**
 * Utilitaires pour la récupération et le calcul des montants de paiement
 */

/**
 * Récupère le type de paiement depuis la session Stripe
 */
export function getPaymentTypeFromSession(
  stripeSession: Stripe.Checkout.Session
): PaymentType {
  const paymentType = (stripeSession.metadata?.paymentType as "deposit" | "full" | "authorization") || "full";
  const isModificationPayment = stripeSession.metadata?.isModificationPayment === "true";

  return {
    type: paymentType,
    isModificationPayment,
  };
}

/**
 * Trouve le paiement correspondant à une session Stripe
 */
export function findSessionPayment(
  payments: BookingData["payments"],
  sessionId: string | undefined,
  paymentIntentId: string | undefined
) {
  if (!payments || payments.length === 0) {
    return null;
  }

  // Filtrer les paiements POSITIFS seulement (exclure les remboursements)
  const positivePayments = payments.filter((p) => p.amount > 0);

  // Trouver le paiement correspondant à cette session Stripe
  const sessionPayment = positivePayments.find((p) => {
    const metadata = p.metadata as PaymentMetadata | null;
    return (
      (sessionId && metadata?.stripeSessionId === sessionId) ||
      (paymentIntentId && metadata?.stripePaymentIntentId === paymentIntentId)
    );
  });

  // Si pas trouvé, prendre le dernier paiement positif
  return sessionPayment || positivePayments[0] || null;
}

/**
 * Calcule les montants payés depuis un paiement
 */
export function calculateAmountsFromPayment(
  payment: NonNullable<ReturnType<typeof findSessionPayment>>,
  downPayment: number,
  securityDeposit: number
): PaymentAmounts {
  const paymentMetadata = payment.metadata as PaymentMetadata | null;

  let actualDepositPaid = 0;
  let actualSecurityDepositPaid = 0;

  if (paymentMetadata?.paymentType === "deposit") {
    // Acompte seulement - le montant dans Payment correspond à l'acompte
    actualDepositPaid = payment.amount;
    actualSecurityDepositPaid = 0;
  } else if (paymentMetadata?.paymentType === "authorization") {
    // Empreinte bancaire - le montant dans Payment correspond à la caution bloquée
    actualDepositPaid = 0;
    actualSecurityDepositPaid = payment.amount;
  } else {
    // Paiement complet - utiliser les métadonnées ou calculer
    actualDepositPaid = paymentMetadata?.downPayment || downPayment;
    actualSecurityDepositPaid = paymentMetadata?.securityDeposit || securityDeposit;
  }

  return {
    actualDepositPaid,
    actualSecurityDepositPaid,
    expectedSecurityDeposit: securityDeposit,
  };
}

/**
 * Calcule les montants payés depuis la session Stripe
 */
export function calculateAmountsFromStripeSession(
  stripeSession: Stripe.Checkout.Session,
  paymentType: PaymentType,
  downPayment: number,
  securityDeposit: number
): PaymentAmounts {
  const amountPaid = stripeSession.amount_total ? stripeSession.amount_total / 100 : 0;

  let actualDepositPaid = 0;
  let actualSecurityDepositPaid = 0;

  if (paymentType.type === "deposit") {
    // Acompte seulement
    actualDepositPaid = amountPaid;
    actualSecurityDepositPaid = 0;
  } else if (paymentType.type === "authorization") {
    // Empreinte bancaire (caution bloquée)
    actualDepositPaid = 0;
    actualSecurityDepositPaid = amountPaid;
  } else {
    // Paiement complet (acompte + caution)
    actualDepositPaid = downPayment;
    actualSecurityDepositPaid = securityDeposit;
  }

  return {
    actualDepositPaid,
    actualSecurityDepositPaid,
    expectedSecurityDeposit: securityDeposit,
  };
}

/**
 * Vérifie si le webhook a déjà traité ce paiement
 */
export function isWebhookProcessed(
  payments: BookingData["payments"],
  sessionId: string | undefined,
  paymentIntentId: string | undefined
): boolean {
  if (!payments || payments.length === 0) {
    return false;
  }

  return payments.some((p) => {
    const metadata = p.metadata as PaymentMetadata | null;
    return (
      (sessionId && metadata?.stripeSessionId === sessionId) ||
      (paymentIntentId && metadata?.stripePaymentIntentId === paymentIntentId)
    );
  });
}

/**
 * Détecte si c'est un paiement de modification
 */
export function isModificationPayment(
  payments: BookingData["payments"],
  isModificationFromMetadata: boolean
): boolean {
  if (isModificationFromMetadata) {
    return true;
  }

  if (!payments || payments.length === 0) {
    return false;
  }

  return payments.some((p) => {
    const metadata = p.metadata as PaymentMetadata | null;
    return metadata?.isModificationPayment === true;
  });
}

/**
 * Extrait les métadonnées de modification depuis la session Stripe
 */
export function extractModificationMetadata(
  stripeSession: Stripe.Checkout.Session | null,
  isModificationPayment: boolean
) {
  if (!isModificationPayment || !stripeSession?.metadata) {
    return null;
  }

  return {
    originalTotalPrice: stripeSession.metadata.originalTotalPrice
      ? parseFloat(stripeSession.metadata.originalTotalPrice)
      : null,
    originalDepositPaid: stripeSession.metadata.originalDepositPaid
      ? parseFloat(stripeSession.metadata.originalDepositPaid)
      : null,
    originalRemainingAmount: stripeSession.metadata.originalRemainingAmount
      ? parseFloat(stripeSession.metadata.originalRemainingAmount)
      : null,
    depositDifference: stripeSession.metadata.depositDifference
      ? parseFloat(stripeSession.metadata.depositDifference)
      : null,
    securityDepositPaid: stripeSession.metadata.securityDepositPaid
      ? parseFloat(stripeSession.metadata.securityDepositPaid)
      : 0,
  };
}

