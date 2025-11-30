"use server";

import type { CreateRefundInput, CreateRefundResult } from "./create-refund/types";
import { validateRefundAmount, getBookingWithPayments } from "./create-refund/utils/validation";
import { findPaymentForRefund, findPaymentIntentId, handleLargeRefundAmount } from "./create-refund/handlers/payment-finder";
import {
  calculateRefundableAmount,
  validateRefundableAmount,
  createRefund,
} from "./create-refund/handlers/refund-creator";

/**
 * Crée un remboursement Stripe pour une réservation
 */
export async function createRefundAction(
  input: CreateRefundInput
): Promise<CreateRefundResult> {
  try {
    // Validation du montant
    const amountValidation = validateRefundAmount(input.amount);
    if (!amountValidation.valid) {
      return {
        success: false,
        error: amountValidation.error,
      };
    }

    // Récupération de la réservation et de ses paiements
    const bookingValidation = await getBookingWithPayments(input.bookingId);
    if (!bookingValidation.valid || !bookingValidation.booking) {
      return {
        success: false,
        error: bookingValidation.error || "Réservation introuvable.",
      };
    }

    const booking = bookingValidation.booking;

    // Recherche du paiement approprié
    let payment = await findPaymentForRefund(booking, input);

    // Recherche du Payment Intent ID
    const paymentIntentId = await findPaymentIntentId(payment);
    if (!paymentIntentId) {
      return {
        success: false,
        error: "Impossible de trouver le Payment Intent pour ce paiement.",
      };
    }

    // Calcul du montant remboursable
    const refundableInfo = await calculateRefundableAmount(payment, paymentIntentId);

    // Vérification que le montant remboursable est suffisant
    const refundableValidation = validateRefundableAmount(refundableInfo, input.amount);
    if (!refundableValidation.valid) {
      return {
        success: false,
        error: refundableValidation.error,
      };
    }

    // Si le montant demandé dépasse le montant d'un seul paiement,
    // gérer le cas spécial pour les modifications
    if (input.amount > refundableInfo.finalRefundableAmount && input.reason === "booking_modification") {
      const largeRefundResult = await handleLargeRefundAmount(booking, input, payment);
      if (largeRefundResult.error) {
        return {
          success: false,
          error: largeRefundResult.error,
        };
      }
      if (largeRefundResult.payment) {
        payment = largeRefundResult.payment;
        const newPaymentIntentId = await findPaymentIntentId(payment);
        if (newPaymentIntentId) {
          const newRefundableInfo = await calculateRefundableAmount(payment, newPaymentIntentId);
          const newValidation = validateRefundableAmount(newRefundableInfo, input.amount);
          if (!newValidation.valid) {
            return {
              success: false,
              error: newValidation.error,
            };
          }
          return createRefund(booking, payment, newPaymentIntentId, input, newRefundableInfo);
        }
      }
    }

    // Créer le remboursement
    return createRefund(booking, payment, paymentIntentId, input, refundableInfo);
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue lors de la création du remboursement.",
    };
  }
}
