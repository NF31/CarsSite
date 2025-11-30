import { stripe } from "@/lib/stripe";
import type {
  BookingWithPayments,
  PaymentData,
  CreateRefundInput,
} from "../types";
import {
  findInitialPayment,
  filterNonModificationPayments,
  getPaymentIntentIdFromMetadata,
  getEffectiveDepositPaid,
  calculateTotalRefundableAmount,
  findBestPayment,
} from "../utils/payment-helpers";
import {
  searchPaymentIntentsInStripe,
  getRefundableAmount,
  createPaymentFromStripePaymentIntent,
  getPaymentIntentId,
} from "../utils/stripe-helpers";

/**
 * Recherche un paiement dans la base de données pour une modification
 */
async function findPaymentInDatabase(
  booking: BookingWithPayments,
  targetAmount: number
): Promise<{ payment?: PaymentData; refundableAmount?: number }> {
  const initialPayment = findInitialPayment(booking.payments, targetAmount);

  if (!initialPayment) {
    return {};
  }

  // Vérifier le montant remboursable dans Stripe
  const paymentIntentId = getPaymentIntentIdFromMetadata(initialPayment);
  if (paymentIntentId) {
    try {
      const { refundableAmount } = await getRefundableAmount(paymentIntentId, initialPayment.amount);
      return {
        payment: initialPayment,
        refundableAmount,
      };
    } catch {
      // En cas d'erreur, utiliser le montant du paiement
      return {
        payment: initialPayment,
        refundableAmount: initialPayment.amount,
      };
    }
  }

  return {
    payment: initialPayment,
    refundableAmount: initialPayment.amount,
  };
}

/**
 * Recherche un paiement dans Stripe pour une modification
 */
async function findPaymentInStripe(
  booking: BookingWithPayments,
  searchAmount: number
): Promise<{ payment?: PaymentData; refundableAmount?: number }> {
  if (searchAmount <= 0) {
    return {};
  }

  try {
    const matchingPaymentIntents = await searchPaymentIntentsInStripe(
      booking.id,
      booking.reference,
      searchAmount
    );

    if (matchingPaymentIntents.length === 0) {
      return {};
    }

    // Utiliser le Payment Intent le plus ancien (paiement initial)
    const initialPaymentIntent = matchingPaymentIntents[0];

    // Vérifier les remboursements existants
    const existingRefunds = await stripe.refunds.list({
      payment_intent: initialPaymentIntent.id,
      limit: 100,
    });

    const totalRefunded = existingRefunds.data.reduce((sum, refund) => sum + (refund.amount || 0), 0);
    const originalAmount = initialPaymentIntent.amount;
    const refundableAmount = (originalAmount - totalRefunded) / 100;

    const payment = createPaymentFromStripePaymentIntent(initialPaymentIntent, refundableAmount);

    return {
      payment,
      refundableAmount,
    };
  } catch {
    return {};
  }
}

/**
 * Choisit le meilleur paiement entre DB et Stripe
 */
function chooseBestPayment(
  dbResult: { payment?: PaymentData; refundableAmount?: number },
  stripeResult: { payment?: PaymentData; refundableAmount?: number },
  requestedAmount: number
): PaymentData | undefined {
  const { payment: paymentFromDB, refundableAmount: dbRefundable } = dbResult;
  const { payment: paymentFromStripe, refundableAmount: stripeRefundable } = stripeResult;

  if (!paymentFromDB && !paymentFromStripe) {
    return undefined;
  }

  if (paymentFromDB && !paymentFromStripe) {
    if (dbRefundable !== undefined) {
      paymentFromDB.amount = dbRefundable;
    }
    return paymentFromDB;
  }

  if (!paymentFromDB && paymentFromStripe) {
    return paymentFromStripe;
  }

  // Les deux sont disponibles, choisir le meilleur
  const dbIsSufficient = dbRefundable !== undefined && dbRefundable >= requestedAmount;
  const stripeIsSufficient = stripeRefundable !== undefined && stripeRefundable >= requestedAmount;

  if (dbIsSufficient && stripeIsSufficient) {
    // Les deux sont suffisants, choisir celui avec le plus de montant remboursable
    if ((dbRefundable || 0) >= (stripeRefundable || 0)) {
      paymentFromDB!.amount = dbRefundable || paymentFromDB!.amount;
      return paymentFromDB;
    } else {
      return paymentFromStripe;
    }
  } else if (dbIsSufficient) {
    paymentFromDB!.amount = dbRefundable || paymentFromDB!.amount;
    return paymentFromDB;
  } else if (stripeIsSufficient) {
    return paymentFromStripe;
  } else {
    // Aucun n'est suffisant, choisir celui avec le plus de montant remboursable
    if ((dbRefundable || 0) >= (stripeRefundable || 0)) {
      paymentFromDB!.amount = dbRefundable || paymentFromDB!.amount;
      return paymentFromDB;
    } else {
      return paymentFromStripe;
    }
  }
}

/**
 * Recherche le paiement initial pour une modification
 */
async function findInitialPaymentForModification(
  booking: BookingWithPayments,
  input: CreateRefundInput
): Promise<PaymentData | undefined> {
  const effectiveDepositPaid = getEffectiveDepositPaid(
    booking.originalDepositPaid,
    booking.depositPaid
  );

  const searchAmount =
    booking.originalDepositPaid && booking.originalDepositPaid > 0
      ? booking.originalDepositPaid
      : effectiveDepositPaid;

  // Recherche parallèle dans DB et Stripe
  const [dbResult, stripeResult] = await Promise.all([
    findPaymentInDatabase(booking, searchAmount),
    findPaymentInStripe(booking, searchAmount),
  ]);

  const bestPayment = chooseBestPayment(dbResult, stripeResult, input.amount);

  if (bestPayment) {
    return bestPayment;
  }

  // Fallback : utiliser le premier paiement disponible
  return booking.payments[0];
}

/**
 * Recherche le paiement approprié pour le remboursement
 */
export async function findPaymentForRefund(
  booking: BookingWithPayments,
  input: CreateRefundInput
): Promise<PaymentData> {
  // Pour les modifications, chercher le paiement initial
  if (input.reason === "booking_modification" && booking.originalDepositPaid) {
    const payment = await findInitialPaymentForModification(booking, input);
    if (payment) {
      return payment;
    }
  }

  // Pour les autres raisons (cancellation), utiliser le premier paiement
  return booking.payments[0];
}

/**
 * Recherche le Payment Intent ID pour un paiement
 */
export async function findPaymentIntentId(payment: PaymentData): Promise<string | null> {
  // Si le payment vient de Stripe directement
  if (payment.id.startsWith("stripe_")) {
    return payment.transactionId;
  }

  // Sinon, utiliser l'helper
  return getPaymentIntentId(payment);
}

/**
 * Gère le cas où le montant demandé dépasse le montant d'un seul paiement
 */
export async function handleLargeRefundAmount(
  booking: BookingWithPayments,
  input: CreateRefundInput,
  currentPayment: PaymentData
): Promise<{ payment?: PaymentData; error?: string }> {
  const nonModificationPayments = filterNonModificationPayments(booking.payments);
  const totalRefundableAmount = calculateTotalRefundableAmount(nonModificationPayments);

  // Si aucun paiement non-modification trouvé, chercher dans Stripe
  const searchAmount =
    booking.originalDepositPaid && booking.originalDepositPaid > 0
      ? booking.originalDepositPaid
      : booking.depositPaid || 0;

  if (nonModificationPayments.length === 0 && searchAmount > 0 && input.reason === "booking_modification") {
    try {
      const matchingPaymentIntents = await searchPaymentIntentsInStripe(
        booking.id,
        booking.reference,
        searchAmount
      );

      if (matchingPaymentIntents.length > 0) {
        const initialPaymentIntent = matchingPaymentIntents[0];
        const existingRefunds = await stripe.refunds.list({
          payment_intent: initialPaymentIntent.id,
          limit: 100,
        });

        const totalRefunded = existingRefunds.data.reduce((sum, refund) => sum + (refund.amount || 0), 0);
        const originalAmount = initialPaymentIntent.amount;
        const refundableAmount = (originalAmount - totalRefunded) / 100;

        const payment = createPaymentFromStripePaymentIntent(initialPaymentIntent, refundableAmount);
        return { payment };
      }
    } catch {
      // En cas d'erreur, continuer avec les paiements disponibles
    }
  }

  if (input.amount > totalRefundableAmount) {
    return {
      error: `Le montant du remboursement (${input.amount.toFixed(2)}€) dépasse le montant total disponible (${totalRefundableAmount.toFixed(2)}€). ${booking.originalDepositPaid ? `L'acompte original était de ${booking.originalDepositPaid.toFixed(2)}€ mais le paiement initial n'existe pas dans la base de données.` : ""} Un remboursement manuel devra être effectué.`,
    };
  }

  // Si le montant total est suffisant, utiliser le meilleur paiement
  const bestPayment = findBestPayment(nonModificationPayments);

  if (bestPayment && bestPayment.amount >= input.amount) {
    return { payment: bestPayment };
  } else if (bestPayment) {
    return {
      error: `Le montant du remboursement (${input.amount.toFixed(2)}€) dépasse le montant du meilleur paiement disponible (${bestPayment.amount.toFixed(2)}€). Le montant total remboursable est de ${totalRefundableAmount.toFixed(2)}€. Un remboursement partiel ou multiple devra être effectué manuellement.`,
    };
  }

  return { payment: currentPayment };
}

