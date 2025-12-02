import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookingStatus } from "@prisma/client";
import { sendBookingUpdateEmail } from "@/lib/email";
import type { PriceDifferences } from "./utils";

interface SendUpdateEmailParams {
  user: {
    email: string;
    name: string;
  };
  booking: {
    reference: string | null;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    status: BookingStatus;
  };
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
  priceDifferences: PriceDifferences;
  oldTotalPrice: number;
  oldDepositPaid: number;
  oldRemainingAmount: number;
}

/**
 * Envoie l'email de mise à jour de réservation
 */
export async function sendBookingUpdateEmailNotification({
  user,
  booking,
  vehicle,
  locations,
  priceDifferences,
  oldTotalPrice,
  oldDepositPaid,
  oldRemainingAmount,
}: SendUpdateEmailParams): Promise<void> {
  const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";
  const bookingPeriod = `${format(booking.startDate, "dd MMMM yyyy 'à' HH:mm", {
    locale: fr,
  })} → ${format(booking.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

  const modificationInfo = {
    originalTotalPrice: oldTotalPrice,
    originalDepositPaid: oldDepositPaid,
    originalRemainingAmount: oldRemainingAmount,
    depositDifference: priceDifferences.depositDifference,
    refundAmount: priceDifferences.refundAmount,
    additionalPaymentAmount: priceDifferences.additionalPaymentAmount,
    securityDepositPaid:
      priceDifferences.refundAmount || priceDifferences.additionalPaymentAmount
        ? undefined
        : undefined,
  };

  const emailResult = await sendBookingUpdateEmail({
    to: user.email,
    name: user.name,
    greeting,
    booking: {
      reference: booking.reference ?? "Réservation",
      totalPrice: booking.totalPrice,
      depositPaid: booking.depositPaid,
      remainingAmount: booking.remainingAmount,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      period: bookingPeriod,
    },
    vehicle: {
      label: `${vehicle.brand} ${vehicle.model}`,
      licensePlate: vehicle.licensePlate,
    },
    locations: {
      pickup: locations.pickup,
      return: locations.return,
    },
    modificationInfo,
  });

  if (emailResult.skipped) {
    console.warn(
      "[Client Booking] ⚠️  Email de mise à jour ignoré (credentials non configurés). Vérifiez GMAIL_USER et GMAIL_PASSWORD dans .env"
    );
  } else if (!emailResult.success) {
    console.warn(
      "[Client Booking] ❌ Échec de l'envoi de l'email de mise à jour",
      emailResult.error ?? "unknown reason"
    );
  } else {
    console.log(
      "[Client Booking] ✅ Email de mise à jour envoyé",
      emailResult.queued ? "(mis en queue)" : "(envoyé directement)"
    );
  }
}

