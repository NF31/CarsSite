"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/types/user-role";
import { stripe } from "@/lib/stripe";

export interface RefundHistoryItem {
  id: string;
  amount: number; // Montant en euros (toujours positif, même pour les remboursements)
  status: string;
  method: string;
  transactionId: string | null;
  reason: string | null; // "cancellation" | "booking_modification" | etc.
  createdAt: string;
  metadata?: {
    stripeRefundId?: string;
    stripePaymentIntentId?: string;
    reason?: string;
    originalPaymentId?: string;
    requestedAmount?: number;
    effectiveRefundAmount?: number;
    isPartialRefund?: boolean;
    [key: string]: unknown;
  };
}

export interface PaymentInfo {
  id: string;
  amount: number; // Montant en euros (positif pour paiements, négatif pour remboursements)
  status: string;
  method: string;
  transactionId: string | null;
  createdAt: string;
  isRefund: boolean;
  metadata?: Record<string, unknown>;
}

export interface RefundHistoryResult {
  success: boolean;
  refunds?: RefundHistoryItem[];
  payments?: PaymentInfo[];
  totalRefunded?: number;
  totalPaid?: number;
  refundableAmount?: number;
  error?: string;
}

/**
 * Récupère l'historique des remboursements pour une réservation
 */
export async function getRefundHistoryAction(
  bookingId: string
): Promise<RefundHistoryResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Authentification requise.",
      };
    }

    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Permissions insuffisantes.",
      };
    }

    // 1. Récupérer tous les paiements de la réservation (incluant les remboursements en DB)
    const allPayments = await prisma.payment.findMany({
      where: {
        bookingId: bookingId,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        method: true,
        transactionId: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Récupérer la réservation pour obtenir la référence
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        reference: true,
      },
    });

    // 2. Chercher aussi dans Stripe pour trouver les remboursements qui pourraient ne pas être en DB
    const stripeRefunds: RefundHistoryItem[] = [];
    const paymentIntentIds = new Set<string>();

    // Collecter les Payment Intent IDs depuis les paiements
    for (const payment of allPayments) {
      const metadata = (payment.metadata || {}) as Record<string, unknown>;
      const paymentIntentId = 
        (metadata.stripePaymentIntentId as string) ||
        (payment.transactionId?.startsWith("pi_") ? payment.transactionId : null);
      
      if (paymentIntentId && paymentIntentId.startsWith("pi_")) {
        paymentIntentIds.add(paymentIntentId);
      }
    }

    // Chercher aussi les Payment Intents dans Stripe via les métadonnées de la réservation
    if (booking) {
      try {
        const stripePaymentIntents = await stripe.paymentIntents.list({
          limit: 100,
        });

        // Filtrer les Payment Intents qui correspondent à cette réservation
        const matchingPaymentIntents = stripePaymentIntents.data.filter(pi => {
          const metadata = pi.metadata || {};
          const matchesBookingId = metadata.bookingId === bookingId;
          const matchesReference = metadata.bookingReference === booking.reference;
          return (matchesBookingId || matchesReference) && pi.status === "succeeded";
        });

        // Ajouter les Payment Intent IDs trouvés
        for (const pi of matchingPaymentIntents) {
          paymentIntentIds.add(pi.id);
        }
      } catch (stripeError) {
        console.warn("[Refund History] Erreur lors de la recherche dans Stripe:", stripeError);
      }
    }

    // Récupérer tous les remboursements Stripe pour chaque Payment Intent
    for (const paymentIntentId of paymentIntentIds) {
      try {
        const existingRefunds = await stripe.refunds.list({
          payment_intent: paymentIntentId,
          limit: 100,
        });

        for (const stripeRefund of existingRefunds.data) {
          // Vérifier si ce remboursement existe déjà en DB
          const existsInDB = allPayments.some(
            p => p.transactionId === stripeRefund.id || 
            (p.transactionId?.startsWith("re_") && p.amount < 0 && Math.abs(p.amount * 100) === stripeRefund.amount)
          );

          if (!existsInDB) {
            // Ce remboursement existe dans Stripe mais pas en DB
            const refundMetadata = stripeRefund.metadata || {};
            stripeRefunds.push({
              id: `stripe_${stripeRefund.id}`,
              amount: (stripeRefund.amount || 0) / 100, // Convertir en euros
              status: stripeRefund.status === "succeeded" ? "COMPLETED" : stripeRefund.status === "pending" ? "PENDING" : "FAILED",
              method: "STRIPE",
              transactionId: stripeRefund.id,
              reason: (refundMetadata.reason as string) || (refundMetadata.bookingId === bookingId ? "unknown" : undefined) || null,
              createdAt: new Date(stripeRefund.created * 1000).toISOString(),
              metadata: {
                stripeRefundId: stripeRefund.id,
                stripePaymentIntentId: paymentIntentId,
                reason: (refundMetadata.reason as string | undefined) || undefined,
                fromStripeOnly: true, // Flag pour indiquer que c'est uniquement dans Stripe
              },
            });
          }
        }
      } catch (error) {
        console.warn(`[Refund History] Erreur lors de la récupération des remboursements pour ${paymentIntentId}:`, error);
      }
    }

    // Séparer les paiements et les remboursements depuis la DB
    const payments: PaymentInfo[] = [];
    const refundsFromDB: RefundHistoryItem[] = [];

    for (const payment of allPayments) {
      const metadata = (payment.metadata || {}) as Record<string, unknown>;
      const isRefund = 
        payment.amount < 0 || 
        payment.transactionId?.startsWith("re_") ||
        metadata.reason === "cancellation" ||
        metadata.reason === "booking_modification";

      if (isRefund) {
        // C'est un remboursement en DB
        refundsFromDB.push({
          id: payment.id,
          amount: Math.abs(payment.amount), // Toujours positif pour l'affichage
          status: payment.status,
          method: payment.method,
          transactionId: payment.transactionId,
          reason: (metadata.reason as string) || null,
          createdAt: payment.createdAt.toISOString(),
          metadata: metadata as RefundHistoryItem["metadata"],
        });
      } else {
        // C'est un paiement
        payments.push({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          method: payment.method,
          transactionId: payment.transactionId,
          createdAt: payment.createdAt.toISOString(),
          isRefund: false,
          metadata: metadata,
        });
      }
    }

    // Combiner les remboursements de la DB et de Stripe (éviter les doublons)
    const allRefunds: RefundHistoryItem[] = [...refundsFromDB];
    
    // Ajouter les remboursements Stripe qui ne sont pas déjà en DB
    for (const stripeRefund of stripeRefunds) {
      const isDuplicate = allRefunds.some(
        r => r.transactionId === stripeRefund.transactionId || 
        (r.metadata?.stripeRefundId === stripeRefund.transactionId)
      );
      
      if (!isDuplicate) {
        allRefunds.push(stripeRefund);
      }
    }

    // Calculer les totaux
    const totalRefunded = allRefunds.reduce((sum, refund) => sum + refund.amount, 0);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Essayer de calculer le montant remboursable restant
    // En vérifiant les Payment Intents dans Stripe
    let refundableAmount: number | undefined = undefined;

    // Chercher le Payment Intent principal pour vérifier le montant remboursable
    for (const payment of payments) {
      if (payment.method === "STRIPE" && payment.transactionId) {
        const metadata = payment.metadata || {};
        const paymentIntentId = 
          (metadata.stripePaymentIntentId as string) ||
          (payment.transactionId.startsWith("pi_") ? payment.transactionId : null);

        if (paymentIntentId && paymentIntentId.startsWith("pi_")) {
          try {
            const existingRefunds = await stripe.refunds.list({
              payment_intent: paymentIntentId,
              limit: 100,
            });

            const totalRefundedInStripe = existingRefunds.data.reduce(
              (sum, refund) => sum + (refund.amount || 0),
              0
            );

            // Trouver le montant original du Payment Intent
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            const originalAmount = paymentIntent.amount; // En centimes
            refundableAmount = (originalAmount - totalRefundedInStripe) / 100; // En euros

            // On prend le premier Payment Intent trouvé (le plus ancien généralement)
            break;
          } catch (error) {
            console.warn(`[Refund History] Erreur lors de la vérification du Payment Intent ${paymentIntentId}:`, error);
            // Continuer avec le prochain paiement
          }
        }
      }
    }

    // Trier par date (plus récent en premier)
    const sortedRefunds = allRefunds.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log("[Refund History] ✅ Historique récupéré:", {
      bookingId,
      refundsFromDB: refundsFromDB.length,
      refundsFromStripe: stripeRefunds.length,
      totalRefunds: sortedRefunds.length,
      totalRefunded,
      refundableAmount,
    });

    return {
      success: true,
      refunds: sortedRefunds,
      payments: payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), // Plus récent en premier
      totalRefunded,
      totalPaid,
      refundableAmount,
    };
  } catch (error) {
    console.error("[Refund History] Erreur lors de la récupération de l'historique:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue lors de la récupération de l'historique des remboursements.",
    };
  }
}

