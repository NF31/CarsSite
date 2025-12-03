import { sendBookingUpdateEmail } from "@/lib/email";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookingStatus } from "@prisma/client";

export interface SendUpdateEmailParams {
  userEmail: string;
  userName: string;
  bookingReference: string;
  totalPrice: number;
  depositPaid: number;
  remainingAmount: number;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  vehicleLabel: string;
  vehicleLicensePlate: string;
  pickupLocationName: string;
  returnLocationName: string;
}

/**
 * Envoie l'email de mise à jour de réservation
 */
export async function sendUpdateEmail(
  params: SendUpdateEmailParams
): Promise<void> {
  const {
    userEmail,
    userName,
    bookingReference,
    totalPrice,
    depositPaid,
    remainingAmount,
    startDate,
    endDate,
    status,
    vehicleLabel,
    vehicleLicensePlate,
    pickupLocationName,
    returnLocationName,
  } = params;

  const bookingPeriod = `${format(startDate, "dd MMMM yyyy 'à' HH:mm", {
    locale: fr,
  })} → ${format(endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

  const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";

  const emailResult = await sendBookingUpdateEmail({
    to: userEmail,
    name: userName,
    greeting,
    booking: {
      reference: bookingReference,
      totalPrice,
      depositPaid,
      remainingAmount,
      startDate,
      endDate,
      status,
      period: bookingPeriod,
    },
    vehicle: {
      label: vehicleLabel,
      licensePlate: vehicleLicensePlate,
    },
    locations: {
      pickup: pickupLocationName,
      return: returnLocationName,
    },
  });

  if (emailResult.skipped) {
    console.warn(
      `[Admin Bookings] ⚠️  Email de mise à jour ignoré pour la réservation ${bookingReference} (credentials non configurés). Vérifiez GMAIL_USER et GMAIL_PASSWORD dans .env`
    );
  } else if (!emailResult.success) {
    console.warn(
      "[Admin Bookings] ❌ Échec de l'envoi de l'email de mise à jour pour la réservation",
      bookingReference,
      emailResult.error ?? "raison inconnue"
    );
  } else {
    console.log("[Admin Bookings] ✅ Email de mise à jour envoyé", {
      reference: bookingReference,
      messageId: emailResult.messageId,
      queued: emailResult.queued,
    });
  }
}

