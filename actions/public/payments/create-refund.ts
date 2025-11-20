"use server";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

interface PaymentMetadata {
  isModificationPayment?: boolean;
  stripePaymentIntentId?: string;
  [key: string]: unknown;
}

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
            createdAt: "asc", // Ordre chronologique pour trouver le paiement initial
          },
          // Récupérer TOUS les paiements, pas seulement le dernier
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
      allPayments: booking.payments.map(p => {
        const metadata = p.metadata as PaymentMetadata;
        return {
          id: p.id,
          amount: `${p.amount.toFixed(2)}€`,
          createdAt: p.createdAt.toISOString(),
          isModificationPayment: metadata?.isModificationPayment === true,
          hasIsModificationPayment: metadata?.isModificationPayment !== undefined,
          metadataKeys: p.metadata ? Object.keys(p.metadata as object) : [],
          fullMetadata: p.metadata, // Pour debug complet
        };
      }),
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

    // Pour les modifications de réservation, trouver le paiement initial
    // (celui qui correspond à originalDepositPaid, pas les paiements de modification)
    let payment = booking.payments[0];
    
    if (input.reason === "booking_modification" && booking.originalDepositPaid) {
      console.log(`[Refund] 🔍 Recherche du paiement initial pour modification`, {
        originalDepositPaid: `${booking.originalDepositPaid.toFixed(2)}€`,
        totalPayments: booking.payments.length,
        allPayments: booking.payments.map((p, index) => {
          const metadata = p.metadata as PaymentMetadata;
          return {
            index,
            id: p.id,
            amount: `${p.amount.toFixed(2)}€`,
            createdAt: p.createdAt.toISOString(),
            isModificationPayment: metadata?.isModificationPayment === true,
            paymentType: metadata?.paymentType || "N/A",
            differenceFromOriginal: `${Math.abs(p.amount - booking.originalDepositPaid!).toFixed(2)}€`,
            matchesOriginal: Math.abs(p.amount - booking.originalDepositPaid!) < 5, // Tolérance de 5€
          };
        }),
        timestamp: new Date().toISOString(),
      });

      // 1. Chercher d'abord un paiement qui correspond exactement à originalDepositPaid (tolérance 5€)
      // et qui n'est PAS un paiement de modification
      // IMPORTANT: Les anciens paiements peuvent ne pas avoir isModificationPayment, donc on considère
      // qu'un paiement sans isModificationPayment OU avec isModificationPayment === false est un paiement initial
      let initialPayment = booking.payments.find(p => {
        const metadata = p.metadata as PaymentMetadata;
        const isModificationPayment = metadata?.isModificationPayment === true; // Seulement true exclut
        const matchesAmount = Math.abs(p.amount - booking.originalDepositPaid!) < 5; // Tolérance de 5€
        // Un paiement est initial s'il n'a PAS isModificationPayment: true
        return !isModificationPayment && matchesAmount;
      });

      // 2. Si pas trouvé, prendre le paiement le plus ancien qui n'est PAS une modification
      // (c'est-à-dire qui n'a pas isModificationPayment: true)
      if (!initialPayment) {
        initialPayment = booking.payments.find(p => {
          const metadata = p.metadata as PaymentMetadata;
          // Seulement exclure si isModificationPayment est explicitement true
          return metadata?.isModificationPayment !== true;
        });
      }

      // 3. Si toujours pas trouvé, prendre le premier paiement (le plus ancien)
      if (initialPayment) {
        payment = initialPayment;
        const metadata = payment.metadata as PaymentMetadata;
        console.log(`[Refund] ✅ Paiement initial sélectionné pour la modification`, {
          paymentId: payment.id,
          amount: `${payment.amount.toFixed(2)}€`,
          originalDepositPaid: `${booking.originalDepositPaid.toFixed(2)}€`,
          difference: `${Math.abs(payment.amount - booking.originalDepositPaid!).toFixed(2)}€`,
          isModificationPayment: metadata?.isModificationPayment === true,
          createdAt: payment.createdAt.toISOString(),
          matchType: Math.abs(payment.amount - booking.originalDepositPaid!) < 5 ? "amount_match" : "oldest_non_modification",
          timestamp: new Date().toISOString(),
        });
      } else {
        // Fallback : prendre le premier paiement (le plus ancien)
        payment = booking.payments[0];
        console.log(`[Refund] ⚠️  Aucun paiement non-modification trouvé, utilisation du premier paiement`, {
          paymentId: payment.id,
          amount: `${payment.amount.toFixed(2)}€`,
          originalDepositPaid: `${booking.originalDepositPaid.toFixed(2)}€`,
          totalPayments: booking.payments.length,
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log(`[Refund] 💳 Paiement sélectionné pour le remboursement`, {
      paymentId: payment.id,
      amount: `${payment.amount.toFixed(2)}€`,
      transactionId: payment.transactionId,
      metadata: payment.metadata,
      isModificationPayment: (payment.metadata as PaymentMetadata)?.isModificationPayment === true,
      createdAt: payment.createdAt.toISOString(),
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

    // Si le montant à rembourser dépasse le montant d'un seul paiement,
    // calculer le montant total remboursable sur tous les paiements (y compris modifications si nécessaire)
    if (amountInCents > paidAmountInCents && input.reason === "booking_modification") {
      console.log(`[Refund] ⚠️  Le montant à rembourser (${input.amount.toFixed(2)}€) dépasse le paiement sélectionné (${payment.amount.toFixed(2)}€)`);
      console.log(`[Refund] 🔍 Calcul du montant total remboursable sur tous les paiements non-modification...`);
      
      // Calculer le montant total remboursable
      // D'abord essayer avec les paiements non-modification
      let nonModificationPayments = booking.payments.filter(p => {
        const metadata = p.metadata as PaymentMetadata;
        return metadata?.isModificationPayment !== true;
      });

      console.log(`[Refund] 📋 Paiements non-modification trouvés:`, {
        count: nonModificationPayments.length,
        payments: nonModificationPayments.map(p => {
          const metadata = p.metadata as PaymentMetadata;
          return {
            id: p.id,
            amount: `${p.amount.toFixed(2)}€`,
            createdAt: p.createdAt.toISOString(),
            isModificationPayment: metadata?.isModificationPayment,
            hasMetadata: !!p.metadata,
            metadataKeys: p.metadata ? Object.keys(p.metadata as object) : [],
          };
        }),
        timestamp: new Date().toISOString(),
      });

      let totalRefundableAmount = nonModificationPayments.reduce((sum, p) => sum + p.amount, 0);

      // Si aucun paiement non-modification trouvé mais originalDepositPaid existe,
      // cela signifie que le paiement initial n'a pas été enregistré ou a été perdu.
      // Dans ce cas, on utilise TOUS les paiements disponibles (y compris les modifications)
      // car on doit rembourser basé sur originalDepositPaid qui est la source de vérité
      if (nonModificationPayments.length === 0 && booking.originalDepositPaid) {
        console.log(`[Refund] ⚠️  Aucun paiement non-modification trouvé, mais originalDepositPaid existe (${booking.originalDepositPaid.toFixed(2)}€)`);
        console.log(`[Refund] 🔄 Utilisation de TOUS les paiements disponibles pour le remboursement (y compris modifications)`);
        
        // Utiliser tous les paiements disponibles
        nonModificationPayments = booking.payments;
        totalRefundableAmount = booking.payments.reduce((sum, p) => sum + p.amount, 0);
        
        console.log(`[Refund] 📋 Tous les paiements utilisés pour remboursement:`, {
          count: nonModificationPayments.length,
          totalAmount: `${totalRefundableAmount.toFixed(2)}€`,
          originalDepositPaid: `${booking.originalDepositPaid.toFixed(2)}€`,
          requestedRefund: `${input.amount.toFixed(2)}€`,
          payments: nonModificationPayments.map(p => ({
            id: p.id,
            amount: `${p.amount.toFixed(2)}€`,
            createdAt: p.createdAt.toISOString(),
          })),
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`[Refund] 💰 Montant total remboursable: ${totalRefundableAmount.toFixed(2)}€`);
      console.log(`[Refund] 💰 Montant à rembourser: ${input.amount.toFixed(2)}€`);

      if (input.amount > totalRefundableAmount) {
        // Si le montant total disponible est insuffisant, on ne peut pas rembourser
        console.error(`[Refund] ❌ Montant insuffisant pour le remboursement`, {
          requestedAmount: `${input.amount.toFixed(2)}€`,
          totalAvailable: `${totalRefundableAmount.toFixed(2)}€`,
          originalDepositPaid: `${booking.originalDepositPaid?.toFixed(2) ?? "N/A"}€`,
          deficit: `${(input.amount - totalRefundableAmount).toFixed(2)}€`,
          timestamp: new Date().toISOString(),
        });
        
        return {
          success: false,
          error: `Le montant du remboursement (${input.amount.toFixed(2)}€) dépasse le montant total disponible (${totalRefundableAmount.toFixed(2)}€). ${booking.originalDepositPaid ? `L'acompte original était de ${booking.originalDepositPaid.toFixed(2)}€ mais le paiement initial n'existe pas dans la base de données.` : ""} Un remboursement manuel devra être effectué.`,
        };
      }

      // Si le montant total est suffisant, utiliser le paiement qui a le montant le plus élevé
      // parmi les paiements non-modification
      const bestPayment = nonModificationPayments
        .sort((a, b) => b.amount - a.amount)[0]; // Trier par montant décroissant

      if (bestPayment && bestPayment.amount >= input.amount) {
        payment = bestPayment;
        console.log(`[Refund] ✅ Nouveau paiement sélectionné avec montant suffisant`, {
          paymentId: payment.id,
          amount: `${payment.amount.toFixed(2)}€`,
          refundAmount: `${input.amount.toFixed(2)}€`,
          timestamp: new Date().toISOString(),
        });
      } else if (bestPayment) {
        // Si aucun paiement unique n'a un montant suffisant, on peut quand même rembourser
        // le montant maximum possible sur le meilleur paiement
        console.log(`[Refund] ⚠️  Aucun paiement unique n'a un montant suffisant. Utilisation du meilleur paiement disponible.`, {
          bestPaymentId: bestPayment.id,
          bestPaymentAmount: `${bestPayment.amount.toFixed(2)}€`,
          requestedAmount: `${input.amount.toFixed(2)}€`,
          totalRefundable: `${totalRefundableAmount.toFixed(2)}€`,
          timestamp: new Date().toISOString(),
        });
        // On continue avec le meilleur paiement, mais on ajustera le montant si nécessaire
        // Pour l'instant, on retourne une erreur pour que l'admin soit informé
        return {
          success: false,
          error: `Le montant du remboursement (${input.amount.toFixed(2)}€) dépasse le montant du meilleur paiement disponible (${bestPayment.amount.toFixed(2)}€). Le montant total remboursable est de ${totalRefundableAmount.toFixed(2)}€. Un remboursement partiel ou multiple devra être effectué manuellement.`,
        };
      }
    } else if (amountInCents > paidAmountInCents) {
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

