import { NextResponse } from "next/server";
import { BookingStatus } from "@/lib/types/booking-status";
import { PaymentStatus } from "@/lib/types/payment-status";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import { extractTime, getPaymentTypeFromMetadata } from "../../utils/helpers";
import type { CheckoutSessionData } from "../../types";
import { fetchBooking } from "./services/fetch-booking";
import { updateBooking } from "./services/update-booking";
import { createPaymentRecord } from "./services/create-payment-record";
import { createInvoiceForBooking } from "./services/create-invoice";
import { updateInvoiceStatus } from "./services/update-invoice-status";
import { invalidateCache } from "./services/invalidate-cache";
import { sendBookingEmail } from "./services/send-booking-email";
import { calculateAmounts } from "./utils/calculate-amounts";
import { buildBookingUpdateData } from "./utils/build-booking-update-data";
import { buildPaymentMetadata } from "./utils/build-payment-metadata";

/**
 * Handler pour les événements checkout.session.completed
 */
export async function handleCheckoutSessionCompleted(
  data: CheckoutSessionData
): Promise<NextResponse> {
  const { bookingId, userId, session } = data;

  try {
    // Récupérer la réservation
    const booking = await fetchBooking(bookingId, userId);
    if (!booking) {
      return NextResponse.json({ received: true });
    }

    // Calculer le prix
    const startTime = extractTime(booking.startDate);
    const endTime = extractTime(booking.endDate);

    const priceResult = await calculateBookingPriceAction({
      vehicleId: booking.vehicle.id,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      startTime,
      endTime,
      serviceIds: booking.serviceIds,
    });

    if (!priceResult.success || !priceResult.data) {
      return NextResponse.json({ received: true });
    }

    const { deposit: downPayment, securityDeposit } = priceResult.data;

    // Déterminer le type de paiement
    const hasModificationDepositDifference = (booking.modificationDepositDifference ?? 0) > 0;
    const paymentType = getPaymentTypeFromMetadata(
      session.metadata,
      hasModificationDepositDifference
    );

    // Calculer les montants
    const currentDepositPaid = booking.depositPaid || 0;
    const currentSecurityDepositPaid = booking.securityDepositPaid || 0;
    const amountPaid = session.amount_total ? session.amount_total / 100 : 0;

    const { roundedDownPayment, roundedSecurityDeposit, roundedRemainingAmount, roundedAmountPaid } =
      calculateAmounts({
        downPayment,
        securityDeposit,
        remainingAmount: priceResult.data.remainingAmount,
        amountPaid,
      });

    // Construire les données de mise à jour
    const { updateData, emailAmounts } = buildBookingUpdateData({
      paymentType,
      currentDepositPaid,
      currentSecurityDepositPaid,
      roundedDownPayment,
      roundedSecurityDeposit,
      roundedAmountPaid,
      totalPrice: booking.totalPrice,
      roundedRemainingAmount,
    });

    // Mettre à jour la réservation
    const updatedBooking = await updateBooking(bookingId, updateData, paymentType);

    // Créer la facture si confirmée
    if (updatedBooking.status === BookingStatus.CONFIRMED) {
      await createInvoiceForBooking(bookingId);
    }

    // Créer l'enregistrement de paiement
    const paymentStatus = paymentType.isAuthorization
      ? PaymentStatus.PENDING
      : PaymentStatus.COMPLETED;
    const paymentAmount = roundedAmountPaid;

    const paymentMetadata = buildPaymentMetadata({
      paymentType,
      roundedAmountPaid,
      roundedDownPayment,
      roundedSecurityDeposit,
      sessionId: session.id,
      paymentIntentId: session.payment_intent as string | undefined,
    });

    await createPaymentRecord({
      bookingId,
      userId,
      paymentAmount,
      paymentStatus,
      sessionId: session.id,
      paymentMetadata,
    });

    // Mettre à jour le statut des factures
    if (paymentStatus === PaymentStatus.COMPLETED && !paymentType.isAuthorization) {
      await updateInvoiceStatus(bookingId, session.id, paymentAmount);
    }

    // Envoyer l'email si confirmé
    if (updatedBooking.status === BookingStatus.CONFIRMED) {
      await sendBookingEmail({
        updatedBooking,
        paymentType,
        session,
        amounts: emailAmounts,
      });
    }

    // Invalider le cache
    await invalidateCache(bookingId, updatedBooking.vehicleId);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing checkout session:", error);
    return NextResponse.json({ received: true });
  }
}


