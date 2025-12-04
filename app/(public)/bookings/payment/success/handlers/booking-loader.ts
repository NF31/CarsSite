import prisma from "@/lib/prisma";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import type { BookingData, PaymentAmounts, PaymentType } from "../types";
import { extractTime } from "../utils/helpers";
import {
  findSessionPayment,
  calculateAmountsFromPayment,
  calculateAmountsFromStripeSession,
  isWebhookProcessed,
  isModificationPayment as checkIsModificationPayment,
} from "../utils/payment-helpers";
import type Stripe from "stripe";

/**
 * Handler pour le chargement et le calcul des données de réservation
 */

/**
 * Récupère la réservation depuis session_id
 */
export async function loadBookingFromSession(
  bookingId: string
): Promise<BookingData | null> {
  return (await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      reference: true,
      depositPaid: true,
      securityDepositPaid: true,
      totalPrice: true,
      remainingAmount: true,
      startDate: true,
      endDate: true,
      serviceIds: true,
      status: true,
      userId: true,
      vehicleId: true,
      pickupLocationId: true,
      returnLocationId: true,
      vehicle: {
        select: {
          id: true,
          brand: true,
          model: true,
          deposit: true,
        },
      },
      payments: {
        where: {
          status: "COMPLETED",
          method: "STRIPE",
        },
        select: {
          id: true,
          amount: true,
          transactionId: true,
          metadata: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })) as BookingData | null;
}

/**
 * Récupère la réservation depuis booking_id
 */
export async function loadBookingFromId(bookingId: string): Promise<BookingData | null> {
  return (await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      reference: true,
      depositPaid: true,
      securityDepositPaid: true,
      totalPrice: true,
      remainingAmount: true,
      vehicle: {
        select: {
          brand: true,
          model: true,
          deposit: true,
        },
      },
      payments: {
        where: {
          status: "COMPLETED",
          method: "STRIPE",
        },
        select: {
          id: true,
          amount: true,
          transactionId: true,
          metadata: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  })) as BookingData | null;
}

/**
 * Calcule les montants de paiement pour une réservation
 */
export async function calculatePaymentAmounts(
  booking: BookingData,
  stripeSession: Stripe.Checkout.Session | null,
  sessionId: string | undefined,
  paymentType: PaymentType
): Promise<PaymentAmounts> {
  let amounts: PaymentAmounts = {
    actualDepositPaid: 0,
    actualSecurityDepositPaid: 0,
    expectedSecurityDeposit: 0,
  };

  // Calculer les montants attendus depuis la réservation
  const startTime = extractTime(booking.startDate);
  const endTime = extractTime(booking.endDate);

  const priceResult = await calculateBookingPriceAction({
    vehicleId: booking.vehicle.id,
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    startTime,
    endTime,
    serviceIds: booking.serviceIds || [],
  });

  if (!priceResult.success || !priceResult.data) {
    return amounts;
  }

  const { deposit: downPayment, securityDeposit } = priceResult.data;
  amounts.expectedSecurityDeposit = securityDeposit;

  // PRIORITÉ 1 : Récupérer le montant depuis la table Payment (source de vérité)
  if (booking.payments && booking.payments.length > 0) {
    const sessionPayment = findSessionPayment(
      booking.payments,
      sessionId,
      stripeSession?.payment_intent as string | undefined
    );

    if (sessionPayment) {
      amounts = calculateAmountsFromPayment(sessionPayment, downPayment, securityDeposit);
    } else if (stripeSession) {
      // PRIORITÉ 2 : Utiliser le montant depuis la session Stripe
      amounts = calculateAmountsFromStripeSession(stripeSession, paymentType, downPayment, securityDeposit);
    }
  } else if (stripeSession) {
    // PRIORITÉ 2 : Utiliser le montant depuis la session Stripe si pas de Payment enregistré
    amounts = calculateAmountsFromStripeSession(stripeSession, paymentType, downPayment, securityDeposit);
  }

  // PRIORITÉ 3 : Vérifier si booking.depositPaid est déjà mis à jour (par le webhook)
  if (booking.depositPaid && booking.depositPaid > 0 && paymentType.type === "deposit") {
    amounts.actualDepositPaid = booking.depositPaid;
  }

  return amounts;
}

/**
 * Calcule les montants pour une réservation chargée par booking_id
 */
export function calculateAmountsFromBookingId(
  booking: BookingData,
  paymentType: PaymentType
): PaymentAmounts {
  let actualDepositPaid = booking.depositPaid || 0;
  let expectedSecurityDeposit = booking.vehicle.deposit || 0;

  // PRIORITÉ : Utiliser le montant depuis la table Payment si disponible
  if (booking.payments && booking.payments.length > 0) {
    const latestPayment = booking.payments[0];
    const paymentMetadata = latestPayment.metadata as {
      paymentType?: string;
      downPayment?: number;
      securityDeposit?: number;
    } | null;

    // Si c'est un paiement d'acompte, utiliser le montant du Payment
    if (paymentMetadata?.paymentType === "deposit") {
      actualDepositPaid = latestPayment.amount;
      expectedSecurityDeposit = paymentMetadata?.securityDeposit || booking.vehicle.deposit || 0;
    }
  }

  return {
    actualDepositPaid,
    actualSecurityDepositPaid: booking.securityDepositPaid || 0,
    expectedSecurityDeposit,
  };
}

/**
 * Vérifie si une mise à jour est nécessaire
 */
export function needsBookingUpdate(
  booking: BookingData,
  amounts: PaymentAmounts
): boolean {
  return booking.depositPaid === 0 && amounts.actualDepositPaid > 0;
}

