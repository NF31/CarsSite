
import { PaymentSuccessCard } from "./components/payment-success-card";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import type { PaymentSuccessPageProps, BookingData, PaymentAmounts, PaymentType } from "./types";
import { getPaymentTypeFromSession, isWebhookProcessed, isModificationPayment, extractModificationMetadata } from "./utils/payment-helpers";
import { loadBookingFromSession, loadBookingFromId, calculatePaymentAmounts, calculateAmountsFromBookingId, needsBookingUpdate } from "./handlers/booking-loader";
import { prepareBookingUpdateData, updateBooking, reloadBooking } from "./handlers/booking-updater";
import { createFallbackPayment } from "./handlers/fallback-payment";
import { executeFallbackWorkflow } from "./handlers/fallback-workflow";
export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { session_id, booking_id } = await searchParams;

  let booking: BookingData | null = null;
  let stripeSession: Stripe.Checkout.Session | null = null;
  let amounts: PaymentAmounts = {
    actualDepositPaid: 0,
    actualSecurityDepositPaid: 0,
    expectedSecurityDeposit: 0,
  };
  let paymentType: PaymentType = {
    type: "full",
    isModificationPayment: false,
  };

  if (session_id) {
    // Récupérer la session Stripe
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(session_id);

      // Vérifier si la session a expiré ou n'est pas complète
      if (stripeSession.status === "expired") {
        redirect(
          `/bookings/payment/expired?session_id=${session_id}&booking_id=${stripeSession.metadata?.bookingId || booking_id || ""}`
        );
      }

      if (stripeSession.payment_status !== "paid" && stripeSession.status !== "complete") {
        redirect(
          `/bookings/payment/expired?session_id=${session_id}&booking_id=${stripeSession.metadata?.bookingId || booking_id || ""}`
        );
      }

      const bookingIdFromMetadata = stripeSession.metadata?.bookingId;
      paymentType = getPaymentTypeFromSession(stripeSession);

      if (bookingIdFromMetadata) {
        // Récupérer la réservation
        booking = await loadBookingFromSession(bookingIdFromMetadata);

        if (booking) {
          // Calculer les montants
          amounts = await calculatePaymentAmounts(booking, stripeSession, session_id, paymentType);

          // Détecter si c'est un paiement de modification
          const isModification = isModificationPayment(booking.payments, paymentType.isModificationPayment);

          // Vérifier si le webhook a déjà traité ce paiement
          const webhookProcessed = isWebhookProcessed(
            booking.payments,
            session_id,
            stripeSession.payment_intent as string | undefined
          );

          // Déterminer si une mise à jour est nécessaire
          if (needsBookingUpdate(booking, amounts)) {
            // Calculer les montants attendus pour la mise à jour
            const startTime = new Date(booking.startDate).toTimeString().slice(0, 5);
            const endTime = new Date(booking.endDate).toTimeString().slice(0, 5);
            const { calculateBookingPriceAction } = await import("@/actions/public/bookings/calculate-price");
            const priceResult = await calculateBookingPriceAction({
              vehicleId: booking.vehicle.id,
              startDate: booking.startDate.toISOString(),
              endDate: booking.endDate.toISOString(),
              startTime,
              endTime,
              serviceIds: booking.serviceIds || [],
            });

            if (priceResult.success && priceResult.data) {
              const updateData = prepareBookingUpdateData(
                paymentType,
                amounts,
                priceResult.data.remainingAmount,
                isModification
              );

              await updateBooking(booking.id, updateData);

              // Créer le paiement de secours si le webhook ne l'a pas fait
              if (!webhookProcessed && session_id && stripeSession) {
                try {
                  await createFallbackPayment(
                    booking.id,
                    session.user.id,
                    session_id,
                    stripeSession,
                    paymentType,
                    amounts
                  );
                } catch {
                  // Ignorer les erreurs pour ne pas bloquer la page
                }
              }

              // Exécuter le workflow de secours si nécessaire
              const finalPaymentStatus =
                paymentType.type === "authorization" ? PaymentStatus.PENDING : PaymentStatus.COMPLETED;

              if (
                !webhookProcessed &&
                booking.status === BookingStatus.CONFIRMED &&
                !isModification
              ) {
                try {
                  await executeFallbackWorkflow(booking, session_id, finalPaymentStatus);
                } catch {
                  // Ignorer les erreurs pour ne pas bloquer la page
                }
              }

              // Recharger la réservation mise à jour
              booking = await reloadBooking(booking.id);
            }
          } else {
            // Utiliser les valeurs de la réservation déjà mises à jour par le webhook
            amounts.actualDepositPaid = booking.depositPaid || 0;
            amounts.actualSecurityDepositPaid = booking.securityDepositPaid || 0;
          }
        }
      }
    } catch {
      // Ignorer les erreurs pour ne pas bloquer la page
    }
  } else if (booking_id) {
    // Récupérer la réservation depuis booking_id
    booking = await loadBookingFromId(booking_id);

    if (booking) {
      // Calculer le montant de la caution attendue depuis le véhicule
      amounts.expectedSecurityDeposit = booking.vehicle.deposit || 0;

      // Calculer les montants depuis la réservation
      amounts = calculateAmountsFromBookingId(booking, paymentType);
    }
  }

  if (!booking) {
    redirect("/dashboard");
  }

  // Extraire les métadonnées de modification
  const modificationMetadata = extractModificationMetadata(stripeSession, paymentType.isModificationPayment);

  return (
    <PaymentSuccessCard
      booking={booking}
      amounts={amounts}
      paymentType={paymentType}
      modificationMetadata={modificationMetadata}
    />
  );
}
