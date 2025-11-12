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

export async function updateClientBookingAction(
  _prevState: { success: boolean; error?: string },
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
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
        remainingAmount: true,
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

    const updatedBooking = await prisma.booking.update({
      where: { id: existingBooking.id },
      data: {
        startDate: startDateValue,
        endDate: endDateValue,
        status: BookingStatus.PENDING,
      },
      select: {
        startDate: true,
        endDate: true,
        status: true,
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
          totalPrice: existingBooking.totalPrice ?? 0,
          depositPaid: existingBooking.depositPaid ?? 0,
          remainingAmount:
            existingBooking.remainingAmount ??
            Math.max(
              (existingBooking.totalPrice ?? 0) - (existingBooking.depositPaid ?? 0),
              0,
            ),
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

      if (!emailResult.success && !emailResult.skipped) {
        console.warn(
          "[Client Booking] Notification email pending request failed",
          emailResult.error ?? "unknown reason",
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
    };
  } catch (error) {
    console.error("[Client Booking] update error", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour de votre réservation.",
    };
  }
}

