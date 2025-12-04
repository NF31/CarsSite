import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import type { RefundEventData, RefundProcessingResult } from "../types";

/**
 * Handler pour les événements de remboursement Stripe
 */
export async function handleRefundEvent(
  data: RefundEventData
): Promise<NextResponse> {
  const { refund, event } = data;

  try {
    const bookingId = refund.metadata?.bookingId;
    const bookingReference = refund.metadata?.bookingReference;

    if (!bookingId) {
      return NextResponse.json({ received: true });
    }

    // Récupérer le paiement associé
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
      return NextResponse.json({ received: true });
    }

    // Déterminer le nouveau statut
    let newStatus: "COMPLETED" | "PENDING" | "FAILED" = "PENDING";
    if (refund.status === "succeeded") {
      newStatus = "COMPLETED";
    } else if (refund.status === "failed" || refund.status === "canceled") {
      newStatus = "FAILED";
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

      // Si le remboursement a échoué, restaurer le depositPaid
      if (newStatus === "FAILED" && refund.amount) {
        const refundAmount = refund.amount / 100;
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            depositPaid: {
              increment: refundAmount,
            },
          },
        });
      }

      // Invalider le cache
      try {
        const { invalidateBookingCache } = await import("@/lib/cache-invalidation");
        const { revalidatePath } = await import("next/cache");

        await invalidateBookingCache(bookingId).catch(() => {});

        revalidatePath("/dashboard");
        revalidatePath("/admin/bookings");
        revalidatePath(`/admin/bookings/${bookingId}`);
        revalidatePath("/admin/dashboard");
      } catch (error) {
        // Ne pas bloquer le webhook
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing refund:", error);
    return NextResponse.json({ received: true });
  }
}

