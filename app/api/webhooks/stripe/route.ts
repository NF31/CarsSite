import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Stripe from "stripe";
import { BookingStatus } from "@prisma/client";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";

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

      // Créer un enregistrement de paiement
      // Note: PaymentStatus n'a pas "AUTHORIZED", on utilise "PENDING" pour l'empreinte
      const paymentStatus = isAuthorization ? "PENDING" : "COMPLETED";
      console.log(`[Stripe Webhook] 💳 Création de l'enregistrement de paiement`, {
        bookingId,
        userId,
        amount: `${roundedAmountPaid.toFixed(2)}€`,
        method: "STRIPE",
        status: paymentStatus,
        paymentType,
        transactionId: session.id,
        paymentIntentId: session.payment_intent || "N/A",
        timestamp: new Date().toISOString(),
      });

      const createdPayment = await prisma.payment.create({
        data: {
          bookingId: bookingId,
          userId: userId,
          amount: roundedAmountPaid, // Montant arrondi
          method: "STRIPE",
          status: paymentStatus,
          transactionId: session.id,
          metadata: {
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string | undefined,
            paymentType: paymentType,
            downPayment: isAuthorization ? 0 : (isDepositOnly ? roundedDownPayment : roundedDownPayment),
            securityDeposit: isAuthorization ? roundedSecurityDeposit : (isDepositOnly ? 0 : roundedSecurityDeposit),
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

      console.log(`[Stripe Webhook] ✅ Enregistrement de paiement créé`, {
        paymentId: createdPayment.id,
        bookingId,
        amount: `${createdPayment.amount.toFixed(2)}€`,
        status: createdPayment.status,
        transactionId: createdPayment.transactionId,
        createdAt: createdPayment.createdAt.toISOString(),
        timestamp: new Date().toISOString(),
      });

      console.log(`[Stripe Webhook] 🎉 Paiement traité avec succès pour la réservation ${bookingId}`, {
        bookingId,
        paymentId: createdPayment.id,
        summary: {
          totalPaid: `${roundedAmountPaid.toFixed(2)}€`,
          breakdown: {
            downPayment: `${roundedDownPayment.toFixed(2)}€ (30% de la location)`,
            securityDeposit: `${roundedSecurityDeposit.toFixed(2)}€ (caution de garantie)`,
            total: `${expectedAmount.toFixed(2)}€`,
          },
        },
        booking: {
          status: "CONFIRMED",
          depositPaid: `${roundedDownPayment.toFixed(2)}€`,
          securityDepositPaid: `${roundedSecurityDeposit.toFixed(2)}€`,
          remainingAmount: `${roundedRemainingAmount.toFixed(2)}€ (solde à la remise)`,
        },
        stripe: {
          sessionId: session.id,
          paymentIntentId: session.payment_intent || "N/A",
          paymentStatus: session.payment_status,
        },
        timestamp: new Date().toISOString(),
      });
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

