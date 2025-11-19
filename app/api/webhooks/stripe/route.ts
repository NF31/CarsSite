import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Stripe from "stripe";
import { BookingStatus } from "@prisma/client";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    console.log(`[Stripe Webhook] Received event: ${event.type}`, {
      eventId: event.id,
      sessionId: event.data.object && "id" in event.data.object ? event.data.object.id : "N/A",
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log(`[Stripe Webhook] 🔔 Event checkout.session.completed reçu`, {
        eventId: event.id,
        sessionId: session.id,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total ? `${(session.amount_total / 100).toFixed(2)}€` : "N/A",
        currency: session.currency?.toUpperCase() || "EUR",
        customerEmail: session.customer_email || "N/A",
        metadata: session.metadata,
        timestamp: new Date().toISOString(),
      });

      const bookingId = session.metadata?.bookingId;
      const userId = session.metadata?.userId;

      if (!bookingId || !userId) {
        console.error("[Stripe Webhook] ❌ Métadonnées manquantes dans la session Stripe", {
          sessionId: session.id,
          metadata: session.metadata,
          expectedFields: ["bookingId", "userId"],
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({ received: true });
      }

      console.log(`[Stripe Webhook] 📋 Début du traitement du paiement`, {
        bookingId,
        userId,
        sessionId: session.id,
        amountTotal: session.amount_total ? `${(session.amount_total / 100).toFixed(2)}€` : "0.00€",
        timestamp: new Date().toISOString(),
      });

      // Récupérer la réservation
      console.log(`[Stripe Webhook] 🔍 Récupération de la réservation depuis la base de données`, {
        bookingId,
        timestamp: new Date().toISOString(),
      });

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          userId: true,
          totalPrice: true,
          depositPaid: true,
          serviceIds: true,
          startDate: true,
          endDate: true,
          status: true,
          vehicle: {
            select: {
              id: true,
              deposit: true,
            },
          },
        },
      });

      if (!booking || booking.userId !== userId) {
        console.error("[Stripe Webhook] ❌ Réservation introuvable ou utilisateur non correspondant", {
          bookingId,
          userId,
          bookingFound: !!booking,
          bookingUserId: booking?.userId || "N/A",
          expectedUserId: userId,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({ received: true });
      }

      console.log(`[Stripe Webhook] ✅ Réservation trouvée`, {
        bookingId: booking.id,
        reference: bookingId,
        currentStatus: booking.status,
        currentDepositPaid: `${(booking.depositPaid || 0).toFixed(2)}€`,
        totalPrice: `${booking.totalPrice.toFixed(2)}€`,
        vehicleId: booking.vehicle.id,
        vehicleDeposit: `${(booking.vehicle.deposit || 0).toFixed(2)}€`,
        serviceIds: booking.serviceIds.length > 0 ? booking.serviceIds : "Aucun service",
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        timestamp: new Date().toISOString(),
      });

      // Calculer le montant de l'acompte et de la caution
      console.log(`[Stripe Webhook] 💰 Calcul du prix de la réservation`, {
        bookingId,
        vehicleId: booking.vehicle.id,
        serviceIds: booking.serviceIds,
        timestamp: new Date().toISOString(),
      });

      const priceResult = await calculateBookingPriceAction({
        vehicleId: booking.vehicle.id,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        startTime: "10:00", // Valeur par défaut
        endTime: "10:00", // Valeur par défaut
        serviceIds: booking.serviceIds,
      });

      if (!priceResult.success || !priceResult.data) {
        console.error("[Stripe Webhook] ❌ Échec du calcul du prix pour la réservation", {
          bookingId,
          error: priceResult.error || "Erreur inconnue",
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({ received: true });
      }

      console.log(`[Stripe Webhook] ✅ Calcul du prix réussi`, {
        bookingId,
        priceBreakdown: {
          vehiclePrice: `${priceResult.data.vehiclePrice.toFixed(2)}€`,
          servicesPrice: `${priceResult.data.servicesPrice.toFixed(2)}€`,
          totalPrice: `${priceResult.data.totalPrice.toFixed(2)}€`,
          downPayment: `${priceResult.data.deposit.toFixed(2)}€ (30%)`,
          securityDeposit: `${priceResult.data.securityDeposit.toFixed(2)}€`,
          remainingAmount: `${priceResult.data.remainingAmount.toFixed(2)}€`,
          numberOfDays: priceResult.data.numberOfDays.toFixed(2),
        },
        timestamp: new Date().toISOString(),
      });

      const { deposit: downPayment, securityDeposit } = priceResult.data;
      
      // Récupérer le type de paiement depuis les métadonnées
      const paymentType = session.metadata?.paymentType || "full";
      const isAuthorization = paymentType === "authorization";
      const isDepositOnly = paymentType === "deposit";

      // Arrondir les montants à 2 décimales pour éviter les problèmes de précision
      const roundedDownPayment = Math.round(downPayment * 100) / 100;
      const roundedSecurityDeposit = Math.round(securityDeposit * 100) / 100;
      const roundedRemainingAmount = Math.round(priceResult.data.remainingAmount * 100) / 100;

      // Vérifier que le montant payé correspond
      const amountPaid = session.amount_total ? session.amount_total / 100 : 0; // Convertir de centimes en euros
      const roundedAmountPaid = Math.round(amountPaid * 100) / 100;
      
      // Déterminer le montant attendu selon le type de paiement
      let expectedAmount: number;
      if (isAuthorization) {
        // Pour l'empreinte, on attend seulement la caution
        expectedAmount = roundedSecurityDeposit;
      } else if (isDepositOnly) {
        // Pour l'acompte seulement, on attend l'acompte
        expectedAmount = roundedDownPayment;
      } else {
        // Pour le paiement complet, on attend acompte + caution
        expectedAmount = roundedDownPayment + roundedSecurityDeposit;
      }

      console.log(`[Stripe Webhook] 🔢 Vérification des montants`, {
        bookingId,
        paymentType,
        amounts: {
          expected: `${expectedAmount.toFixed(2)}€`,
          receivedFromStripe: `${roundedAmountPaid.toFixed(2)}€`,
          difference: `${Math.abs(roundedAmountPaid - expectedAmount).toFixed(2)}€`,
        },
        breakdown: {
          downPayment: `${roundedDownPayment.toFixed(2)}€`,
          securityDeposit: `${roundedSecurityDeposit.toFixed(2)}€`,
          remainingAmount: `${roundedRemainingAmount.toFixed(2)}€`,
        },
        timestamp: new Date().toISOString(),
      });

      if (Math.abs(roundedAmountPaid - expectedAmount) > 0.01) {
        console.warn(`[Stripe Webhook] ⚠️  Écart de montant détecté pour la réservation ${bookingId}`, {
          bookingId,
          paymentType,
          expected: `${expectedAmount.toFixed(2)}€`,
          received: `${roundedAmountPaid.toFixed(2)}€`,
          difference: `${Math.abs(roundedAmountPaid - expectedAmount).toFixed(2)}€`,
          threshold: "0.01€",
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log(`[Stripe Webhook] ✅ Montants correspondants`, {
          bookingId,
          paymentType,
          amountPaid: `${roundedAmountPaid.toFixed(2)}€`,
          timestamp: new Date().toISOString(),
        });
      }

      // Mettre à jour la réservation selon le type de paiement
      let updateData: {
        remainingAmount: number;
        depositPaid?: number;
        securityDepositPaid?: number;
        status?: typeof BookingStatus[keyof typeof BookingStatus];
      } = {
        remainingAmount: roundedRemainingAmount, // Le solde restant à payer à la remise
      };

      if (isAuthorization) {
        // Pour l'empreinte bancaire : on ne met à jour que securityDepositPaid (bloqué, pas payé)
        // Le statut reste PENDING jusqu'à confirmation manuelle
        updateData = {
          ...updateData,
          securityDepositPaid: roundedSecurityDeposit,
          status: BookingStatus.PENDING, // Reste en attente, pas de confirmation automatique
        };
        console.log(`[Stripe Webhook] 📝 Mise à jour de la réservation (empreinte bancaire)`, {
          bookingId,
          updates: {
            previousStatus: booking.status,
            newStatus: BookingStatus.PENDING,
            securityDepositPaid: `${roundedSecurityDeposit.toFixed(2)}€ (bloqué)`,
            remainingAmount: `${roundedRemainingAmount.toFixed(2)}€`,
            note: "Aucun débit effectué, juste blocage de la caution",
          },
          timestamp: new Date().toISOString(),
        });
      } else if (isDepositOnly) {
        // Pour l'acompte seulement : on met à jour depositPaid
        updateData = {
          ...updateData,
          depositPaid: roundedDownPayment,
          status: BookingStatus.CONFIRMED, // Confirmation automatique après paiement de l'acompte
        };
        console.log(`[Stripe Webhook] 📝 Mise à jour de la réservation (acompte seulement)`, {
          bookingId,
          updates: {
            previousStatus: booking.status,
            newStatus: BookingStatus.CONFIRMED,
            previousDepositPaid: `${(booking.depositPaid || 0).toFixed(2)}€`,
            newDepositPaid: `${roundedDownPayment.toFixed(2)}€`,
            remainingAmount: `${roundedRemainingAmount.toFixed(2)}€`,
            note: "Caution sera bloquée lors de la confirmation",
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        // Pour le paiement complet : on met à jour depositPaid ET securityDepositPaid
        updateData = {
          ...updateData,
          depositPaid: roundedDownPayment,
          securityDepositPaid: roundedSecurityDeposit,
          status: BookingStatus.CONFIRMED, // Confirmation automatique après paiement réussi
        };
        console.log(`[Stripe Webhook] 📝 Mise à jour de la réservation (paiement complet)`, {
          bookingId,
          updates: {
            previousStatus: booking.status,
            newStatus: BookingStatus.CONFIRMED,
            previousDepositPaid: `${(booking.depositPaid || 0).toFixed(2)}€`,
            newDepositPaid: `${roundedDownPayment.toFixed(2)}€`,
            securityDepositPaid: `${roundedSecurityDeposit.toFixed(2)}€`,
            remainingAmount: `${roundedRemainingAmount.toFixed(2)}€`,
          },
          timestamp: new Date().toISOString(),
        });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        select: {
          id: true,
          status: true,
          depositPaid: true,
          securityDepositPaid: true,
          remainingAmount: true,
          reference: true,
          totalPrice: true,
          startDate: true,
          endDate: true,
          userId: true,
          vehicleId: true,
          pickupLocationId: true,
          returnLocationId: true,
        },
      });

      console.log(`[Stripe Webhook] ✅ Réservation mise à jour avec succès`, {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        depositPaid: `${(updatedBooking.depositPaid || 0).toFixed(2)}€`,
        securityDepositPaid: `${(updatedBooking.securityDepositPaid || 0).toFixed(2)}€`,
        remainingAmount: `${(updatedBooking.remainingAmount || 0).toFixed(2)}€`,
        timestamp: new Date().toISOString(),
      });

      // Créer un enregistrement de paiement AVANT l'envoi de l'email
      // Note: PaymentStatus n'a pas "AUTHORIZED", on utilise "PENDING" pour l'empreinte
      const paymentStatus = isAuthorization ? "PENDING" : "COMPLETED";
      
      // Déterminer le montant à enregistrer dans Payment selon le type de paiement
      const paymentAmount = roundedAmountPaid; // Montant réellement payé via Stripe
      
      console.log(`[Stripe Webhook] 💳 Création de l'enregistrement de paiement dans la table Payment`, {
        bookingId,
        userId,
        paymentDetails: {
          amountToRecord: `${paymentAmount.toFixed(2)}€`,
          amountFromStripe: `${roundedAmountPaid.toFixed(2)}€`,
          paymentType,
          breakdown: {
            downPayment: isDepositOnly ? `${roundedDownPayment.toFixed(2)}€` : (isAuthorization ? "0.00€" : `${roundedDownPayment.toFixed(2)}€`),
            securityDeposit: isAuthorization ? `${roundedSecurityDeposit.toFixed(2)}€ (bloqué)` : (isDepositOnly ? "0.00€" : `${roundedSecurityDeposit.toFixed(2)}€`),
          },
        },
        method: "STRIPE",
        status: paymentStatus,
        transactionId: session.id,
        paymentIntentId: session.payment_intent || "N/A",
        timestamp: new Date().toISOString(),
      });

      const createdPayment = await prisma.payment.create({
        data: {
          bookingId: bookingId,
          userId: userId,
          amount: paymentAmount, // Montant réellement payé (93.75€ pour l'acompte seul)
          method: "STRIPE",
          status: paymentStatus,
          transactionId: session.id,
          metadata: {
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string | undefined,
            paymentType: paymentType,
            downPayment: isAuthorization ? 0 : (isDepositOnly ? roundedDownPayment : roundedDownPayment),
            securityDeposit: isAuthorization ? roundedSecurityDeposit : (isDepositOnly ? 0 : roundedSecurityDeposit),
            amountPaid: paymentAmount, // Montant total enregistré dans Payment
          },
        },
        select: {
          id: true,
          amount: true,
          status: true,
          transactionId: true,
          createdAt: true,
        },
      });

      console.log(`[Stripe Webhook] ✅ Enregistrement de paiement créé dans la table Payment`, {
        paymentId: createdPayment.id,
        bookingId,
        paymentRecord: {
          amount: `${createdPayment.amount.toFixed(2)}€`,
          status: createdPayment.status,
          transactionId: createdPayment.transactionId,
          createdAt: createdPayment.createdAt.toISOString(),
        },
        bookingUpdate: {
          depositPaid: `${roundedDownPayment.toFixed(2)}€`,
          securityDepositPaid: isAuthorization ? `${roundedSecurityDeposit.toFixed(2)}€ (bloqué)` : (isDepositOnly ? "0.00€" : `${roundedSecurityDeposit.toFixed(2)}€`),
          status: isDepositOnly ? "CONFIRMED" : (isAuthorization ? "PENDING" : "CONFIRMED"),
        },
        verification: {
          paymentAmountMatches: paymentAmount === roundedAmountPaid ? "✅ Oui" : "❌ Non",
          depositPaidMatches: isDepositOnly ? (paymentAmount === roundedDownPayment ? "✅ Oui" : "❌ Non") : "N/A (paiement complet)",
        },
        timestamp: new Date().toISOString(),
      });

      // Envoyer l'email de confirmation si le statut est CONFIRMED
      if (updatedBooking.status === BookingStatus.CONFIRMED) {
        console.log(`[Stripe Webhook] 📧 Préparation de l'envoi de l'email de confirmation`, {
          bookingId: updatedBooking.id,
          reference: updatedBooking.reference,
          status: updatedBooking.status,
          timestamp: new Date().toISOString(),
        });

        try {
          // Récupérer les informations nécessaires pour l'email
          const [user, vehicle, pickupLocation, returnLocation] = await Promise.all([
            prisma.user.findUnique({
              where: { id: updatedBooking.userId },
              select: {
                email: true,
                name: true,
              },
            }),
            prisma.vehicle.findUnique({
              where: { id: updatedBooking.vehicleId },
              select: {
                brand: true,
                model: true,
                licensePlate: true,
              },
            }),
            prisma.location.findUnique({
              where: { id: updatedBooking.pickupLocationId },
              select: {
                name: true,
              },
            }),
            prisma.location.findUnique({
              where: { id: updatedBooking.returnLocationId },
              select: {
                name: true,
              },
            }),
          ]);

          if (!user || !vehicle || !pickupLocation || !returnLocation) {
            console.error(`[Stripe Webhook] ❌ Données manquantes pour l'envoi de l'email`, {
              bookingId: updatedBooking.id,
              userFound: !!user,
              vehicleFound: !!vehicle,
              pickupLocationFound: !!pickupLocation,
              returnLocationFound: !!returnLocation,
              timestamp: new Date().toISOString(),
            });
          } else {
            // Formater la période de réservation
            const bookingPeriod = `${format(updatedBooking.startDate, "dd MMMM yyyy 'à' HH:mm", {
              locale: fr,
            })} → ${format(updatedBooking.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

            // Déterminer le message de salutation
            const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";

            // Envoyer l'email de confirmation
            const emailResult = await sendBookingConfirmationEmail({
              to: user.email,
              name: user.name || "Client",
              greeting,
              booking: {
                reference: updatedBooking.reference,
                totalPrice: updatedBooking.totalPrice,
                depositPaid: updatedBooking.depositPaid || 0,
                remainingAmount: updatedBooking.remainingAmount || 0,
                startDate: updatedBooking.startDate,
                endDate: updatedBooking.endDate,
                status: updatedBooking.status,
                period: bookingPeriod,
              },
              vehicle: {
                label: `${vehicle.brand} ${vehicle.model}`,
                licensePlate: vehicle.licensePlate,
              },
              locations: {
                pickup: pickupLocation.name,
                return: returnLocation.name,
              },
            });

            if (emailResult.skipped) {
              console.warn(`[Stripe Webhook] ⚠️  Email de confirmation ignoré pour la réservation ${updatedBooking.reference} (credentials non configurés)`, {
                bookingId: updatedBooking.id,
                reference: updatedBooking.reference,
                timestamp: new Date().toISOString(),
              });
            } else if (!emailResult.success) {
              console.error(`[Stripe Webhook] ❌ Échec de l'envoi de l'email de confirmation pour la réservation ${updatedBooking.reference}`, {
                bookingId: updatedBooking.id,
                reference: updatedBooking.reference,
                error: emailResult.error || "raison inconnue",
                timestamp: new Date().toISOString(),
              });
            } else {
              console.log(`[Stripe Webhook] ✅ Email de confirmation envoyé avec succès`, {
                bookingId: updatedBooking.id,
                reference: updatedBooking.reference,
                recipient: user.email,
                messageId: emailResult.messageId,
                queued: emailResult.queued,
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch (error) {
          console.error(`[Stripe Webhook] ❌ Erreur lors de l'envoi de l'email de confirmation`, {
            bookingId: updatedBooking.id,
            reference: updatedBooking.reference,
            error: error instanceof Error ? error.message : "Erreur inconnue",
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
          });
          // Ne pas bloquer le webhook si l'email échoue
        }
      } else {
        console.log(`[Stripe Webhook] 📧 Email de confirmation non envoyé (statut: ${updatedBooking.status}, attendu: CONFIRMED)`, {
          bookingId: updatedBooking.id,
          reference: updatedBooking.reference,
          currentStatus: updatedBooking.status,
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`[Stripe Webhook] 🎉 Paiement traité avec succès pour la réservation ${bookingId}`, {
        bookingId,
        paymentId: createdPayment.id,
        summary: {
          totalPaid: `${roundedAmountPaid.toFixed(2)}€`,
          paymentType,
          breakdown: {
            downPayment: isDepositOnly ? `${roundedDownPayment.toFixed(2)}€ (30% de la location) - PAYÉ` : (isAuthorization ? "0.00€ (non payé)" : `${roundedDownPayment.toFixed(2)}€ (30% de la location) - PAYÉ`),
            securityDeposit: isAuthorization ? `${roundedSecurityDeposit.toFixed(2)}€ (caution de garantie) - BLOQUÉ` : (isDepositOnly ? "0.00€ (non payé)" : `${roundedSecurityDeposit.toFixed(2)}€ (caution de garantie) - PAYÉ`),
            total: `${expectedAmount.toFixed(2)}€`,
          },
        },
        databaseRecords: {
          paymentTable: {
            id: createdPayment.id,
            amount: `${createdPayment.amount.toFixed(2)}€`,
            status: createdPayment.status,
            transactionId: createdPayment.transactionId,
          },
          bookingTable: {
            status: updatedBooking.status,
            depositPaid: `${(updatedBooking.depositPaid || 0).toFixed(2)}€`,
            securityDepositPaid: `${(updatedBooking.securityDepositPaid || 0).toFixed(2)}€`,
            remainingAmount: `${(updatedBooking.remainingAmount || 0).toFixed(2)}€ (solde à la remise)`,
          },
        },
        stripe: {
          sessionId: session.id,
          paymentIntentId: session.payment_intent || "N/A",
          paymentStatus: session.payment_status,
          amountTotal: `${roundedAmountPaid.toFixed(2)}€`,
        },
        verification: {
          paymentAmountInPaymentTable: `${createdPayment.amount.toFixed(2)}€`,
          depositPaidInBookingTable: `${(updatedBooking.depositPaid || 0).toFixed(2)}€`,
          amountsMatch: isDepositOnly ? (createdPayment.amount === updatedBooking.depositPaid ? "✅ Oui" : "❌ Non") : "N/A (paiement complet)",
        },
        timestamp: new Date().toISOString(),
      });
    } else if (event.type === "charge.refunded" || event.type === "refund.created" || event.type === "refund.updated") {
      // Gestion des événements de remboursement Stripe
      const refund = event.data.object as Stripe.Refund;
      
      console.log(`[Stripe Webhook] 💰 Event ${event.type} reçu`, {
        eventId: event.id,
        refundId: refund.id,
        paymentIntentId: refund.payment_intent,
        amount: refund.amount ? `${(refund.amount / 100).toFixed(2)}€` : "N/A",
        status: refund.status,
        reason: refund.reason,
        metadata: refund.metadata,
        timestamp: new Date().toISOString(),
      });

      // Récupérer le bookingId depuis les métadonnées du remboursement
      const bookingId = refund.metadata?.bookingId;
      const bookingReference = refund.metadata?.bookingReference;

      if (!bookingId) {
        console.warn(`[Stripe Webhook] ⚠️  Aucun bookingId dans les métadonnées du remboursement`, {
          refundId: refund.id,
          metadata: refund.metadata,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({ received: true });
      }

      // Récupérer le paiement associé au remboursement
      const payment = await prisma.payment.findFirst({
        where: {
          bookingId: bookingId,
          transactionId: refund.id,
        },
        select: {
          id: true,
          bookingId: true,
          status: true,
          amount: true,
          metadata: true,
        },
      });

      if (!payment) {
        console.warn(`[Stripe Webhook] ⚠️  Aucun paiement trouvé pour ce remboursement`, {
          refundId: refund.id,
          bookingId: bookingId,
          bookingReference: bookingReference || "N/A",
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({ received: true });
      }

      // Déterminer le nouveau statut selon le statut Stripe
      let newStatus: "COMPLETED" | "PENDING" | "FAILED" = "PENDING";
      
      if (refund.status === "succeeded") {
        newStatus = "COMPLETED";
      } else if (refund.status === "failed" || refund.status === "canceled") {
        newStatus = "FAILED";
      } else {
        newStatus = "PENDING";
      }

      // Mettre à jour le statut du paiement si nécessaire
      if (payment.status !== newStatus) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: newStatus,
            metadata: {
              ...(typeof payment.metadata === "object" && payment.metadata !== null 
                ? (payment.metadata as Record<string, unknown>)
                : {}),
              lastWebhookEvent: event.type,
              lastWebhookEventId: event.id,
              lastWebhookTimestamp: new Date().toISOString(),
              stripeRefundStatus: refund.status,
            },
          },
        });

        console.log(`[Stripe Webhook] ✅ Statut du remboursement mis à jour`, {
          paymentId: payment.id,
          bookingId: bookingId,
          bookingReference: bookingReference || "N/A",
          refundId: refund.id,
          previousStatus: payment.status,
          newStatus: newStatus,
          stripeRefundStatus: refund.status,
          eventType: event.type,
          timestamp: new Date().toISOString(),
        });

        // Si le remboursement a échoué, restaurer le depositPaid
        if (newStatus === "FAILED" && refund.amount) {
          const refundAmount = refund.amount / 100; // Convertir de centimes en euros
          
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              depositPaid: {
                increment: refundAmount, // Restaurer le montant remboursé
              },
            },
          });

          console.log(`[Stripe Webhook] ⚠️  Remboursement échoué - depositPaid restauré`, {
            bookingId: bookingId,
            bookingReference: bookingReference || "N/A",
            refundId: refund.id,
            refundAmount: `${refundAmount.toFixed(2)}€`,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        console.log(`[Stripe Webhook] ℹ️  Statut du remboursement déjà à jour`, {
          paymentId: payment.id,
          bookingId: bookingId,
          refundId: refund.id,
          currentStatus: payment.status,
          stripeRefundStatus: refund.status,
          eventType: event.type,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      console.log(`[Stripe Webhook] Event type ${event.type} not handled`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] ❌ Erreur lors du traitement du webhook", {
      error: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
      eventType: event?.type || "N/A",
      eventId: event?.id || "N/A",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

