import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/lib/types/payment-status";
import type Stripe from "stripe";
import type { PaymentAmounts, PaymentType } from "../types";

/**
 * Handler pour la création du paiement de secours
 */

/**
 * Crée un paiement de secours si le webhook ne l'a pas fait
 */
export async function createFallbackPayment(
  bookingId: string,
  userId: string,
  sessionId: string,
  stripeSession: Stripe.Checkout.Session,
  paymentType: PaymentType,
  amounts: PaymentAmounts
): Promise<void> {
  // Vérifier si un paiement existe déjà
  const existingPayment = await prisma.payment.findFirst({
    where: {
      transactionId: sessionId,
    },
  });

  if (existingPayment) {
    return;
  }

  // Déterminer le statut du paiement
  const paymentStatus =
    paymentType.type === "authorization" ? PaymentStatus.PENDING : PaymentStatus.COMPLETED;
  const paymentAmount = stripeSession.amount_total ? stripeSession.amount_total / 100 : 0;

  // Déterminer les métadonnées
  let metadataDownPayment: number;
  let metadataSecurityDeposit: number;

  if (paymentType.isModificationPayment) {
    metadataDownPayment = paymentAmount;
    metadataSecurityDeposit = 0;
  } else if (paymentType.type === "authorization") {
    metadataDownPayment = 0;
    metadataSecurityDeposit = amounts.actualSecurityDepositPaid;
  } else if (paymentType.type === "deposit") {
    metadataDownPayment = amounts.actualDepositPaid;
    metadataSecurityDeposit = 0;
  } else {
    metadataDownPayment = amounts.actualDepositPaid;
    metadataSecurityDeposit = amounts.actualSecurityDepositPaid;
  }

  await prisma.payment.create({
    data: {
      bookingId,
      userId,
      amount: paymentAmount,
      method: "STRIPE",
      status: paymentStatus,
      transactionId: sessionId,
      metadata: {
        stripeSessionId: sessionId,
        stripePaymentIntentId: stripeSession.payment_intent as string | undefined,
        paymentType: paymentType.type,
        isModificationPayment: paymentType.isModificationPayment,
        downPayment: metadataDownPayment,
        securityDeposit: metadataSecurityDeposit,
        amountPaid: paymentAmount,
        createdByFallback: true,
      },
    },
  });
}

