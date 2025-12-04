"use server";

import { stripe } from "@/lib/stripe";
import prisma from '@/lib/prisma'
import { auth } from "@/auth";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";

export interface CheckPaymentStatusResult {
  success: boolean;
  data?: {
    paid: boolean;
    depositPaid: number;
    remainingAmount: number;
    paymentId?: string;
  };
  error?: string;
}

/**
 * Vérifie le statut du paiement pour une réservation
 * et met à jour la base de données si le paiement a été effectué
 */
export async function checkPaymentStatusAction(
  bookingId: string
): Promise<CheckPaymentStatusResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Vous devez être connecté.",
      };
    }

    // Récupérer la réservation
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        depositPaid: true,
        totalPrice: true,
        serviceIds: true,
        startDate: true,
        endDate: true,
        vehicle: {
          select: {
            id: true,
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
            transactionId: true,
            amount: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!booking || booking.userId !== session.user.id) {
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    // Si déjà payé, retourner le statut
    if (booking.depositPaid > 0) {
      const priceResult = await calculateBookingPriceAction({
        vehicleId: booking.vehicle.id,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        startTime: "10:00",
        endTime: "10:00",
        serviceIds: booking.serviceIds,
      });

      return {
        success: true,
        data: {
          paid: true,
          depositPaid: booking.depositPaid,
          remainingAmount: priceResult.success && priceResult.data
            ? priceResult.data.remainingAmount
            : booking.totalPrice - booking.depositPaid,
          paymentId: booking.payments[0]?.id,
        },
      };
    }

    // Vérifier s'il y a un paiement Stripe récent
    if (booking.payments.length > 0) {
      const payment = booking.payments[0];
      
      // Vérifier la session Stripe
      if (payment.transactionId) {
        try {
          const stripeSession = await stripe.checkout.sessions.retrieve(payment.transactionId);
          
          if (stripeSession.payment_status === "paid") {
            // Le paiement est confirmé dans Stripe, mettre à jour la réservation
            const priceResult = await calculateBookingPriceAction({
              vehicleId: booking.vehicle.id,
              startDate: booking.startDate.toISOString(),
              endDate: booking.endDate.toISOString(),
              startTime: "10:00",
              endTime: "10:00",
              serviceIds: booking.serviceIds,
            });

            if (priceResult.success && priceResult.data) {
              const { deposit: downPayment, remainingAmount } = priceResult.data;

              await prisma.booking.update({
                where: { id: bookingId },
                data: {
                  depositPaid: downPayment,
                  remainingAmount: remainingAmount,
                },
              });

              console.log(`[Payment Check] ✅ Payment status updated for booking ${bookingId}`);

              return {
                success: true,
                data: {
                  paid: true,
                  depositPaid: downPayment,
                  remainingAmount: remainingAmount,
                  paymentId: payment.id,
                },
              };
            }
          }
        } catch (error) {
          console.error("[Payment Check] Erreur lors de la vérification Stripe:", error);
        }
      }
    }

    // Calculer les montants attendus
    const priceResult = await calculateBookingPriceAction({
      vehicleId: booking.vehicle.id,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      startTime: "10:00",
      endTime: "10:00",
      serviceIds: booking.serviceIds,
    });

    if (!priceResult.success || !priceResult.data) {
      return {
        success: false,
        error: "Impossible de calculer le prix.",
      };
    }

    return {
      success: true,
      data: {
        paid: false,
        depositPaid: booking.depositPaid,
        remainingAmount: priceResult.data.remainingAmount,
      },
    };
  } catch (error) {
    console.error("[Payment Check] Erreur:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la vérification du paiement.",
    };
  }
}

