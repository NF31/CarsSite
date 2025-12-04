"use server";

import { auth } from "@/auth";
import prisma from '@/lib/prisma'
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import type { UpdateBookingResult } from "./update-booking/types";
import { RATE_LIMIT_CONFIG } from "./update-booking/constants";
import { checkBookingUpdateRateLimit } from "./update-booking/rate-limit";
import { validateBookingForUpdate } from "./update-booking/validate-booking";
import {
  parseDate,
  validateBookingDates,
  formatTime,
  calculatePriceDifferences,
  checkBookingOverlap,
  checkMaintenanceOverlap,
  BOOKING_SELECT,
} from "./update-booking/utils";
import { buildBookingUpdateData } from "./update-booking/build-update-data";
import { sendBookingUpdateEmailNotification } from "./update-booking/send-update-email";
import { invalidateBookingCaches } from "./update-booking/invalidate-cache";

export async function updateClientBookingAction(
  _prevState: UpdateBookingResult,
  formData: FormData,
): Promise<UpdateBookingResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Veuillez vous connecter pour modifier votre réservation.",
      };
    }

    // Vérifier le rate limiting
    const rateLimitResult = await checkBookingUpdateRateLimit(
      session.user.id,
      RATE_LIMIT_CONFIG
    );

    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: rateLimitResult.error,
      };
    }

    // Parser les données du formulaire
    const bookingId = formData.get("bookingId");
    const startDateValue = parseDate(formData.get("startDate"));
    const endDateValue = parseDate(formData.get("endDate"));

    if (typeof bookingId !== "string" || bookingId.length === 0) {
      return {
        success: false,
        error: "Réservation invalide.",
      };
    }

    // Valider les dates
    const now = new Date();
    const dateValidation = validateBookingDates(startDateValue, endDateValue, now);
    if (!dateValidation.valid) {
      return {
        success: false,
        error: dateValidation.error,
      };
    }

    // Récupérer la réservation existante
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: BOOKING_SELECT,
    });

    if (!existingBooking) {
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    // Valider que la réservation peut être modifiée
    const bookingValidation = validateBookingForUpdate(
      {
        userId: existingBooking.userId,
        startDate: existingBooking.startDate,
        status: existingBooking.status,
        cancellationRequested: existingBooking.cancellationRequested,
        modificationRequested: existingBooking.modificationRequested,
      },
      session.user.id,
      now
    );

    if (!bookingValidation.valid) {
      return {
        success: false,
        error: bookingValidation.error,
      };
    }

    // Vérifier les chevauchements
    const hasBookingOverlap = await checkBookingOverlap(
      existingBooking.vehicleId,
      startDateValue!,
      endDateValue!,
      existingBooking.id
    );

    if (hasBookingOverlap) {
      return {
        success: false,
        error:
          "Le véhicule sélectionné est déjà réservé sur cette période. Choisissez d'autres dates.",
      };
    }

    const hasMaintenanceOverlap = await checkMaintenanceOverlap(
      existingBooking.vehicleId,
      startDateValue!,
      endDateValue!
    );

    if (hasMaintenanceOverlap) {
      return {
        success: false,
        error:
          "Une maintenance est prévue sur cette période. Veuillez sélectionner d'autres dates.",
      };
    }

    // Extraire les heures des dates modifiées
    const startTime = formatTime(startDateValue!);
    const endTime = formatTime(endDateValue!);

    // Recalculer le prix
    const priceResult = await calculateBookingPriceAction({
      vehicleId: existingBooking.vehicleId,
      startDate: startDateValue!.toISOString(),
      endDate: endDateValue!.toISOString(),
      startTime,
      endTime,
      serviceIds: existingBooking.serviceIds || [],
    });

    if (!priceResult.success || !priceResult.data) {
      return {
        success: false,
        error: priceResult.error || "Impossible de recalculer le prix de la réservation.",
      };
    }

    // Calculer les différences de prix
    const newTotalPrice = Math.round(priceResult.data.totalPrice * 100) / 100;
    const oldDepositPaid = existingBooking.depositPaid ?? 0;
    const oldTotalPrice = existingBooking.totalPrice ?? 0;
    const oldRemainingAmount = existingBooking.remainingAmount ?? 0;

    const priceDifferences = calculatePriceDifferences(
      newTotalPrice,
      oldDepositPaid
    );

    // Construire les données de mise à jour
    const updateData = buildBookingUpdateData({
      startDate: startDateValue!,
      endDate: endDateValue!,
      priceDifferences,
      existingBooking: {
        status: existingBooking.status,
        cancellationRequested: existingBooking.cancellationRequested,
        startDate: existingBooking.startDate,
        endDate: existingBooking.endDate,
        totalPrice: existingBooking.totalPrice,
        depositPaid: existingBooking.depositPaid,
        securityDepositPaid: existingBooking.securityDepositPaid,
      },
    });

    // Mettre à jour la réservation
    const updatedBooking = await prisma.booking.update({
      where: { id: existingBooking.id },
      data: updateData,
      select: {
        startDate: true,
        endDate: true,
        status: true,
        totalPrice: true,
        depositPaid: true,
        remainingAmount: true,
      },
    });

    // Envoyer l'email de notification
    if (existingBooking.user?.email && existingBooking.user.name) {
      await sendBookingUpdateEmailNotification({
        user: {
          email: existingBooking.user.email,
          name: existingBooking.user.name,
        },
        booking: {
          reference: existingBooking.reference,
          startDate: updatedBooking.startDate,
          endDate: updatedBooking.endDate,
          totalPrice: updatedBooking.totalPrice ?? 0,
          depositPaid: updatedBooking.depositPaid ?? 0,
          remainingAmount: updatedBooking.remainingAmount ?? 0,
          status: updatedBooking.status,
        },
        vehicle: {
          brand: existingBooking.vehicle?.brand ?? "",
          model: existingBooking.vehicle?.model ?? "",
          licensePlate: existingBooking.vehicle?.licensePlate ?? "ND",
        },
        locations: {
          pickup: existingBooking.pickupLocation?.name ?? "Agence de départ",
          return: existingBooking.returnLocation?.name ?? "Agence de retour",
        },
        priceDifferences,
        oldTotalPrice,
        oldDepositPaid,
        oldRemainingAmount,
      });
    }

    // Invalider les caches
    await invalidateBookingCaches(bookingId);

    return {
      success: true,
      error: undefined,
      requiresPayment: false,
      paymentUrl: undefined,
      refundAmount: undefined,
    };
  } catch (error) {
    console.error("[Client Booking] update error", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour de votre réservation.",
    };
  }
}

// Ré-exporter les types pour compatibilité
export type { UpdateBookingResult } from "./update-booking/types";
