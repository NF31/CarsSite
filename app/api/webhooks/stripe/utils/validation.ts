import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

/**
 * Utilitaires de validation pour les webhooks Stripe
 */

export async function validateWebhookSignature(
  body: string,
  signature: string | null,
  webhookSecret: string | undefined
): Promise<{ valid: boolean; event?: Stripe.Event; error?: string }> {
  if (!signature) {
    return { valid: false, error: "Missing stripe-signature header" };
  }

  if (!webhookSecret) {
    return { valid: false, error: "STRIPE_WEBHOOK_SECRET is not set" };
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    return { valid: true, event };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Signature verification failed",
    };
  }
}

export function validateSessionMetadata(
  session: Stripe.Checkout.Session
): { valid: boolean; bookingId?: string; userId?: string; error?: string } {
  const bookingId = session.metadata?.bookingId;
  const userId = session.metadata?.userId;

  if (!bookingId || !userId) {
    return {
      valid: false,
      error: "Missing required metadata: bookingId or userId",
    };
  }

  return { valid: true, bookingId, userId };
}

export async function validateBookingOwnership(
  bookingId: string,
  userId: string
): Promise<{ valid: boolean; booking?: any; error?: string }> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      totalPrice: true,
      depositPaid: true,
      securityDepositPaid: true,
      remainingAmount: true,
      serviceIds: true,
      startDate: true,
      endDate: true,
      status: true,
      modificationDepositDifference: true,
      originalStartDate: true,
      originalEndDate: true,
      originalTotalPrice: true,
      originalDepositPaid: true,
      vehicle: {
        select: {
          id: true,
          deposit: true,
        },
      },
    },
  });

  if (!booking) {
    return { valid: false, error: "Booking not found" };
  }

  if (booking.userId !== userId) {
    return { valid: false, error: "Booking does not belong to user" };
  }

  return { valid: true, booking };
}

