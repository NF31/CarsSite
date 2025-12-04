"use server";

import { auth } from "@/auth";
import prisma from '@/lib/prisma'
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { checkRateLimit, recordRateLimitAttempt } from "@/lib/rate-limit-redis";
import { sendBookingCancellationRequestEmail } from "@/lib/email";
import { createDefaultAdminSettings } from "@/actions/admin/settings/shared";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { canCancelBooking, calculateBookingStatus } from "@/lib/booking-status-sync";

interface CancelBookingState {
  success: boolean;
  error?: string;
}

const MAX_REASON_LENGTH = 500;

function computeRefundRate(daysBeforeStart: number): number {
  if (daysBeforeStart > 7) {
    return 1;
  }

  if (daysBeforeStart >= 3) {
    return 0.5;
  }

  return 0;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function cancelClientBookingAction(
  _prevState: CancelBookingState,
  formData: FormData,
): Promise<CancelBookingState> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Veuillez vous connecter pour annuler votre réservation.",
      };
    }

    const rateLimitConfig = {
      maxAttempts: 3,
      windowMs: 10 * 60 * 1000,
    };

    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";

    const rateLimitKey = `booking-cancel:${session.user.id}`;
    const rateLimit = await checkRateLimit(rateLimitKey, "email", rateLimitConfig);

    if (!rateLimit.allowed) {
      const minutes = Math.max(1, Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000));
      return {
        success: false,
        error: `Trop de tentatives d'annulation. Réessayez dans ${minutes} minute${
          minutes > 1 ? "s" : ""
        }.`,
      };
    }

    await recordRateLimitAttempt(rateLimitKey, "email");
    if (ipAddress !== "unknown") {
      await recordRateLimitAttempt(`booking-cancel-ip:${ipAddress}`, "ip");
    }

    const bookingId = formData.get("bookingId");
    const rawReason = formData.get("cancellationReason");

    if (typeof bookingId !== "string" || bookingId.trim().length === 0) {
      return {
        success: false,
        error: "Réservation invalide.",
      };
    }

    let cancellationReason: string | null = null;
    if (typeof rawReason === "string") {
      const trimmed = rawReason.trim();
      if (trimmed.length > MAX_REASON_LENGTH) {
        return {
          success: false,
          error: `La raison d'annulation doit contenir au maximum ${MAX_REASON_LENGTH} caractères.`,
        };
      }
      if (trimmed.length > 0) {
        cancellationReason = trimmed;
      }
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        reference: true,
        userId: true,
        status: true,
        startDate: true,
        endDate: true,
        totalPrice: true,
        depositPaid: true,
        remainingAmount: true,
        cancellationRequested: true,
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

    if (!booking || booking.userId !== session.user.id) {
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    // Utiliser la fonction de synchronisation pour vérifier si l'annulation est possible
    const { canCancel, reason } = canCancelBooking({
      currentStatus: booking.status,
      cancellationRequested: booking.cancellationRequested ?? false,
      modificationRequested: false, // On ne vérifie pas la modification car l'annulation a priorité
      startDate: booking.startDate,
    });

    if (!canCancel) {
      return {
        success: false,
        error: reason || "Cette réservation ne peut pas être annulée.",
      };
    }

    const now = new Date();
    const hoursBeforeStart = (booking.startDate.getTime() - now.getTime()) / 3600000;
    if (hoursBeforeStart < 0) {
      return {
        success: false,
        error: "Cette réservation est déjà en cours. Contactez le support si besoin.",
      };
    }

    const daysBeforeStart = hoursBeforeStart / 24;
    const refundRate = computeRefundRate(daysBeforeStart);
    const depositPaid = booking.depositPaid ?? 0;
    const refundAmount = roundCurrency(depositPaid * refundRate);
    const retentionAmount = roundCurrency(depositPaid - refundAmount);
    
    // Calculer le nouveau statut en tenant compte du contexte
    const newStatus = calculateBookingStatus({
      currentStatus: booking.status,
      cancellationRequested: true, // Nouvelle demande d'annulation
      modificationRequested: false, // L'annulation prend priorité
      startDate: booking.startDate,
      now,
    });
    
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: newStatus, // Utiliser le statut calculé par la synchronisation
        cancellationReason,
        cancellationRequested: true,
        cancellationRequestedAt: now,
        cancellationRequestedRefundRate: refundRate,
        cancellationPreviousStatus: booking.status,
      },
    });

    const defaultSettings = createDefaultAdminSettings();
    const cancellationPolicySetting = await prisma.setting.findUnique({
      where: { key: "config.cancellationPolicy" },
      select: { value: true },
    });

    const cancellationPolicy =
      typeof cancellationPolicySetting?.value === "string"
        ? cancellationPolicySetting.value
        : defaultSettings.configuration.cancellationPolicy;

    if (booking.user?.email && booking.user.name) {
      const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";
      const bookingPeriod = `${format(
        booking.startDate,
        "dd MMMM yyyy 'à' HH:mm",
        { locale: fr },
      )} → ${format(booking.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

      const emailResult = await sendBookingCancellationRequestEmail({
        to: booking.user.email,
        name: booking.user.name,
        greeting,
        booking: {
          reference: booking.reference,
          period: bookingPeriod,
          reason: cancellationReason,
        },
        vehicle: {
          label: booking.vehicle
            ? `${booking.vehicle.brand} ${booking.vehicle.model}`
            : "Véhicule",
          licensePlate: booking.vehicle?.licensePlate ?? "ND",
        },
        locations: {
          pickup: booking.pickupLocation?.name ?? "Agence de départ",
          return: booking.returnLocation?.name ?? "Agence de retour",
        },
        pricing: {
          total: booking.totalPrice ?? 0,
          deposit: depositPaid,
          refund: refundAmount,
          retained: retentionAmount,
        },
        policy: cancellationPolicy,
      });

      if (emailResult.skipped) {
        console.warn(
          `[Client Booking] ⚠️  Email de demande d'annulation ignoré pour la réservation ${booking.reference} (credentials non configurés). Vérifiez GMAIL_USER et GMAIL_PASSWORD dans .env`,
        );
      } else if (!emailResult.success) {
        console.warn(
          `[Client Booking] ❌ Échec de l'envoi de l'email de demande d'annulation pour la réservation ${booking.reference}:`,
          emailResult.error ?? "Erreur inconnue",
        );
      } else {
        console.log(
          `[Client Booking] ✅ Email de demande d'annulation envoyé pour la réservation ${booking.reference}`,
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
    await invalidateBookingCache(booking.id).catch((error) => {
      console.error("Error invalidating booking cache:", error);
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("[Client Booking] cancel error", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de l'annulation de votre réservation.",
    };
  }
}


