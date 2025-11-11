"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BookingStatus, MaintenanceStatus, MaintenanceType } from "@prisma/client";
import { z } from "zod";
import { headers } from "next/headers";
import { checkRateLimit, recordRateLimitAttempt } from "@/lib/rate-limit";

const clientAvailabilitySchema = z.object({
  bookingId: z.string().min(1),
  startDate: z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date invalide")
    .transform((value) => new Date(value)),
  endDate: z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date invalide")
    .transform((value) => new Date(value)),
});

export type ClientBookingAvailabilityResponse =
  | {
      success: true;
      status: "available";
    }
  | {
      success: true;
      status: "booking_conflict";
      conflict: {
        reference: string;
        startDate: string;
        endDate: string;
      };
    }
  | {
      success: true;
      status: "maintenance_conflict";
      maintenance: {
        id: string;
        type: MaintenanceType;
        startDate: string;
        endDate: string;
      };
    }
  | {
      success: false;
      error: string;
    };

export async function checkClientBookingAvailabilityAction(
  rawInput: z.input<typeof clientAvailabilitySchema>,
): Promise<ClientBookingAvailabilityResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Authentification requise." };
    }

    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";

    const rateLimitConfig = {
      maxAttempts: 12,
      windowMs: 5 * 60 * 1000,
    };

    const rateLimitKey = `booking-availability:${session.user.id}`;
    const rateLimit = await checkRateLimit(rateLimitKey, "email", rateLimitConfig);

    if (!rateLimit.allowed) {
      const minutes = Math.max(
        1,
        Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000),
      );
      return {
        success: false,
        error: `Trop de vérifications rapprochées. Merci de patienter ${minutes} minute${minutes > 1 ? "s" : ""} avant de réessayer.`,
      };
    }

    await recordRateLimitAttempt(rateLimitKey, "email");
    if (ipAddress !== "unknown") {
      await recordRateLimitAttempt(`booking-availability-ip:${ipAddress}`, "ip");
    }

    const parsed = clientAvailabilitySchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: "Dates invalides." };
    }

    const { bookingId, startDate, endDate } = parsed.data;

    if (endDate <= startDate) {
      return {
        success: false,
        error: "La date de fin doit être postérieure à la date de début.",
      };
    }

    const now = new Date();
    if (startDate <= now) {
      return {
        success: false,
        error: "La date de début doit être dans le futur.",
      };
    }

    if (endDate <= now) {
      return {
        success: false,
        error: "La date de fin doit être dans le futur.",
      };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        userId: true,
        vehicleId: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    if (booking.userId !== session.user.id) {
      return {
        success: false,
        error: "Vous ne pouvez modifier que vos propres réservations.",
      };
    }

    const bookingConflict = await prisma.booking.findFirst({
      where: {
        vehicleId: booking.vehicleId,
        id: {
          not: bookingId,
        },
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
        },
        startDate: {
          lt: endDate,
        },
        endDate: {
          gt: startDate,
        },
      },
      select: {
        reference: true,
        startDate: true,
        endDate: true,
      },
    });

    if (bookingConflict) {
      return {
        success: true,
        status: "booking_conflict",
        conflict: {
          reference: bookingConflict.reference,
          startDate: bookingConflict.startDate.toISOString(),
          endDate: bookingConflict.endDate.toISOString(),
        },
      };
    }

    const maintenanceConflict = await prisma.maintenance.findFirst({
      where: {
        vehicleId: booking.vehicleId,
        status: {
          in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
        },
        type: {
          not: MaintenanceType.BLOCKED,
        },
        startDate: {
          lt: endDate,
        },
        endDate: {
          gt: startDate,
        },
      },
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
      },
    });

    if (maintenanceConflict) {
      return {
        success: true,
        status: "maintenance_conflict",
        maintenance: {
          id: maintenanceConflict.id,
          type: maintenanceConflict.type,
          startDate: maintenanceConflict.startDate.toISOString(),
          endDate: maintenanceConflict.endDate.toISOString(),
        },
      };
    }

    return { success: true, status: "available" };
  } catch (error) {
    console.error("[Client Booking] availability error", error);
    return {
      success: false,
      error: "Impossible de vérifier la disponibilité du véhicule.",
    };
  }
}

