import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { validateWebhookSignature, validateSessionMetadata } from "./utils/validation";
import { handleCheckoutSessionCompleted } from "./handlers/checkout-session-handler";
import { handleRefundEvent } from "./handlers/refund-handler";
import type { CheckoutSessionData, RefundEventData } from "./types";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  // Valider la signature du webhook
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const validation = await validateWebhookSignature(body, signature, webhookSecret);

  if (!validation.valid || !validation.event) {
    return NextResponse.json(
      { error: validation.error || "Webhook validation failed" },
      { status: validation.error?.includes("Missing") ? 400 : 500 }
    );
  }

  const event = validation.event;

  try {
    // Traiter les événements checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Valider les métadonnées
      const metadataValidation = validateSessionMetadata(session);
      if (!metadataValidation.valid || !metadataValidation.bookingId || !metadataValidation.userId) {
        return NextResponse.json({ received: true });
      }

      const checkoutData: CheckoutSessionData = {
        bookingId: metadataValidation.bookingId,
        userId: metadataValidation.userId,
        session,
        event,
      };

      return await handleCheckoutSessionCompleted(checkoutData);
    }

    // Traiter les événements de remboursement
    if (
      event.type === "charge.refunded" ||
      event.type === "refund.created" ||
      event.type === "refund.updated"
    ) {
      const refund = event.data.object as Stripe.Refund;
      
      const refundData: RefundEventData = {
        refund,
        event,
        bookingId: refund.metadata?.bookingId,
        bookingReference: refund.metadata?.bookingReference,
      };

      return await handleRefundEvent(refundData);
    }

    // Événements non gérés
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing webhook:", {
      error: error instanceof Error ? error.message : "Unknown error",
      eventType: event?.type || "N/A",
      eventId: event?.id || "N/A",
    });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
