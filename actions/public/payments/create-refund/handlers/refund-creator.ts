import { stripe } from "@/lib/stripe";
import prisma from '@/lib/prisma'
import type {
  BookingWithPayments,
  PaymentData,
  CreateRefundInput,
  CreateRefundResult,
  RefundableAmountInfo,
} from "../types";
import { getRefundableAmount } from "../utils/stripe-helpers";

/**
 * Calcule le montant remboursable pour un paiement
 */
export async function calculateRefundableAmount(
  payment: PaymentData,
  paymentIntentId: string
): Promise<RefundableAmountInfo> {
  const { refundableAmount, totalRefunded } = await getRefundableAmount(
    paymentIntentId,
    payment.amount
  );

  const effectivePaymentAmount = refundableAmount >= 0 ? refundableAmount : payment.amount;
  const finalRefundableAmount = refundableAmount > 0 ? refundableAmount : effectivePaymentAmount;

  return {
    refundableAmount,
    effectivePaymentAmount,
    finalRefundableAmount,
    totalRefunded,
    originalAmount: payment.amount,
  };
}

/**
 * Valide que le montant remboursable est suffisant
 */
export function validateRefundableAmount(
  refundableInfo: RefundableAmountInfo,
  requestedAmount: number
): { valid: boolean; error?: string } {
  if (refundableInfo.refundableAmount !== undefined && refundableInfo.refundableAmount <= 0) {
    return {
      valid: false,
      error: `Le Payment Intent a déjà été complètement remboursé. Montant remboursable disponible : ${refundableInfo.refundableAmount.toFixed(2)}€. Aucun remboursement supplémentaire possible.`,
    };
  }

  if (requestedAmount > refundableInfo.finalRefundableAmount) {
    return {
      valid: false,
      error: `Le montant du remboursement (${requestedAmount.toFixed(2)}€) dépasse le montant remboursable disponible (${refundableInfo.finalRefundableAmount.toFixed(2)}€). ${refundableInfo.refundableAmount !== undefined && refundableInfo.refundableAmount < refundableInfo.originalAmount ? "Ce Payment Intent a déjà été partiellement ou complètement remboursé." : ""}`,
    };
  }

  return { valid: true };
}

/**
 * Calcule le montant effectif du remboursement
 */
export function calculateEffectiveRefundAmount(
  requestedAmount: number,
  refundableAmount: number
): number {
  const amountInCents = Math.round(requestedAmount * 100);
  const paidAmountInCents = Math.round(refundableAmount * 100);
  const effectiveRefundAmountInCents = Math.min(amountInCents, paidAmountInCents);
  return effectiveRefundAmountInCents / 100;
}

/**
 * Crée le remboursement Stripe
 */
export async function createStripeRefund(
  paymentIntentId: string,
  amount: number,
  booking: BookingWithPayments,
  reason: string,
  requestedAmount: number
) {
  const amountInCents = Math.round(amount * 100);

  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amountInCents,
    reason: "requested_by_customer",
    metadata: {
      bookingId: booking.id,
      bookingReference: booking.reference,
      reason,
      requestedAmount: requestedAmount.toFixed(2),
      effectiveRefundAmount: amount.toFixed(2),
      isPartialRefund: (amount < requestedAmount).toString(),
    },
  });
}

/**
 * Enregistre le remboursement dans la base de données
 */
export async function saveRefundToDatabase(
  booking: BookingWithPayments,
  refund: { id: string; status: string | null },
  payment: PaymentData,
  paymentIntentId: string,
  effectiveRefundAmount: number,
  requestedAmount: number,
  reason: string
) {
  return await prisma.payment.create({
    data: {
      bookingId: booking.id,
      userId: booking.userId,
      amount: -effectiveRefundAmount,
      method: "STRIPE",
      status: refund.status === "succeeded" ? "COMPLETED" : "PENDING",
      transactionId: refund.id,
      metadata: {
        stripeRefundId: refund.id,
        stripePaymentIntentId: paymentIntentId,
        reason,
        originalPaymentId: payment.id,
        requestedAmount,
        effectiveRefundAmount,
        isPartialRefund: effectiveRefundAmount < requestedAmount,
      },
    },
  });
}

/**
 * Met à jour le montant de l'acompte payé
 */
export async function updateDepositPaid(
  bookingId: string,
  effectiveRefundAmount: number
): Promise<void> {
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      depositPaid: {
        decrement: effectiveRefundAmount,
      },
    },
  });
}

/**
 * Crée un remboursement complet
 */
export async function createRefund(
  booking: BookingWithPayments,
  payment: PaymentData,
  paymentIntentId: string,
  input: CreateRefundInput,
  refundableInfo: RefundableAmountInfo
): Promise<CreateRefundResult> {
  // Calculer le montant effectif
  const effectiveRefundAmount = calculateEffectiveRefundAmount(
    input.amount,
    refundableInfo.finalRefundableAmount
  );

  // Vérifier que le montant est valide
  if (effectiveRefundAmount <= 0) {
    return {
      success: false,
      error: `Le montant remboursable est de ${effectiveRefundAmount.toFixed(2)}€ ou moins. Le Payment Intent a déjà été complètement remboursé. Aucun remboursement supplémentaire n'est nécessaire ou possible.`,
    };
  }

  // Créer le remboursement Stripe
  const refund = await createStripeRefund(
    paymentIntentId,
    effectiveRefundAmount,
    booking,
    input.reason,
    input.amount
  );

  // Enregistrer dans la base de données
  await saveRefundToDatabase(
    booking,
    refund,
    payment,
    paymentIntentId,
    effectiveRefundAmount,
    input.amount,
    input.reason
  );

  // Mettre à jour le montant de l'acompte payé si nécessaire
  if (input.reason === "booking_modification" || input.reason === "cancellation") {
    await updateDepositPaid(booking.id, effectiveRefundAmount);
  }

  const isPartialRefund = effectiveRefundAmount < input.amount;
  const successMessage = isPartialRefund
    ? `Remboursement partiel créé avec succès : ${effectiveRefundAmount.toFixed(2)}€ remboursés sur ${input.amount.toFixed(2)}€ demandés. Le Payment Intent avait déjà été partiellement remboursé.`
    : `Remboursement créé avec succès : ${effectiveRefundAmount.toFixed(2)}€`;

  return {
    success: true,
    refundId: refund.id,
    ...(isPartialRefund && { warning: successMessage }),
  };
}

