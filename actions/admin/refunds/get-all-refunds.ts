"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { stripe } from "@/lib/stripe";

export interface RefundListItem {
  id: string;
  bookingId: string;
  bookingReference: string;
  amount: number; // Montant en euros (toujours positif)
  status: string;
  method: string;
  transactionId: string | null;
  reason: string | null; // "cancellation" | "booking_modification" | etc.
  createdAt: string;
  metadata?: {
    stripeRefundId?: string;
    stripePaymentIntentId?: string;
    originalPaymentId?: string;
    requestedAmount?: number;
    effectiveRefundAmount?: number;
    isPartialRefund?: boolean;
    [key: string]: unknown;
  };
  booking?: {
    id: string;
    reference: string;
    userId: string;
    user?: {
      name: string;
      email: string | null;
    };
    vehicle?: {
      brand: string;
      model: string;
      licensePlate: string;
    };
  };
}

export interface GetAllRefundsResult {
  success: boolean;
  refunds?: RefundListItem[];
  totalRefunded?: number;
  error?: string;
}

/**
 * Récupère tous les remboursements de toutes les réservations
 */
export async function getAllRefundsAction(): Promise<GetAllRefundsResult> {
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

    // 1. Récupérer tous les paiements qui sont des remboursements depuis la DB
    const allPayments = await prisma.payment.findMany({
      where: {
        OR: [
          { amount: { lt: 0 } }, // Montant négatif = remboursement
          { transactionId: { startsWith: "re_" } }, // Transaction ID Stripe de remboursement
        ],
      },
      select: {
        id: true,
        bookingId: true,
        amount: true,
        status: true,
        method: true,
        transactionId: true,
        metadata: true,
        createdAt: true,
        booking: {
          select: {
            id: true,
            reference: true,
            userId: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            vehicle: {
              select: {
                brand: true,
                model: true,
                licensePlate: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Plus récent en premier
      },
    });

    // Transformer les paiements de la DB en remboursements
    const refundsFromDB: RefundListItem[] = [];

    for (const payment of allPayments) {
      const metadata = (payment.metadata || {}) as Record<string, unknown>;
      const isRefund = 
        payment.amount < 0 || 
        payment.transactionId?.startsWith("re_") ||
        metadata.reason === "cancellation" ||
        metadata.reason === "booking_modification";

      if (isRefund) {
        refundsFromDB.push({
          id: payment.id,
          bookingId: payment.bookingId,
          bookingReference: payment.booking.reference,
          amount: Math.abs(payment.amount), // Toujours positif pour l'affichage
          status: payment.status,
          method: payment.method,
          transactionId: payment.transactionId,
          reason: (metadata.reason as string) || null,
          createdAt: payment.createdAt.toISOString(),
          metadata: metadata as RefundListItem["metadata"],
          booking: payment.booking ? {
            id: payment.booking.id,
            reference: payment.booking.reference,
            userId: payment.booking.userId,
            user: payment.booking.user ? {
              name: payment.booking.user.name,
              email: payment.booking.user.email,
            } : undefined,
            vehicle: payment.booking.vehicle ? {
              brand: payment.booking.vehicle.brand,
              model: payment.booking.vehicle.model,
              licensePlate: payment.booking.vehicle.licensePlate,
            } : undefined,
          } : undefined,
        });
      }
    }

    // 2. Chercher aussi dans Stripe pour trouver tous les remboursements
    const stripeRefunds: RefundListItem[] = [];
    const paymentIntentIds = new Set<string>();
    const bookingIds = new Set<string>();

    // Récupérer toutes les réservations pour avoir leurs références
    const allBookings = await prisma.booking.findMany({
      select: {
        id: true,
        reference: true,
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            brand: true,
            model: true,
            licensePlate: true,
          },
        },
      },
    });

    // Créer un map pour trouver rapidement une réservation
    const bookingsMap = new Map<string, typeof allBookings[0]>();
    for (const booking of allBookings) {
      bookingIds.add(booking.id);
      bookingsMap.set(booking.id, booking);
      bookingsMap.set(booking.reference, booking);
    }

    // Collecter les Payment Intent IDs depuis les paiements de la DB
    for (const payment of allPayments) {
      const metadata = (payment.metadata || {}) as Record<string, unknown>;
      const paymentIntentId = 
        (metadata.stripePaymentIntentId as string) ||
        (payment.transactionId?.startsWith("pi_") ? payment.transactionId : null);
      
      if (paymentIntentId && paymentIntentId.startsWith("pi_")) {
        paymentIntentIds.add(paymentIntentId);
      }
    }

    // Chercher aussi les Payment Intents dans Stripe via les métadonnées
    try {
      const stripePaymentIntents = await stripe.paymentIntents.list({
        limit: 100,
      });

      // Filtrer les Payment Intents qui correspondent à nos réservations
      for (const pi of stripePaymentIntents.data) {
        const metadata = pi.metadata || {};
        const bookingIdFromMetadata = metadata.bookingId as string | undefined;
        const bookingRefFromMetadata = metadata.bookingReference as string | undefined;

        if (bookingIdFromMetadata && bookingIds.has(bookingIdFromMetadata)) {
          paymentIntentIds.add(pi.id);
        } else if (bookingRefFromMetadata && bookingsMap.has(bookingRefFromMetadata)) {
          paymentIntentIds.add(pi.id);
        }
      }
    } catch (stripeError) {
      console.warn("[Get All Refunds] Erreur lors de la recherche dans Stripe:", stripeError);
    }

    // Récupérer tous les remboursements Stripe pour chaque Payment Intent
    // IMPORTANT : Stripe est la source de vérité pour les remboursements
    const stripeRefundsMap = new Map<string, RefundListItem>(); // Utiliser transactionId comme clé
    
    for (const paymentIntentId of paymentIntentIds) {
      try {
        const existingRefunds = await stripe.refunds.list({
          payment_intent: paymentIntentId,
          limit: 100,
        });

        // Récupérer le Payment Intent pour obtenir les métadonnées
        let paymentIntent;
        try {
          paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        } catch (error) {
          console.warn(`[Get All Refunds] Erreur lors de la récupération du Payment Intent ${paymentIntentId}:`, error);
          continue;
        }

        const piMetadata = paymentIntent.metadata || {};
        const bookingIdFromPI = (piMetadata.bookingId || piMetadata.bookingReference) as string | undefined;
        const booking = bookingIdFromPI ? bookingsMap.get(bookingIdFromPI) : undefined;

        if (!booking) {
          console.warn(`[Get All Refunds] Aucune réservation trouvée pour Payment Intent ${paymentIntentId}`, {
            metadata: piMetadata,
          });
          continue;
        }

        for (const stripeRefund of existingRefunds.data) {
          const refundMetadata = stripeRefund.metadata || {};
          const stripeRefundAmount = (stripeRefund.amount || 0) / 100; // Convertir en euros
          
          // Créer le remboursement depuis Stripe (source de vérité)
          const refundFromStripe: RefundListItem = {
            id: stripeRefund.id, // Utiliser l'ID Stripe comme ID principal
            bookingId: booking.id,
            bookingReference: booking.reference,
            amount: stripeRefundAmount, // Montant depuis Stripe (source de vérité)
            status: stripeRefund.status === "succeeded" ? "COMPLETED" : stripeRefund.status === "pending" ? "PENDING" : "FAILED",
            method: "STRIPE",
            transactionId: stripeRefund.id,
            reason: (refundMetadata.reason as string) || null,
            createdAt: new Date(stripeRefund.created * 1000).toISOString(),
            metadata: {
              stripeRefundId: stripeRefund.id,
              stripePaymentIntentId: paymentIntentId,
              reason: (refundMetadata.reason as string | undefined) || undefined,
              fromStripe: true, // Flag pour indiquer que c'est depuis Stripe
            },
            booking: {
              id: booking.id,
              reference: booking.reference,
              userId: booking.userId,
              user: booking.user ? {
                name: booking.user.name,
                email: booking.user.email,
              } : undefined,
              vehicle: booking.vehicle ? {
                brand: booking.vehicle.brand,
                model: booking.vehicle.model,
                licensePlate: booking.vehicle.licensePlate,
              } : undefined,
            },
          };

          // Vérifier si ce remboursement existe en DB
          const dbRefund = refundsFromDB.find(
            r => r.transactionId === stripeRefund.id || 
            (r.metadata?.stripeRefundId === stripeRefund.id)
          );

          // Si trouvé en DB, utiliser les infos de Stripe mais garder les métadonnées enrichies de la DB
          if (dbRefund) {
            refundFromStripe.metadata = {
              ...refundFromStripe.metadata,
              ...(dbRefund.metadata || {}),
              fromStripe: true,
              synchronized: true, // Indique que c'est synchronisé
            };
            // Utiliser le montant de Stripe (source de vérité) même si différent de la DB
            if (Math.abs(refundFromStripe.amount - dbRefund.amount) > 0.01) {
              console.warn(`[Get All Refunds] ⚠️  Différence de montant entre Stripe et DB`, {
                stripeRefundId: stripeRefund.id,
                stripeAmount: refundFromStripe.amount,
                dbAmount: dbRefund.amount,
                bookingReference: booking.reference,
              });
            }
          } else {
            // Remboursement uniquement dans Stripe (créé manuellement peut-être)
            refundFromStripe.metadata = {
              ...refundFromStripe.metadata,
              fromStripeOnly: true,
            };
          }

          // Utiliser transactionId comme clé unique
          stripeRefundsMap.set(stripeRefund.id, refundFromStripe);
        }
      } catch (error) {
        console.warn(`[Get All Refunds] Erreur lors de la récupération des remboursements pour ${paymentIntentId}:`, error);
      }
    }

    // 3. Combiner les remboursements : Stripe est la source de vérité
    // Priorité : Stripe > DB (si pas dans Stripe, prendre DB)
    const allRefunds: RefundListItem[] = [];
    
    // D'abord, ajouter tous les remboursements de Stripe (source de vérité)
    for (const stripeRefund of stripeRefundsMap.values()) {
      allRefunds.push(stripeRefund);
    }
    
    // Ensuite, ajouter les remboursements de la DB qui ne sont PAS dans Stripe
    for (const dbRefund of refundsFromDB) {
      const existsInStripe = stripeRefundsMap.has(dbRefund.transactionId || "") ||
        (dbRefund.metadata?.stripeRefundId && stripeRefundsMap.has(dbRefund.metadata.stripeRefundId));
      
      if (!existsInStripe) {
        // Remboursement uniquement en DB (peut-être créé avant la sync Stripe)
        allRefunds.push({
          ...dbRefund,
          metadata: {
            ...dbRefund.metadata,
            fromDBOnly: true, // Flag pour indiquer que c'est uniquement en DB
          },
        });
      }
    }

    // Trier par date (plus récent en premier)
    const sortedRefunds = allRefunds.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Calculer le total remboursé
    const totalRefunded = sortedRefunds.reduce((sum, refund) => sum + refund.amount, 0);

    console.log("[Get All Refunds] ✅ Remboursements récupérés:", {
      refundsFromDB: refundsFromDB.length,
      refundsFromStripe: stripeRefunds.length,
      totalRefunds: sortedRefunds.length,
      totalRefunded,
    });

    return {
      success: true,
      refunds: sortedRefunds,
      totalRefunded,
    };
  } catch (error) {
    console.error("[Get All Refunds] Erreur lors de la récupération des remboursements:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue lors de la récupération des remboursements.",
    };
  }
}

