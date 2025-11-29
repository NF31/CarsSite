import Stripe from "stripe";

/**
 * Utilitaires communs pour les webhooks Stripe
 */

/**
 * Extrait l'heure depuis une date
 */
export function extractTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Arrondit un montant à 2 décimales
 */
export function roundAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Formate un montant en euros
 */
export function formatAmount(amount: number): string {
  return `${amount.toFixed(2)}€`;
}

/**
 * Récupère le type de paiement depuis les métadonnées
 */
export function getPaymentTypeFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
  hasModificationDepositDifference: boolean
): {
  type: "full" | "deposit" | "authorization" | "modification";
  isAuthorization: boolean;
  isDepositOnly: boolean;
  isModificationPayment: boolean;
} {
  const paymentType = metadata?.paymentType || "full";
  const isAuthorization = paymentType === "authorization";
  const isDepositOnly = paymentType === "deposit";
  const metadataIsModification =
    metadata?.isModificationPayment === "true" ||
    metadata?.isModificationPayment === "1";
  const isModificationPayment =
    metadataIsModification || hasModificationDepositDifference;

  return {
    type: isModificationPayment
      ? "modification"
      : isAuthorization
        ? "authorization"
        : isDepositOnly
          ? "deposit"
          : "full",
    isAuthorization,
    isDepositOnly,
    isModificationPayment,
  };
}

/**
 * Génère la salutation selon l'heure
 */
export function getEmailGreeting(): string {
  return new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";
}

