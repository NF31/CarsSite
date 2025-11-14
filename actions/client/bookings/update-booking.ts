"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  BookingStatus,
  MaintenanceStatus,
  MaintenanceType,
} from "@prisma/client";
import { headers } from "next/headers";
import { checkRateLimit, recordRateLimitAttempt } from "@/lib/rate-limit-redis";
import { sendBookingUpdateEmail } from "@/lib/email";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import { createRefundAction } from "@/actions/public/payments/create-refund";
import { createCheckoutSessionAction } from "@/actions/public/payments/create-checkout-session";

function parseDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export interface UpdateBookingResult {
  success: boolean;
  error?: string;
  requiresPayment?: boolean;
  paymentUrl?: string;
  refundAmount?: number;
}

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

    const rateLimitConfig = {
      maxAttempts: 5,
      windowMs: 10 * 60 * 1000,
    };

    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";

    const rateLimitKey = `booking-edit:${session.user.id}`;
    const rateLimit = await checkRateLimit(rateLimitKey, "email", rateLimitConfig);

    if (!rateLimit.allowed) {
      const minutes = Math.max(
        1,
        Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000),
      );
      return {
        success: false,
        error: `Trop de tentatives de modification. Réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.`,
      };
    }

    await recordRateLimitAttempt(rateLimitKey, "email");
    if (ipAddress !== "unknown") {
      await recordRateLimitAttempt(`booking-edit-ip:${ipAddress}`, "ip");
    }

    const bookingId = formData.get("bookingId");
    const startDateValue = parseDate(formData.get("startDate"));
    const endDateValue = parseDate(formData.get("endDate"));

    if (typeof bookingId !== "string" || bookingId.length === 0) {
      return {
        success: false,
        error: "Réservation invalide.",
      };
    }

    if (!startDateValue || !endDateValue) {
      return {
        success: false,
        error: "Veuillez sélectionner des dates de début et de fin valides.",
      };
    }

    const now = new Date();

    if (startDateValue <= now) {
      return {
        success: false,
        error: "La nouvelle date de départ doit être dans le futur.",
      };
    }

    if (endDateValue <= startDateValue) {
      return {
        success: false,
        error: "La date de fin doit être postérieure à la date de début.",
      };
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        reference: true,
        vehicleId: true,
        startDate: true,
        endDate: true,
        status: true,
        totalPrice: true,
        depositPaid: true,
        securityDepositPaid: true,
        remainingAmount: true,
        serviceIds: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            brand: true,
            model: true,
            licensePlate: true,
            pricePerDay: true,
          },
        },
        pickupLocation: {
          select: {
            name: true,
          },
        },
        returnLocation: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingBooking || existingBooking.userId !== session.user.id) {
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    if (existingBooking.startDate <= now) {
      return {
        success: false,
        error: "Cette réservation a déjà commencé et ne peut plus être modifiée.",
      };
    }

    if (
      existingBooking.status === BookingStatus.CANCELLED ||
      existingBooking.status === BookingStatus.COMPLETED
    ) {
      return {
        success: false,
        error: "Cette réservation ne peut plus être modifiée.",
      };
    }

    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        id: { not: existingBooking.id },
        vehicleId: existingBooking.vehicleId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
        },
        startDate: { lt: endDateValue },
        endDate: { gt: startDateValue },
      },
      select: { id: true },
    });

    if (overlappingBooking) {
      return {
        success: false,
        error:
          "Le véhicule sélectionné est déjà réservé sur cette période. Choisissez d'autres dates.",
      };
    }

    const overlappingMaintenance = await prisma.maintenance.findFirst({
      where: {
        vehicleId: existingBooking.vehicleId,
        status: {
          in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
        },
        type: {
          not: MaintenanceType.BLOCKED,
        },
        startDate: { lt: endDateValue },
        endDate: { gt: startDateValue },
      },
      select: { id: true },
    });

    if (overlappingMaintenance) {
      return {
        success: false,
        error:
          "Une maintenance est prévue sur cette période. Veuillez sélectionner d'autres dates.",
      };
    }

    // Extraire les heures des dates modifiées
    const startHours = startDateValue.getHours().toString().padStart(2, "0");
    const startMinutes = startDateValue.getMinutes().toString().padStart(2, "0");
    const endHours = endDateValue.getHours().toString().padStart(2, "0");
    const endMinutes = endDateValue.getMinutes().toString().padStart(2, "0");
    
    const startTime = `${startHours}:${startMinutes}`;
    const endTime = `${endHours}:${endMinutes}`;

    // Recalculer le prix en utilisant la fonction de calcul standardisée
    // qui prend en compte les heures, les services, etc.
    const priceResult = await calculateBookingPriceAction({
      vehicleId: existingBooking.vehicleId,
      startDate: startDateValue.toISOString(),
      endDate: endDateValue.toISOString(),
      startTime: startTime,
      endTime: endTime,
      serviceIds: existingBooking.serviceIds || [],
    });

    if (!priceResult.success || !priceResult.data) {
      return {
        success: false,
        error: priceResult.error || "Impossible de recalculer le prix de la réservation.",
      };
    }

    // Nouveau prix total calculé (véhicule + services)
    const newTotalPrice = Math.round(priceResult.data.totalPrice * 100) / 100;
    
    // Calculer le nouvel acompte (30% du nouveau prix total)
    const newDownPayment = Math.round(newTotalPrice * 0.3 * 100) / 100;
    
    // Récupérer les montants déjà payés
    const oldDepositPaid = existingBooking.depositPaid ?? 0;
    const securityDepositPaid = existingBooking.securityDepositPaid ?? 0;
    
    // Calculer la différence d'acompte
    const depositDifference = newDownPayment - oldDepositPaid;
    const roundedDepositDifference = Math.round(depositDifference * 100) / 100;
    
    // Calculer le nouveau solde restant
    const newRemainingAmount = Math.round((newTotalPrice - newDownPayment) * 100) / 100;

    // IMPORTANT: Ne PAS faire les remboursements/paiements maintenant
    // On stocke les informations pour que l'admin puisse valider/refuser
    // Les actions Stripe seront déclenchées uniquement après validation admin

    // Mettre à jour la réservation avec les nouvelles dates
    // IMPORTANT: Préserver securityDepositPaid si elle a déjà été payée
    // IMPORTANT: Stocker les dates originales pour pouvoir les restaurer si refus
    const updateData: any = {
      startDate: startDateValue,
      endDate: endDateValue,
      totalPrice: newTotalPrice,
      depositPaid: newDownPayment,
      remainingAmount: newRemainingAmount,
      status: BookingStatus.PENDING, // Retour en attente pour validation admin
      // Marquer comme demande de modification
      modificationRequested: true,
      modificationRequestedAt: new Date(),
      // Stocker les dates et prix originaux pour restauration si refus
      originalStartDate: existingBooking.startDate,
      originalEndDate: existingBooking.endDate,
      originalTotalPrice: existingBooking.totalPrice,
      originalDepositPaid: oldDepositPaid,
      modificationDepositDifference: roundedDepositDifference,
    };
    
    // Préserver la caution déjà payée (ne pas la réinitialiser si elle est > 0)
    if (securityDepositPaid > 0) {
      updateData.securityDepositPaid = securityDepositPaid;
    }
    
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

    if (existingBooking.user?.email && existingBooking.user.name) {
      const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";
      const bookingPeriod = `${format(
        updatedBooking.startDate,
        "dd MMMM yyyy 'à' HH:mm",
        { locale: fr },
      )} → ${format(updatedBooking.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

      const emailResult = await sendBookingUpdateEmail({
        to: existingBooking.user.email,
        name: existingBooking.user.name,
        greeting,
        booking: {
          reference: existingBooking.reference ?? "Réservation",
          totalPrice: updatedBooking.totalPrice ?? 0,
          depositPaid: updatedBooking.depositPaid ?? 0,
          remainingAmount: updatedBooking.remainingAmount ?? 0,
          startDate: updatedBooking.startDate,
          endDate: updatedBooking.endDate,
          status: updatedBooking.status,
          period: bookingPeriod,
        },
        vehicle: {
          label: existingBooking.vehicle
            ? `${existingBooking.vehicle.brand} ${existingBooking.vehicle.model}`
            : "Véhicule",
          licensePlate: existingBooking.vehicle?.licensePlate ?? "ND",
        },
        locations: {
          pickup: existingBooking.pickupLocation?.name ?? "Agence de départ",
          return: existingBooking.returnLocation?.name ?? "Agence de retour",
        },
      });

      if (emailResult.skipped) {
        console.warn(
          "[Client Booking] ⚠️  Email de mise à jour ignoré (credentials non configurés). Vérifiez GMAIL_USER et GMAIL_PASSWORD dans .env",
        );
      } else if (!emailResult.success) {
        console.warn(
          "[Client Booking] ❌ Échec de l'envoi de l'email de mise à jour",
          emailResult.error ?? "unknown reason",
        );
      } else {
        console.log(
          "[Client Booking] ✅ Email de mise à jour envoyé",
          emailResult.queued ? "(mis en queue)" : "(envoyé directement)",
        );
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/statistics");
    revalidatePath("/admin/invoices");

    // Invalider le cache des réservations
    const { invalidateBookingCache } = await import("@/lib/cache-invalidation");
    await invalidateBookingCache(bookingId).catch((error) => {
      console.error("Error invalidating booking cache:", error);
    });

    return {
      success: true,
      error: undefined,
      // Ne plus retourner paymentUrl car le paiement sera géré après validation admin
      requiresPayment: false, // Le paiement sera géré après validation admin
      paymentUrl: undefined,
      refundAmount: undefined, // Le remboursement sera géré après validation admin
    };
  } catch (error) {
    console.error("[Client Booking] update error", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour de votre réservation.",
    };
  }
}

