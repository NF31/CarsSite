import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Stripe from "stripe";
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

      console.log(`[Stripe Webhook] Processing checkout.session.completed`, {
        sessionId: session.id,
        paymentStatus: session.payment_status,
        metadata: session.metadata,
      });

      const bookingId = session.metadata?.bookingId;
      const userId = session.metadata?.userId;

      if (!bookingId || !userId) {
        console.error("[Stripe Webhook] Missing metadata in session:", {
          sessionId: session.id,
          metadata: session.metadata,
        });
        return NextResponse.json({ received: true });
      }

      console.log(`[Stripe Webhook] Processing payment for booking ${bookingId}`, {
        userId,
        amountTotal: session.amount_total,
      });

      // Récupérer la réservation
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
          vehicle: {
            select: {
              id: true,
              deposit: true,
            },
          },
        },
      });

      if (!booking || booking.userId !== userId) {
        console.error("[Stripe Webhook] Booking not found or user mismatch:", bookingId);
        return NextResponse.json({ received: true });
      }

      // Calculer le montant de l'acompte et de la caution
      const priceResult = await calculateBookingPriceAction({
        vehicleId: booking.vehicle.id,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        startTime: "10:00", // Valeur par défaut
        endTime: "10:00", // Valeur par défaut
        serviceIds: booking.serviceIds,
      });

      if (!priceResult.success || !priceResult.data) {
        console.error("[Stripe Webhook] Failed to calculate price for booking:", bookingId);
        return NextResponse.json({ received: true });
      }

      const { deposit: downPayment, securityDeposit } = priceResult.data;
      const totalPaid = downPayment + securityDeposit;

      // Arrondir les montants à 2 décimales pour éviter les problèmes de précision
      const roundedDownPayment = Math.round(downPayment * 100) / 100;
      const roundedSecurityDeposit = Math.round(securityDeposit * 100) / 100;
      const roundedRemainingAmount = Math.round(priceResult.data.remainingAmount * 100) / 100;
      const roundedTotalPaid = Math.round(totalPaid * 100) / 100;

      // Vérifier que le montant payé correspond
      const amountPaid = session.amount_total ? session.amount_total / 100 : 0; // Convertir de centimes en euros
      const roundedAmountPaid = Math.round(amountPaid * 100) / 100;

      if (Math.abs(roundedAmountPaid - roundedTotalPaid) > 0.01) {
        console.warn(
          `[Stripe Webhook] Amount mismatch for booking ${bookingId}: expected ${roundedTotalPaid}, got ${roundedAmountPaid}`
        );
      }

      // Mettre à jour la réservation avec l'acompte ET la caution payés
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          depositPaid: roundedDownPayment, // L'acompte payé (30% de la location)
          securityDepositPaid: roundedSecurityDeposit, // La caution de garantie payée
          remainingAmount: roundedRemainingAmount, // Le solde restant à payer à la remise
        },
      });

      // Créer un enregistrement de paiement
      await prisma.payment.create({
        data: {
          bookingId: bookingId,
          userId: userId,
          amount: roundedAmountPaid, // Montant arrondi
          method: "STRIPE",
          status: "COMPLETED",
          transactionId: session.id,
          metadata: {
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string | undefined,
            downPayment: roundedDownPayment,
            securityDeposit: roundedSecurityDeposit,
          },
        },
      });

      // Récupérer l'ID du paiement créé
      const createdPayment = await prisma.payment.findFirst({
        where: {
          bookingId: bookingId,
          transactionId: session.id,
        },
        select: {
          id: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log(`[Stripe Webhook] ✅ Payment processed for booking ${bookingId}`, {
        amountPaid: `${roundedAmountPaid.toFixed(2)}€`,
        breakdown: {
          downPayment: `${roundedDownPayment.toFixed(2)}€ (30% de la location)`,
          securityDeposit: `${roundedSecurityDeposit.toFixed(2)}€ (caution de garantie)`,
          total: `${roundedTotalPaid.toFixed(2)}€`,
        },
        booking: {
          depositPaid: `${roundedDownPayment.toFixed(2)}€`,
          securityDepositPaid: `${roundedSecurityDeposit.toFixed(2)}€`,
          remainingAmount: `${roundedRemainingAmount.toFixed(2)}€ (solde à la remise)`,
        },
        paymentId: createdPayment?.id || "N/A",
      });
    } else {
      console.log(`[Stripe Webhook] Event type ${event.type} not handled`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

