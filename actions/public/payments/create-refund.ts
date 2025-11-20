"use server";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export interface CreateRefundInput {
  bookingId: string;
  amount: number; // Montant en euros
  reason: string; // "booking_modification" | "cancellation" | etc.
}

export interface CreateRefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

/**
 * Crée un remboursement Stripe pour une réservation
 */
export async function createRefundAction(
  input: CreateRefundInput
): Promise<CreateRefundResult> {
  try {
    console.log(`[Refund] 🔄 Début du processus de remboursement`, {
      bookingId: input.bookingId,
      amount: `${input.amount.toFixed(2)}€`,
      reason: input.reason,
      timestamp: new Date().toISOString(),
    });

    // Vérifier que le montant est valide
    if (input.amount <= 0) {
      console.error(`[Refund] ❌ Montant invalide`, {
        bookingId: input.bookingId,
        amount: input.amount,
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        error: "Le montant du remboursement doit être supérieur à zéro.",
      };
    }

    // Récupérer la réservation et ses paiements
    console.log(`[Refund] 🔍 Récupération de la réservation et de ses paiements`, {
      bookingId: input.bookingId,
      timestamp: new Date().toISOString(),
    });

    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true,
        userId: true,
        reference: true,
        depositPaid: true,
        originalDepositPaid: true, // Ajouter pour les modifications
        payments: {
          where: {
            method: "STRIPE",
            status: {
              in: ["COMPLETED", "PENDING"], // Inclure aussi PENDING pour les empreintes bancaires
            },
            amount: {
              gt: 0, // Exclure les remboursements (montants négatifs)
            },
          },
          select: {
            id: true,
            transactionId: true,
            amount: true,
            status: true,
            method: true,
            metadata: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Prendre le paiement le plus récent
        },
      },
    });

    if (!booking) {
      console.error(`[Refund] ❌ Réservation introuvable`, {
        bookingId: input.bookingId,
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    // Pour les modifications, utiliser originalDepositPaid si disponible
    // car depositPaid a été mis à jour avec le nouveau montant
    const effectiveDepositPaid = booking.originalDepositPaid ?? booking.depositPaid ?? 0;
    
    console.log(`[Refund] ✅ Réservation trouvée`, {
      bookingId: booking.id,
      reference: booking.reference,
      depositPaid: `${(booking.depositPaid || 0).toFixed(2)}€`,
      originalDepositPaid: `${(booking.originalDepositPaid || 0).toFixed(2)}€`,
      effectiveDepositPaid: `${effectiveDepositPaid.toFixed(2)}€`,
      paymentsFound: booking.payments.length,
      timestamp: new Date().toISOString(),
    });

    // Si aucun paiement COMPLETED/STRIPE trouvé, chercher tous les paiements pour diagnostiquer
    if (booking.payments.length === 0) {
      console.warn(`[Refund] ⚠️  Aucun paiement COMPLETED/STRIPE trouvé, recherche de tous les paiements pour diagnostic`, {
        bookingId: booking.id,
        reference: booking.reference,
        timestamp: new Date().toISOString(),
      });

      const allPayments = await prisma.payment.findMany({
        where: {
          bookingId: input.bookingId,
        },
        select: {
          id: true,
          amount: true,
          status: true,
          method: true,
          transactionId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log(`[Refund] 📋 Tous les paiements trouvés pour cette réservation`, {
        bookingId: booking.id,
        reference: booking.reference,
        totalPayments: allPayments.length,
        payments: allPayments.map(p => ({
          id: p.id,
          amount: `${p.amount.toFixed(2)}€`,
          status: p.status,
          method: p.method,
          transactionId: p.transactionId,
          createdAt: p.createdAt.toISOString(),
        })),
        depositPaid: `${(booking.depositPaid || 0).toFixed(2)}€`,
        timestamp: new Date().toISOString(),
      });

      // Essayer de trouver un paiement positif (pas un remboursement) même avec un autre statut
      const positivePayment = allPayments.find(p => p.amount > 0);
      
      if (positivePayment) {
        console.log(`[Refund] 🔍 Paiement positif trouvé (mais pas COMPLETED/STRIPE)`, {
          paymentId: positivePayment.id,
          amount: `${positivePayment.amount.toFixed(2)}€`,
          status: positivePayment.status,
          method: positivePayment.method,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: false,
        error: `Aucun paiement trouvé pour cette réservation. ${allPayments.length > 0 ? `Paiements trouvés: ${allPayments.length} (statuts: ${allPayments.map(p => p.status).join(', ')})` : 'Aucun paiement enregistré dans la base de données.'}`,
      };
    }

    const payment = booking.payments[0];

    console.log(`[Refund] 💳 Paiement sélectionné pour le remboursement`, {
      paymentId: payment.id,
      amount: `${payment.amount.toFixed(2)}€`,
      transactionId: payment.transactionId,
      metadata: payment.metadata,
      timestamp: new Date().toISOString(),
    });

    // Récupérer le Payment Intent ID depuis les métadonnées ou la transaction
    let paymentIntentId: string | null = null;

    // Essayer de récupérer depuis les métadonnées
    if (payment.metadata && typeof payment.metadata === "object") {
      const metadata = payment.metadata as Record<string, unknown>;
      paymentIntentId = (metadata.stripePaymentIntentId as string) || null;
      console.log(`[Refund] 🔍 Recherche du Payment Intent dans les métadonnées`, {
        paymentId: payment.id,
        foundInMetadata: !!paymentIntentId,
        paymentIntentId: paymentIntentId || "N/A",
        timestamp: new Date().toISOString(),
      });
    }

    // Si pas dans les métadonnées, essayer de récupérer depuis la session Stripe
    if (!paymentIntentId && payment.transactionId) {
      console.log(`[Refund] 🔍 Tentative de récupération depuis la session Stripe`, {
        paymentId: payment.id,
        transactionId: payment.transactionId,
        timestamp: new Date().toISOString(),
      });
      try {
        const session = await stripe.checkout.sessions.retrieve(payment.transactionId);
        paymentIntentId = (session.payment_intent as string) || null;
        console.log(`[Refund] ✅ Session Stripe récupérée`, {
          paymentId: payment.id,
          sessionId: session.id,
          paymentIntentId: paymentIntentId || "N/A",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`[Refund] ❌ Erreur lors de la récupération de la session Stripe`, {
          paymentId: payment.id,
          transactionId: payment.transactionId,
          error: error instanceof Error ? error.message : "Erreur inconnue",
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (!paymentIntentId) {
      console.error(`[Refund] ❌ Impossible de trouver le Payment Intent`, {
        paymentId: payment.id,
        transactionId: payment.transactionId,
        metadata: payment.metadata,
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        error: "Impossible de trouver le Payment Intent pour ce paiement.",
      };
    }

    // Vérifier que le montant à rembourser ne dépasse pas le montant payé
    const amountInCents = Math.round(input.amount * 100);
    const paidAmountInCents = Math.round(payment.amount * 100);

    if (amountInCents > paidAmountInCents) {
      return {
        success: false,
        error: `Le montant du remboursement (${input.amount.toFixed(2)}€) ne peut pas dépasser le montant payé (${payment.amount.toFixed(2)}€).`,
      };
    }

    // Créer le remboursement Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountInCents,
      reason: "requested_by_customer",
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.reference,
        reason: input.reason,
      },
    });

    // Enregistrer le remboursement dans la base de données
    console.log(`[Refund] 💾 Enregistrement du remboursement dans la base de données`, {
      bookingId: booking.id,
      refundId: refund.id,
      amount: `-${input.amount.toFixed(2)}€`,
      status: refund.status === "succeeded" ? "COMPLETED" : "PENDING",
      timestamp: new Date().toISOString(),
    });

    const createdRefundPayment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        amount: -input.amount, // Montant négatif pour un remboursement
        method: "STRIPE",
        status: refund.status === "succeeded" ? "COMPLETED" : "PENDING",
        transactionId: refund.id,
        metadata: {
          stripeRefundId: refund.id,
          stripePaymentIntentId: paymentIntentId,
          reason: input.reason,
          originalPaymentId: payment.id,
        },
      },
    });

    console.log(`[Refund] ✅ Remboursement enregistré dans la table Payment`, {
      refundPaymentId: createdRefundPayment.id,
      bookingId: booking.id,
      amount: `${createdRefundPayment.amount.toFixed(2)}€`,
      status: createdRefundPayment.status,
      timestamp: new Date().toISOString(),
    });

    // Mettre à jour le montant de l'acompte payé si c'est un remboursement d'acompte
    if (input.reason === "booking_modification" || input.reason === "cancellation") {
      const previousDepositPaid = booking.depositPaid || 0;
      const newDepositPaid = Math.max(0, previousDepositPaid - input.amount);
      
      console.log(`[Refund] 💰 Mise à jour du depositPaid`, {
        bookingId: booking.id,
        previousDepositPaid: `${previousDepositPaid.toFixed(2)}€`,
        refundAmount: `${input.amount.toFixed(2)}€`,
        newDepositPaid: `${newDepositPaid.toFixed(2)}€`,
        timestamp: new Date().toISOString(),
      });

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          depositPaid: {
            decrement: input.amount, // Réduire l'acompte payé
          },
        },
      });

      console.log(`[Refund] ✅ depositPaid mis à jour`, {
        bookingId: booking.id,
        newDepositPaid: `${newDepositPaid.toFixed(2)}€`,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[Refund] ✅ Remboursement créé avec succès pour la réservation ${booking.reference}`, {
      bookingId: booking.id,
      bookingReference: booking.reference,
      refundId: refund.id,
      refundAmount: `${input.amount.toFixed(2)}€`,
      reason: input.reason,
      stripeStatus: refund.status,
      paymentIntentId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      refundId: refund.id,
    };
  } catch (error: unknown) {
    console.error(`[Refund] ❌ Erreur lors de la création du remboursement`, {
      bookingId: input.bookingId,
      amount: `${input.amount.toFixed(2)}€`,
      reason: input.reason,
      error: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue lors de la création du remboursement.",
    };
  }
}

