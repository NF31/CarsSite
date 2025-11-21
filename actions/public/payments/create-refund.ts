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
  warning?: string; // Message d'avertissement pour les remboursements partiels
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

    // 🔍 LOG PRISMA : Récupérer TOUS les paiements de la réservation (sans filtre) pour diagnostic
    const allPaymentsRaw = await prisma.payment.findMany({
      where: {
        bookingId: input.bookingId,
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

    console.log(`[Refund] 📊 [PRISMA] TOUS les paiements de la réservation (sans filtre):`, {
      bookingId: input.bookingId,
      totalPayments: allPaymentsRaw.length,
      payments: allPaymentsRaw.map((p, index) => {
        const metadata = p.metadata as PaymentMetadata;
        return {
          index: index + 1,
          id: p.id,
          amount: `${p.amount.toFixed(2)}€`,
          status: p.status,
          method: p.method,
          transactionId: p.transactionId,
          createdAt: p.createdAt.toISOString(),
          isModificationPayment: metadata?.isModificationPayment === true,
          isModificationPaymentRaw: metadata?.isModificationPayment,
          metadataKeys: p.metadata ? Object.keys(p.metadata as object) : [],
          fullMetadata: JSON.stringify(p.metadata, null, 2),
        };
      }),
      summary: {
        totalAmount: `${allPaymentsRaw.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}€`,
        positivePayments: allPaymentsRaw.filter(p => p.amount > 0).length,
        negativePayments: allPaymentsRaw.filter(p => p.amount < 0).length,
        stripePayments: allPaymentsRaw.filter(p => p.method === "STRIPE").length,
        completedPayments: allPaymentsRaw.filter(p => p.status === "COMPLETED").length,
        modificationPayments: allPaymentsRaw.filter(p => {
          const metadata = p.metadata as PaymentMetadata;
          return metadata?.isModificationPayment === true;
        }).length,
      },
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

    // 🔍 LOG PRISMA : Comparaison entre tous les paiements et ceux filtrés
    console.log(`[Refund] 📊 [PRISMA] Comparaison des paiements:`, {
      totalPaymentsInDB: allPaymentsRaw.length,
      filteredPayments: booking.payments.length,
      difference: allPaymentsRaw.length - booking.payments.length,
      filteredOut: allPaymentsRaw
        .filter(p => {
          // Vérifier pourquoi chaque paiement a été filtré
          const isStripe = p.method === "STRIPE";
          const isCompletedOrPending = p.status === "COMPLETED" || p.status === "PENDING";
          const isPositive = p.amount > 0;
          const isIncluded = isStripe && isCompletedOrPending && isPositive;
          
          return !isIncluded;
        })
        .map(p => {
          const metadata = p.metadata as PaymentMetadata;
          return {
            id: p.id,
            amount: `${p.amount.toFixed(2)}€`,
            status: p.status,
            method: p.method,
            transactionId: p.transactionId,
            createdAt: p.createdAt.toISOString(),
            reasonFiltered: {
              notStripe: p.method !== "STRIPE",
              notCompletedOrPending: p.status !== "COMPLETED" && p.status !== "PENDING",
              notPositive: p.amount <= 0,
            },
            isModificationPayment: metadata?.isModificationPayment === true,
            metadata: JSON.stringify(p.metadata, null, 2),
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
    // 🔍 RECHERCHE PARALLÈLE : Chercher dans la table Payment ET dans Stripe
    let payment: typeof booking.payments[0] | undefined = undefined;
    
    if (input.reason === "booking_modification" && booking.originalDepositPaid) {
      console.log(`[Refund] 🔍 Recherche du paiement initial pour modification (table Payment + Stripe)`, {
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

      const searchAmount = booking.originalDepositPaid && booking.originalDepositPaid > 0 
        ? booking.originalDepositPaid 
        : (booking.depositPaid || 0);

      // 🔍 RECHERCHE 1 : Dans la table Payment
      let paymentFromDB: typeof booking.payments[0] | undefined = undefined;
      let paymentFromDBRefundable: number | undefined = undefined;
      
      // 1. Chercher un paiement qui correspond exactement à originalDepositPaid (tolérance 5€)
      // et qui n'est PAS un paiement de modification
      let initialPayment = booking.payments.find(p => {
        const metadata = p.metadata as PaymentMetadata;
        const isModificationPayment = metadata?.isModificationPayment === true;
        const matchesAmount = Math.abs(p.amount - booking.originalDepositPaid!) < 5;
        return !isModificationPayment && matchesAmount;
      });

      // 2. Si pas trouvé, prendre le paiement le plus ancien qui n'est PAS une modification
      if (!initialPayment) {
        initialPayment = booking.payments.find(p => {
          const metadata = p.metadata as PaymentMetadata;
          return metadata?.isModificationPayment !== true;
        });
      }

      if (initialPayment) {
        paymentFromDB = initialPayment;
        paymentFromDBRefundable = initialPayment.amount; // Sera vérifié plus tard avec Stripe
        console.log(`[Refund] 📊 Paiement initial trouvé en base de données`, {
          paymentId: paymentFromDB.id,
          amount: `${paymentFromDB.amount.toFixed(2)}€`,
          originalDepositPaid: `${booking.originalDepositPaid.toFixed(2)}€`,
          difference: `${Math.abs(paymentFromDB.amount - booking.originalDepositPaid!).toFixed(2)}€`,
          isModificationPayment: (paymentFromDB.metadata as PaymentMetadata)?.isModificationPayment === true,
          createdAt: paymentFromDB.createdAt.toISOString(),
          timestamp: new Date().toISOString(),
        });
      }

      // 🔍 RECHERCHE 2 : Dans Stripe (en parallèle)
      let paymentFromStripe: typeof booking.payments[0] | undefined = undefined;
      let paymentFromStripeRefundable: number | undefined = undefined;

      if (searchAmount > 0) {
        try {
          // Chercher les Payment Intents dans Stripe
          const stripePaymentIntents = await stripe.paymentIntents.list({
            limit: 100,
          });

          // Filtrer les Payment Intents qui correspondent à cette réservation
          let matchingPaymentIntents = stripePaymentIntents.data.filter(pi => {
            const metadata = pi.metadata || {};
            const matchesBookingId = metadata.bookingId === booking.id;
            const matchesReference = metadata.bookingReference === booking.reference;
            const amountMatches = Math.abs((pi.amount / 100) - searchAmount) < 5;
            const isNotModification = metadata.isModificationPayment !== "true";
            return (matchesBookingId || matchesReference) && amountMatches && isNotModification && pi.status === "succeeded";
          });

          // Si aucun trouvé avec métadonnées, chercher par montant seul
          if (matchingPaymentIntents.length === 0) {
            matchingPaymentIntents = stripePaymentIntents.data.filter(pi => {
              const amountMatches = Math.abs((pi.amount / 100) - searchAmount) < 5;
              const isNotModification = (pi.metadata?.isModificationPayment !== "true");
              return amountMatches && isNotModification && pi.status === "succeeded";
            });
          }

          if (matchingPaymentIntents.length > 0) {
            // Utiliser le Payment Intent le plus ancien (paiement initial)
            const initialPaymentIntent = matchingPaymentIntents.sort((a, b) => a.created - b.created)[0];
            
            // Vérifier les remboursements existants
            const existingRefunds = await stripe.refunds.list({
              payment_intent: initialPaymentIntent.id,
              limit: 100,
            });

            const totalRefunded = existingRefunds.data.reduce((sum, refund) => sum + (refund.amount || 0), 0);
            const originalAmount = initialPaymentIntent.amount;
            paymentFromStripeRefundable = (originalAmount - totalRefunded) / 100;

            console.log(`[Refund] 📊 Payment Intent initial trouvé dans Stripe`, {
              paymentIntentId: initialPaymentIntent.id,
              originalAmount: `${(originalAmount / 100).toFixed(2)}€`,
              totalRefunded: `${(totalRefunded / 100).toFixed(2)}€`,
              refundableAmount: `${paymentFromStripeRefundable.toFixed(2)}€`,
              requestedRefund: `${input.amount.toFixed(2)}€`,
              timestamp: new Date().toISOString(),
            });

            // Créer un payment factice depuis Stripe
            const stripeMetadata = initialPaymentIntent.metadata || {};
            paymentFromStripe = {
              id: `stripe_${initialPaymentIntent.id}`,
              transactionId: initialPaymentIntent.id,
              amount: paymentFromStripeRefundable,
              status: "COMPLETED" as const,
              method: "STRIPE" as const,
              metadata: {
                ...stripeMetadata,
                refundableAmount: paymentFromStripeRefundable,
                totalRefunded: totalRefunded / 100,
              } as Record<string, unknown>,
              createdAt: new Date(initialPaymentIntent.created * 1000),
            } as typeof booking.payments[0];
          }
        } catch (stripeError) {
          console.error(`[Refund] ⚠️  Erreur lors de la recherche dans Stripe:`, stripeError);
        }
      }

      // 🔍 COMPARAISON : Choisir le meilleur paiement (DB ou Stripe)
      // Priorité : Celui qui a le plus de montant remboursable ET qui est suffisant pour le remboursement
      if (paymentFromDB && paymentFromStripe) {
        // Vérifier le montant remboursable du paiement DB en interrogeant Stripe
        const dbPaymentIntentId = (paymentFromDB.metadata as PaymentMetadata)?.stripePaymentIntentId;
        if (dbPaymentIntentId && typeof dbPaymentIntentId === "string") {
          try {
            const existingRefunds = await stripe.refunds.list({
              payment_intent: dbPaymentIntentId,
              limit: 100,
            });
            const totalRefunded = existingRefunds.data.reduce((sum, refund) => sum + (refund.amount || 0), 0);
            const originalAmountInCents = Math.round(paymentFromDB.amount * 100);
            paymentFromDBRefundable = (originalAmountInCents - totalRefunded) / 100;
            
            console.log(`[Refund] 📊 Montant remboursable du paiement DB vérifié dans Stripe`, {
              paymentId: paymentFromDB.id,
              paymentIntentId: dbPaymentIntentId,
              originalAmount: `${paymentFromDB.amount.toFixed(2)}€`,
              totalRefunded: `${(totalRefunded / 100).toFixed(2)}€`,
              refundableAmount: `${paymentFromDBRefundable.toFixed(2)}€`,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            console.warn(`[Refund] ⚠️  Erreur lors de la vérification du paiement DB dans Stripe:`, error);
          }
        }

        // Comparer les deux et choisir le meilleur
        const dbIsSufficient = paymentFromDBRefundable !== undefined && paymentFromDBRefundable >= input.amount;
        const stripeIsSufficient = paymentFromStripeRefundable !== undefined && paymentFromStripeRefundable >= input.amount;

        if (dbIsSufficient && stripeIsSufficient) {
          // Les deux sont suffisants, choisir celui avec le plus de montant remboursable
          if ((paymentFromDBRefundable || 0) >= (paymentFromStripeRefundable || 0)) {
            payment = paymentFromDB;
            payment.amount = paymentFromDBRefundable || payment.amount;
            console.log(`[Refund] ✅ Choix : Paiement DB (montant remboursable: ${paymentFromDBRefundable?.toFixed(2)}€)`);
          } else {
            payment = paymentFromStripe;
            console.log(`[Refund] ✅ Choix : Paiement Stripe (montant remboursable: ${paymentFromStripeRefundable?.toFixed(2)}€)`);
          }
        } else if (dbIsSufficient) {
          payment = paymentFromDB;
          payment.amount = paymentFromDBRefundable || payment.amount;
          console.log(`[Refund] ✅ Choix : Paiement DB (seul suffisant, montant remboursable: ${paymentFromDBRefundable?.toFixed(2)}€)`);
        } else if (stripeIsSufficient) {
          payment = paymentFromStripe;
          console.log(`[Refund] ✅ Choix : Paiement Stripe (seul suffisant, montant remboursable: ${paymentFromStripeRefundable?.toFixed(2)}€)`);
        } else {
          // Aucun n'est suffisant, choisir celui avec le plus de montant remboursable
          if ((paymentFromDBRefundable || 0) >= (paymentFromStripeRefundable || 0)) {
            payment = paymentFromDB;
            payment.amount = paymentFromDBRefundable || payment.amount;
            console.log(`[Refund] ⚠️  Choix : Paiement DB (meilleur disponible mais insuffisant, montant remboursable: ${paymentFromDBRefundable?.toFixed(2)}€)`);
          } else {
            payment = paymentFromStripe;
            console.log(`[Refund] ⚠️  Choix : Paiement Stripe (meilleur disponible mais insuffisant, montant remboursable: ${paymentFromStripeRefundable?.toFixed(2)}€)`);
          }
        }
      } else if (paymentFromDB) {
        // Vérifier le montant remboursable du paiement DB
        const dbPaymentIntentId = (paymentFromDB.metadata as PaymentMetadata)?.stripePaymentIntentId;
        if (dbPaymentIntentId && typeof dbPaymentIntentId === "string") {
          try {
            const existingRefunds = await stripe.refunds.list({
              payment_intent: dbPaymentIntentId,
              limit: 100,
            });
            const totalRefunded = existingRefunds.data.reduce((sum, refund) => sum + (refund.amount || 0), 0);
            const originalAmountInCents = Math.round(paymentFromDB.amount * 100);
            paymentFromDBRefundable = (originalAmountInCents - totalRefunded) / 100;
            payment = paymentFromDB;
            payment.amount = paymentFromDBRefundable || payment.amount;
            console.log(`[Refund] ✅ Choix : Paiement DB uniquement (montant remboursable: ${paymentFromDBRefundable?.toFixed(2)}€)`);
          } catch {
            payment = paymentFromDB;
            console.log(`[Refund] ✅ Choix : Paiement DB uniquement (montant: ${paymentFromDB.amount.toFixed(2)}€, vérification Stripe échouée)`);
          }
        } else {
          payment = paymentFromDB;
          console.log(`[Refund] ✅ Choix : Paiement DB uniquement (montant: ${paymentFromDB.amount.toFixed(2)}€)`);
        }
      } else if (paymentFromStripe) {
        payment = paymentFromStripe;
        console.log(`[Refund] ✅ Choix : Paiement Stripe uniquement (montant remboursable: ${paymentFromStripeRefundable?.toFixed(2)}€)`);
      } else {
        // Fallback : prendre le premier paiement disponible
        payment = booking.payments[0];
        console.log(`[Refund] ⚠️  Aucun paiement initial trouvé (ni en DB ni dans Stripe), utilisation du premier paiement disponible`, {
          paymentId: payment.id,
          amount: `${payment.amount.toFixed(2)}€`,
          originalDepositPaid: `${booking.originalDepositPaid.toFixed(2)}€`,
          totalPayments: booking.payments.length,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      // Pour les autres raisons (cancellation), utiliser le premier paiement
      payment = booking.payments[0];
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

    // Récupérer le Payment Intent ID depuis les métadonnées, la transaction, ou directement depuis Stripe
    let paymentIntentId: string | null = null;

    // Si le payment a un ID qui commence par "stripe_", c'est qu'il vient directement de Stripe
    // Dans ce cas, transactionId contient déjà le Payment Intent ID
    if (payment.id.startsWith("stripe_")) {
      paymentIntentId = payment.transactionId;
      
      // Vérifier les remboursements existants sur ce Payment Intent
      if (paymentIntentId) {
        try {
          const existingRefunds = await stripe.refunds.list({
            payment_intent: paymentIntentId,
            limit: 100,
          });

        const totalRefunded = existingRefunds.data.reduce((sum, refund) => sum + (refund.amount || 0), 0);
        const originalAmount = (payment.metadata as Record<string, unknown>)?.originalAmount as number | undefined;
        const refundableAmount = originalAmount 
          ? (originalAmount - totalRefunded) / 100 
          : payment.amount;

        console.log(`[Refund] ✅ Payment Intent ID récupéré depuis Stripe (paiement initial manquant dans DB)`, {
          paymentIntentId: paymentIntentId,
          originalAmount: originalAmount ? `${(originalAmount / 100).toFixed(2)}€` : "N/A",
          totalRefunded: `${(totalRefunded / 100).toFixed(2)}€`,
          refundableAmount: `${refundableAmount.toFixed(2)}€`,
          paymentAmount: `${payment.amount.toFixed(2)}€`,
          timestamp: new Date().toISOString(),
        });

          // Mettre à jour le montant du payment avec le montant remboursable
          if (refundableAmount !== payment.amount) {
            payment.amount = refundableAmount;
            // Stocker le montant remboursable dans les métadonnées pour utilisation ultérieure
            // Note: On utilise Object.assign pour éviter les problèmes de type Prisma Json
            const currentMetadata = (payment.metadata || {}) as Record<string, unknown>;
            Object.assign(currentMetadata, {
              refundableAmount: refundableAmount,
              totalRefunded: totalRefunded / 100,
            });
            // Note: On ne peut pas réassigner payment.metadata directement à cause du type Prisma Json
            // mais les valeurs sont stockées dans currentMetadata qui sera utilisé plus tard
            console.log(`[Refund] 💰 Montant du payment mis à jour avec le montant remboursable`, {
              oldAmount: `${payment.amount.toFixed(2)}€`,
              newAmount: `${refundableAmount.toFixed(2)}€`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (refundCheckError) {
          console.warn(`[Refund] ⚠️  Erreur lors de la vérification des remboursements pour le Payment Intent depuis Stripe:`, refundCheckError);
        }
      }
    } else {
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
    
    // 🔍 VÉRIFICATION CRITIQUE : Vérifier les remboursements existants sur le Payment Intent
    let refundableAmount: number | undefined = undefined;
    let effectivePaymentAmount = payment.amount;
    
    if (paymentIntentId) {
      try {
        const existingRefunds = await stripe.refunds.list({
          payment_intent: paymentIntentId,
          limit: 100,
        });

        const totalRefunded = existingRefunds.data.reduce((sum, refund) => sum + (refund.amount || 0), 0);
        const originalAmountInCents = Math.round(payment.amount * 100);
        refundableAmount = (originalAmountInCents - totalRefunded) / 100; // En euros

        console.log(`[Refund] 🔍 Vérification des remboursements existants sur le Payment Intent:`, {
          paymentIntentId: paymentIntentId,
          originalAmount: `${payment.amount.toFixed(2)}€`,
          totalRefunded: `${(totalRefunded / 100).toFixed(2)}€`,
          refundableAmount: `${refundableAmount.toFixed(2)}€`,
          requestedRefund: `${input.amount.toFixed(2)}€`,
          existingRefundsCount: existingRefunds.data.length,
          existingRefunds: existingRefunds.data.map(r => ({
            id: r.id,
            amount: `${((r.amount || 0) / 100).toFixed(2)}€`,
            status: r.status,
            reason: r.reason,
          })),
          timestamp: new Date().toISOString(),
        });

        // Utiliser le montant remboursable si disponible
        if (refundableAmount >= 0) {
          effectivePaymentAmount = refundableAmount;
        }
      } catch (refundCheckError) {
        console.warn(`[Refund] ⚠️  Erreur lors de la vérification des remboursements:`, {
          error: refundCheckError instanceof Error ? refundCheckError.message : "Erreur inconnue",
          paymentIntentId: paymentIntentId,
          timestamp: new Date().toISOString(),
        });
        // En cas d'erreur, utiliser le montant du payment tel quel
        effectivePaymentAmount = payment.amount;
      }
    }
    
    // ⚠️ VÉRIFICATION CRITIQUE : Si le montant remboursable est <= 0, ne pas continuer
    if (refundableAmount !== undefined && refundableAmount <= 0) {
      const errorMessage = `Le Payment Intent a déjà été complètement remboursé. Montant remboursable disponible : ${refundableAmount.toFixed(2)}€. Aucun remboursement supplémentaire possible.`;
      console.warn(`[Refund] ⚠️  ${errorMessage}`, {
        paymentId: payment.id,
        paymentIntentId: paymentIntentId,
        originalAmount: `${payment.amount.toFixed(2)}€`,
        refundableAmount: `${refundableAmount.toFixed(2)}€`,
        requestedRefund: `${input.amount.toFixed(2)}€`,
        timestamp: new Date().toISOString(),
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Utiliser refundableAmount si disponible, sinon effectivePaymentAmount
    const finalRefundableAmount = refundableAmount !== undefined && refundableAmount > 0 
      ? refundableAmount 
      : effectivePaymentAmount;
    
    const paidAmountInCents = Math.round(finalRefundableAmount * 100);

    console.log(`[Refund] 💰 Vérification du montant remboursable:`, {
      paymentId: payment.id,
      paymentAmount: `${payment.amount.toFixed(2)}€`,
      refundableAmount: refundableAmount ? `${refundableAmount.toFixed(2)}€` : "N/A",
      effectivePaymentAmount: `${effectivePaymentAmount.toFixed(2)}€`,
      finalRefundableAmount: `${finalRefundableAmount.toFixed(2)}€`,
      requestedRefund: `${input.amount.toFixed(2)}€`,
      timestamp: new Date().toISOString(),
    });

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
      // chercher directement dans Stripe via l'API
      // IMPORTANT: Si originalDepositPaid est à 0, utiliser depositPaid actuel comme fallback
      const searchAmount = booking.originalDepositPaid && booking.originalDepositPaid > 0 
        ? booking.originalDepositPaid 
        : (booking.depositPaid || 0);
      
      if (nonModificationPayments.length === 0 && searchAmount > 0 && input.reason === "booking_modification") {
        console.log(`[Refund] ⚠️  Aucun paiement non-modification trouvé dans la DB`);
        console.log(`[Refund] 💰 Montants: originalDepositPaid=${(booking.originalDepositPaid || 0).toFixed(2)}€, depositPaid=${(booking.depositPaid || 0).toFixed(2)}€, searchAmount=${searchAmount.toFixed(2)}€`);
        console.log(`[Refund] 🔍 Recherche du paiement initial dans Stripe via l'API...`);
        
        try {
          // Chercher les Payment Intents dans Stripe avec les métadonnées de la réservation
          const stripePaymentIntents = await stripe.paymentIntents.list({
            limit: 100,
            // Filtrer par métadonnées bookingId ou bookingReference
            // Note: Stripe ne supporte pas directement le filtrage par métadonnées dans list(),
            // donc on récupère les 100 derniers et on filtre côté code
          });

          // Log de débogage : afficher les premiers Payment Intents pour comprendre la structure
          console.log(`[Refund] 🔍 Analyse des Payment Intents Stripe (échantillon):`, {
            totalFound: stripePaymentIntents.data.length,
            originalDepositPaid: `${(booking.originalDepositPaid || 0).toFixed(2)}€`,
            depositPaid: `${(booking.depositPaid || 0).toFixed(2)}€`,
            searchAmount: `${searchAmount.toFixed(2)}€`,
            bookingId: booking.id,
            bookingReference: booking.reference,
            samplePayments: stripePaymentIntents.data.slice(0, 5).map(pi => ({
              id: pi.id,
              amount: `${(pi.amount / 100).toFixed(2)}€`,
              status: pi.status,
              created: new Date(pi.created * 1000).toISOString(),
              metadata: pi.metadata,
              amountDiff: `${Math.abs((pi.amount / 100) - searchAmount).toFixed(2)}€`,
            })),
            timestamp: new Date().toISOString(),
          });

          // Filtrer les Payment Intents qui correspondent à cette réservation
          // Stratégie 1 : Recherche stricte (bookingId/reference + montant + non-modification)
          let matchingPaymentIntents = stripePaymentIntents.data.filter(pi => {
            const metadata = pi.metadata || {};
            const matchesBookingId = metadata.bookingId === booking.id;
            const matchesReference = metadata.bookingReference === booking.reference;
            const amountMatches = Math.abs((pi.amount / 100) - searchAmount) < 5; // Tolérance 5€
            const isNotModification = metadata.isModificationPayment !== "true";
            
            return (matchesBookingId || matchesReference) && amountMatches && isNotModification && pi.status === "succeeded";
          });

          // Stratégie 2 : Si aucun trouvé, chercher par montant seul (si les métadonnées sont absentes)
          if (matchingPaymentIntents.length === 0) {
            console.log(`[Refund] 🔍 Aucun Payment Intent trouvé avec la stratégie stricte, essai avec recherche par montant seul...`);
            matchingPaymentIntents = stripePaymentIntents.data.filter(pi => {
              const amountMatches = Math.abs((pi.amount / 100) - searchAmount) < 5; // Tolérance 5€
              const isNotModification = (pi.metadata?.isModificationPayment !== "true");
              const isSucceeded = pi.status === "succeeded";
              
              return amountMatches && isNotModification && isSucceeded;
            });

            if (matchingPaymentIntents.length > 0) {
              console.log(`[Refund] ⚠️  Payment Intents trouvés par montant seul (sans vérification bookingId/reference):`, {
                count: matchingPaymentIntents.length,
                payments: matchingPaymentIntents.map(pi => ({
                  id: pi.id,
                  amount: `${(pi.amount / 100).toFixed(2)}€`,
                  status: pi.status,
                  metadata: pi.metadata,
                })),
                timestamp: new Date().toISOString(),
              });
            }
          }

          // Stratégie 3 : Chercher aussi via les Checkout Sessions
          if (matchingPaymentIntents.length === 0) {
            console.log(`[Refund] 🔍 Aucun Payment Intent trouvé, recherche via Checkout Sessions...`);
            try {
              const checkoutSessions = await stripe.checkout.sessions.list({
                limit: 100,
              });

              const matchingSessions = checkoutSessions.data.filter(session => {
                const metadata = session.metadata || {};
                const matchesBookingId = metadata.bookingId === booking.id;
                const matchesReference = metadata.bookingReference === booking.reference;
                const amountMatches = session.amount_total ? Math.abs((session.amount_total / 100) - searchAmount) < 5 : false;
                const isNotModification = metadata.isModificationPayment !== "true";
                const isPaid = session.payment_status === "paid";

                return (matchesBookingId || matchesReference) && amountMatches && isNotModification && isPaid && session.payment_intent;
              });

              if (matchingSessions.length > 0) {
                console.log(`[Refund] ✅ Checkout Sessions trouvées:`, {
                  count: matchingSessions.length,
                  sessions: matchingSessions.map(s => ({
                    id: s.id,
                    paymentIntentId: s.payment_intent,
                    amount: `${((s.amount_total || 0) / 100).toFixed(2)}€`,
                    metadata: s.metadata,
                  })),
                  timestamp: new Date().toISOString(),
                });

                // Récupérer les Payment Intents depuis les Checkout Sessions
                for (const session of matchingSessions) {
                  if (session.payment_intent && typeof session.payment_intent === "string") {
                    try {
                      const pi = await stripe.paymentIntents.retrieve(session.payment_intent);
                      if (pi.status === "succeeded" && !matchingPaymentIntents.find(m => m.id === pi.id)) {
                        matchingPaymentIntents.push(pi);
                      }
                    } catch (err) {
                      console.warn(`[Refund] ⚠️  Impossible de récupérer le Payment Intent ${session.payment_intent}:`, err);
                    }
                  }
                }
              }
            } catch (checkoutError) {
              console.warn(`[Refund] ⚠️  Erreur lors de la recherche via Checkout Sessions:`, checkoutError);
            }
          }

          console.log(`[Refund] 🔍 Payment Intents trouvés dans Stripe (résultat final):`, {
            totalFound: stripePaymentIntents.data.length,
            matchingCount: matchingPaymentIntents.length,
            matchingPayments: matchingPaymentIntents.map(pi => ({
              id: pi.id,
              amount: `${(pi.amount / 100).toFixed(2)}€`,
              status: pi.status,
              created: new Date(pi.created * 1000).toISOString(),
              metadata: pi.metadata,
            })),
            timestamp: new Date().toISOString(),
          });

          if (matchingPaymentIntents.length > 0) {
            // Utiliser le Payment Intent le plus ancien (paiement initial)
            const initialPaymentIntent = matchingPaymentIntents.sort((a, b) => a.created - b.created)[0];
            
            // 🔍 VÉRIFICATION CRITIQUE : Vérifier les remboursements existants sur ce Payment Intent
            console.log(`[Refund] 🔍 Vérification des remboursements existants sur le Payment Intent...`);
            try {
              const existingRefunds = await stripe.refunds.list({
                payment_intent: initialPaymentIntent.id,
                limit: 100,
              });

              const totalRefunded = existingRefunds.data.reduce((sum, refund) => {
                return sum + (refund.amount || 0);
              }, 0);

              const originalAmount = initialPaymentIntent.amount;
              const refundableAmount = (originalAmount - totalRefunded) / 100; // En euros

              console.log(`[Refund] 💰 Analyse du Payment Intent:`, {
                paymentIntentId: initialPaymentIntent.id,
                originalAmount: `${(originalAmount / 100).toFixed(2)}€`,
                totalRefunded: `${(totalRefunded / 100).toFixed(2)}€`,
                refundableAmount: `${refundableAmount.toFixed(2)}€`,
                requestedRefund: `${input.amount.toFixed(2)}€`,
                existingRefundsCount: existingRefunds.data.length,
                existingRefunds: existingRefunds.data.map(r => ({
                  id: r.id,
                  amount: `${((r.amount || 0) / 100).toFixed(2)}€`,
                  status: r.status,
                  reason: r.reason,
                })),
                timestamp: new Date().toISOString(),
              });

              // Si le montant demandé dépasse le montant remboursable, ajuster ou utiliser plusieurs Payment Intents
              if (input.amount > refundableAmount) {
                console.warn(`[Refund] ⚠️  Le montant demandé (${input.amount.toFixed(2)}€) dépasse le montant remboursable (${refundableAmount.toFixed(2)}€) sur ce Payment Intent`);
                console.warn(`[Refund] 💡 Le Payment Intent a déjà été partiellement remboursé.`);
                
                // Si le montant remboursable est > 0, on peut quand même rembourser ce montant
                // et chercher d'autres Payment Intents pour le reste
                if (refundableAmount > 0) {
                  console.log(`[Refund] 💡 On peut rembourser ${refundableAmount.toFixed(2)}€ sur ce Payment Intent`);
                  // On continuera avec ce Payment Intent mais on ajustera le montant plus tard
                } else {
                  console.warn(`[Refund] ⚠️  Ce Payment Intent est déjà complètement remboursé, on cherche un autre Payment Intent...`);
                  // Retirer ce Payment Intent de la liste et chercher le suivant
                  matchingPaymentIntents = matchingPaymentIntents.filter(pi => pi.id !== initialPaymentIntent.id);
                  // Si d'autres Payment Intents disponibles, utiliser le suivant
                  if (matchingPaymentIntents.length > 0) {
                    const nextPaymentIntent = matchingPaymentIntents.sort((a, b) => a.created - b.created)[0];
                    console.log(`[Refund] 🔄 Utilisation du Payment Intent suivant: ${nextPaymentIntent.id}`);
                    // Continuer avec nextPaymentIntent (on sortira de cette condition et on utilisera celui-ci)
                    // Pour l'instant, on continue avec initialPaymentIntent mais on ajustera le montant
                  }
                }
              }

              console.log(`[Refund] ✅ Payment Intent initial trouvé dans Stripe`, {
                paymentIntentId: initialPaymentIntent.id,
                amount: `${(initialPaymentIntent.amount / 100).toFixed(2)}€`,
                totalRefunded: `${(totalRefunded / 100).toFixed(2)}€`,
                refundableAmount: `${refundableAmount.toFixed(2)}€`,
                originalDepositPaid: `${(booking.originalDepositPaid ?? 0).toFixed(2)}€`,
                depositPaid: `${(booking.depositPaid ?? 0).toFixed(2)}€`,
                searchAmount: `${searchAmount.toFixed(2)}€`,
                created: new Date(initialPaymentIntent.created * 1000).toISOString(),
                timestamp: new Date().toISOString(),
              });

              // Créer un objet payment factice pour utiliser la logique existante
              // mais on utilisera directement le Payment Intent ID de Stripe
              const stripeMetadata = initialPaymentIntent.metadata || {};
              payment = {
                id: `stripe_${initialPaymentIntent.id}`, // ID factice
                transactionId: initialPaymentIntent.id, // Utiliser le Payment Intent ID comme transactionId
                amount: refundableAmount > 0 ? refundableAmount : (initialPaymentIntent.amount / 100), // Utiliser le montant remboursable si > 0, sinon le montant original
                status: "COMPLETED" as const,
                method: "STRIPE" as const,
                metadata: {
                  ...stripeMetadata,
                  refundableAmount: refundableAmount, // Ajouter le montant remboursable dans les métadonnées
                  totalRefunded: totalRefunded / 100, // Ajouter le total remboursé
                } as Record<string, unknown>,
                createdAt: new Date(initialPaymentIntent.created * 1000),
              } as typeof booking.payments[0];

              console.log(`[Refund] ✅ Paiement initial récupéré depuis Stripe, utilisation pour le remboursement`, {
                paymentIntentId: initialPaymentIntent.id,
                originalAmount: `${(initialPaymentIntent.amount / 100).toFixed(2)}€`,
                refundableAmount: `${refundableAmount.toFixed(2)}€`,
                refundAmount: `${input.amount.toFixed(2)}€`,
                canRefundFullAmount: refundableAmount >= input.amount,
                timestamp: new Date().toISOString(),
              });
            } catch (refundCheckError) {
              console.error(`[Refund] ⚠️  Erreur lors de la vérification des remboursements:`, refundCheckError);
              // En cas d'erreur, utiliser le Payment Intent tel quel (comportement précédent)
              const stripeMetadata = initialPaymentIntent.metadata || {};
              payment = {
                id: `stripe_${initialPaymentIntent.id}`,
                transactionId: initialPaymentIntent.id,
                amount: initialPaymentIntent.amount / 100,
                status: "COMPLETED" as const,
                method: "STRIPE" as const,
                metadata: stripeMetadata as Record<string, unknown>,
                createdAt: new Date(initialPaymentIntent.created * 1000),
              } as typeof booking.payments[0];
            }
          } else {
            // Aucun Payment Intent trouvé dans Stripe, utiliser tous les paiements disponibles
            console.log(`[Refund] ⚠️  Aucun Payment Intent initial trouvé dans Stripe, utilisation de TOUS les paiements disponibles`);
            nonModificationPayments = booking.payments;
            totalRefundableAmount = booking.payments.reduce((sum, p) => sum + p.amount, 0);
          }
        } catch (stripeError) {
          console.error(`[Refund] ❌ Erreur lors de la recherche dans Stripe:`, {
            error: stripeError instanceof Error ? stripeError.message : "Erreur inconnue",
            timestamp: new Date().toISOString(),
          });
          // En cas d'erreur Stripe, utiliser tous les paiements disponibles
          nonModificationPayments = booking.payments;
          totalRefundableAmount = booking.payments.reduce((sum, p) => sum + p.amount, 0);
        }
        
        if (nonModificationPayments.length > 0 && !payment) {
          console.log(`[Refund] 📋 Tous les paiements utilisés pour remboursement:`, {
            count: nonModificationPayments.length,
            totalAmount: `${totalRefundableAmount.toFixed(2)}€`,
            originalDepositPaid: `${(booking.originalDepositPaid ?? 0).toFixed(2)}€`,
            requestedRefund: `${input.amount.toFixed(2)}€`,
            payments: nonModificationPayments.map(p => ({
              id: p.id,
              amount: `${p.amount.toFixed(2)}€`,
              createdAt: p.createdAt.toISOString(),
            })),
            timestamp: new Date().toISOString(),
          });
        }
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
      const errorMessage = `Le montant du remboursement (${input.amount.toFixed(2)}€) dépasse le montant remboursable disponible (${finalRefundableAmount.toFixed(2)}€). ${refundableAmount !== undefined && refundableAmount < payment.amount ? "Ce Payment Intent a déjà été partiellement ou complètement remboursé." : ""}`;
      
      console.error(`[Refund] ❌ ${errorMessage}`, {
        requestedAmount: `${input.amount.toFixed(2)}€`,
        refundableAmount: `${finalRefundableAmount.toFixed(2)}€`,
        originalPaymentAmount: `${payment.amount.toFixed(2)}€`,
        timestamp: new Date().toISOString(),
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Créer le remboursement Stripe
    if (!paymentIntentId) {
      return {
        success: false,
        error: "Impossible de trouver le Payment Intent pour créer le remboursement.",
      };
    }

    // 🔒 SÉCURITÉ : Utiliser le montant remboursable réel, pas le montant demandé
    // Si le montant demandé dépasse le montant remboursable, on rembourse seulement ce qui est disponible
    const effectiveRefundAmountInCents = Math.min(amountInCents, paidAmountInCents);
    const effectiveRefundAmount = effectiveRefundAmountInCents / 100;

    // ⚠️ VÉRIFICATION CRITIQUE : Si le montant remboursable est <= 0, ne pas créer de remboursement
    // (Cette vérification devrait déjà avoir été faite plus tôt, mais on la refait par sécurité)
    if (effectiveRefundAmount <= 0 || paidAmountInCents <= 0) {
      const errorMessage = `Le montant remboursable est de ${effectiveRefundAmount.toFixed(2)}€ ou moins. Le Payment Intent a déjà été complètement remboursé. Aucun remboursement supplémentaire n'est nécessaire ou possible.`;
      console.warn(`[Refund] ⚠️  ${errorMessage}`, {
        effectiveRefundAmount: `${effectiveRefundAmount.toFixed(2)}€`,
        paidAmountInCents: paidAmountInCents,
        finalRefundableAmount: `${finalRefundableAmount.toFixed(2)}€`,
        requestedAmount: `${input.amount.toFixed(2)}€`,
        timestamp: new Date().toISOString(),
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    if (effectiveRefundAmount < input.amount) {
      console.warn(`[Refund] ⚠️  Le montant demandé (${input.amount.toFixed(2)}€) dépasse le montant remboursable (${effectiveRefundAmount.toFixed(2)}€)`);
      console.warn(`[Refund] 💡 Remboursement partiel : ${effectiveRefundAmount.toFixed(2)}€ au lieu de ${input.amount.toFixed(2)}€`);
    }

    console.log(`[Refund] 💳 Création du remboursement Stripe`, {
      paymentIntentId: paymentIntentId,
      requestedAmount: `${input.amount.toFixed(2)}€`,
      refundableAmount: `${(refundableAmount ?? effectiveRefundAmount).toFixed(2)}€`,
      effectiveRefundAmount: `${effectiveRefundAmount.toFixed(2)}€`,
      isPartialRefund: effectiveRefundAmount < input.amount,
      timestamp: new Date().toISOString(),
    });

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: effectiveRefundAmountInCents, // Utiliser le montant remboursable réel
      reason: "requested_by_customer",
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.reference,
        reason: input.reason,
        requestedAmount: input.amount.toFixed(2),
        effectiveRefundAmount: effectiveRefundAmount.toFixed(2),
        isPartialRefund: (effectiveRefundAmount < input.amount).toString(),
      },
    });

    // Enregistrer le remboursement dans la base de données
    console.log(`[Refund] 💾 Enregistrement du remboursement dans la base de données`, {
      bookingId: booking.id,
      refundId: refund.id,
      amount: `-${effectiveRefundAmount.toFixed(2)}€`,
      requestedAmount: `${input.amount.toFixed(2)}€`,
      isPartialRefund: effectiveRefundAmount < input.amount,
      status: refund.status === "succeeded" ? "COMPLETED" : "PENDING",
      timestamp: new Date().toISOString(),
    });

    const createdRefundPayment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        amount: -effectiveRefundAmount, // Montant négatif pour un remboursement (utiliser le montant réellement remboursé)
        method: "STRIPE",
        status: refund.status === "succeeded" ? "COMPLETED" : "PENDING",
        transactionId: refund.id,
        metadata: {
          stripeRefundId: refund.id,
          stripePaymentIntentId: paymentIntentId,
          reason: input.reason,
          originalPaymentId: payment.id,
          requestedAmount: input.amount,
          effectiveRefundAmount: effectiveRefundAmount,
          isPartialRefund: effectiveRefundAmount < input.amount,
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
      const newDepositPaid = Math.max(0, previousDepositPaid - effectiveRefundAmount); // Utiliser le montant réellement remboursé
      
      console.log(`[Refund] 💰 Mise à jour du depositPaid`, {
        bookingId: booking.id,
        previousDepositPaid: `${previousDepositPaid.toFixed(2)}€`,
        requestedRefundAmount: `${input.amount.toFixed(2)}€`,
        effectiveRefundAmount: `${effectiveRefundAmount.toFixed(2)}€`,
        newDepositPaid: `${newDepositPaid.toFixed(2)}€`,
        isPartialRefund: effectiveRefundAmount < input.amount,
        timestamp: new Date().toISOString(),
      });

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          depositPaid: {
            decrement: effectiveRefundAmount, // Réduire l'acompte payé du montant réellement remboursé
          },
        },
      });

      console.log(`[Refund] ✅ depositPaid mis à jour`, {
        bookingId: booking.id,
        newDepositPaid: `${newDepositPaid.toFixed(2)}€`,
        timestamp: new Date().toISOString(),
      });
    }

    const isPartialRefund = effectiveRefundAmount < input.amount;
    const successMessage = isPartialRefund
      ? `Remboursement partiel créé avec succès : ${effectiveRefundAmount.toFixed(2)}€ remboursés sur ${input.amount.toFixed(2)}€ demandés. Le Payment Intent avait déjà été partiellement remboursé.`
      : `Remboursement créé avec succès : ${effectiveRefundAmount.toFixed(2)}€`;

    console.log(`[Refund] ✅ Remboursement créé avec succès pour la réservation ${booking.reference}`, {
      bookingId: booking.id,
      bookingReference: booking.reference,
      refundId: refund.id,
      requestedAmount: `${input.amount.toFixed(2)}€`,
      effectiveRefundAmount: `${effectiveRefundAmount.toFixed(2)}€`,
      isPartialRefund: isPartialRefund,
      reason: input.reason,
      stripeStatus: refund.status,
      paymentIntentId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      refundId: refund.id,
      ...(isPartialRefund && { warning: successMessage }),
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

