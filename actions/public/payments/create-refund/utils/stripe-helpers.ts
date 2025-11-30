import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import type { PaymentData, PaymentMetadata } from "../types";

/**
 * Utilitaires pour les interactions avec Stripe
 */

/**
 * Récupère le Payment Intent ID depuis un paiement
 */
export async function getPaymentIntentId(
  payment: PaymentData
): Promise<string | null> {
  // Si le payment a un ID qui commence par "stripe_", c'est qu'il vient directement de Stripe
  if (payment.id.startsWith("stripe_")) {
    return payment.transactionId;
  }

  // Essayer de récupérer depuis les métadonnées
  if (payment.metadata && typeof payment.metadata === "object") {
    const metadata = payment.metadata as PaymentMetadata;
    if (metadata.stripePaymentIntentId && typeof metadata.stripePaymentIntentId === "string") {
      return metadata.stripePaymentIntentId;
    }
  }

  // Si pas dans les métadonnées, essayer de récupérer depuis la session Stripe
  if (payment.transactionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(payment.transactionId);
      return (session.payment_intent as string) || null;
    } catch {
      // Ignorer l'erreur, on retournera null
    }
  }

  return null;
}

/**
 * Vérifie les remboursements existants sur un Payment Intent
 */
export async function getRefundableAmount(
  paymentIntentId: string,
  originalAmount: number
): Promise<{ refundableAmount: number; totalRefunded: number }> {
  try {
    const existingRefunds = await stripe.refunds.list({
      payment_intent: paymentIntentId,
      limit: 100,
    });

    const totalRefunded = existingRefunds.data.reduce((sum, refund) => sum + (refund.amount || 0), 0);
    const originalAmountInCents = Math.round(originalAmount * 100);
    const refundableAmount = (originalAmountInCents - totalRefunded) / 100;

    return {
      refundableAmount: Math.max(0, refundableAmount),
      totalRefunded: totalRefunded / 100,
    };
  } catch {
    // En cas d'erreur, retourner le montant original comme remboursable
    return {
      refundableAmount: originalAmount,
      totalRefunded: 0,
    };
  }
}

/**
 * Recherche des Payment Intents dans Stripe correspondant à une réservation
 */
export async function searchPaymentIntentsInStripe(
  bookingId: string,
  bookingReference: string,
  searchAmount: number,
  tolerance: number = 5
): Promise<Stripe.PaymentIntent[]> {
  try {
    const stripePaymentIntents = await stripe.paymentIntents.list({
      limit: 100,
    });

    // Stratégie 1 : Recherche stricte (bookingId/reference + montant + non-modification)
    let matchingPaymentIntents = stripePaymentIntents.data.filter((pi) => {
      const metadata = pi.metadata || {};
      const matchesBookingId = metadata.bookingId === bookingId;
      const matchesReference = metadata.bookingReference === bookingReference;
      const amountMatches = Math.abs(pi.amount / 100 - searchAmount) < tolerance;
      const isNotModification = metadata.isModificationPayment !== "true";
      return (
        (matchesBookingId || matchesReference) &&
        amountMatches &&
        isNotModification &&
        pi.status === "succeeded"
      );
    });

    // Stratégie 2 : Si aucun trouvé, chercher par montant seul
    if (matchingPaymentIntents.length === 0) {
      matchingPaymentIntents = stripePaymentIntents.data.filter((pi) => {
        const amountMatches = Math.abs(pi.amount / 100 - searchAmount) < tolerance;
        const isNotModification = pi.metadata?.isModificationPayment !== "true";
        return amountMatches && isNotModification && pi.status === "succeeded";
      });
    }

    // Stratégie 3 : Chercher aussi via les Checkout Sessions
    if (matchingPaymentIntents.length === 0) {
      try {
        const checkoutSessions = await stripe.checkout.sessions.list({
          limit: 100,
        });

        const matchingSessions = checkoutSessions.data.filter((session) => {
          const metadata = session.metadata || {};
          const matchesBookingId = metadata.bookingId === bookingId;
          const matchesReference = metadata.bookingReference === bookingReference;
          const amountMatches = session.amount_total
            ? Math.abs(session.amount_total / 100 - searchAmount) < tolerance
            : false;
          const isNotModification = metadata.isModificationPayment !== "true";
          const isPaid = session.payment_status === "paid";

          return (
            (matchesBookingId || matchesReference) &&
            amountMatches &&
            isNotModification &&
            isPaid &&
            session.payment_intent
          );
        });

        // Récupérer les Payment Intents depuis les Checkout Sessions
        for (const session of matchingSessions) {
          if (session.payment_intent && typeof session.payment_intent === "string") {
            try {
              const pi = await stripe.paymentIntents.retrieve(session.payment_intent);
              if (pi.status === "succeeded" && !matchingPaymentIntents.find((m) => m.id === pi.id)) {
                matchingPaymentIntents.push(pi);
              }
            } catch {
              // Ignorer les erreurs
            }
          }
        }
      } catch {
        // Ignorer les erreurs
      }
    }

    // Trier par date de création (plus ancien en premier)
    return matchingPaymentIntents.sort((a, b) => a.created - b.created);
  } catch {
    return [];
  }
}

/**
 * Crée un objet Payment factice depuis un Payment Intent Stripe
 */
export function createPaymentFromStripePaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  refundableAmount: number
): PaymentData {
  const stripeMetadata = paymentIntent.metadata || {};
  return {
    id: `stripe_${paymentIntent.id}`,
    transactionId: paymentIntent.id,
    amount: refundableAmount > 0 ? refundableAmount : paymentIntent.amount / 100,
    status: "COMPLETED",
    method: "STRIPE",
    metadata: {
      ...stripeMetadata,
      refundableAmount,
      totalRefunded: (paymentIntent.amount - Math.round(refundableAmount * 100)) / 100,
    } as PaymentMetadata,
    createdAt: new Date(paymentIntent.created * 1000),
  };
}

