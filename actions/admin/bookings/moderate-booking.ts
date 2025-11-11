"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendBookingUpdateEmail } from "@/lib/email";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const moderateSchema = z.object({
  bookingId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
});

export type ModerateBookingAction =
  | "approve"
  | "reject";

export interface ModerateBookingResult {
  success: boolean;
  error?: string;
}

export async function moderateBookingStatusAction(
  rawInput: z.input<typeof moderateSchema>,
): Promise<ModerateBookingResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Authentification requise.",
      };
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Permissions insuffisantes.",
      };
    }

    const parsed = moderateSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: "Données invalides.",
      };
    }

    const { bookingId, action } = parsed.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        reference: true,
        status: true,
        startDate: true,
        endDate: true,
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

    if (!booking) {
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    if (booking.status !== BookingStatus.PENDING) {
      return {
        success: false,
        error: "Cette réservation a déjà été traitée.",
      };
    }

    const nextStatus =
      action === "approve" ? BookingStatus.CONFIRMED : BookingStatus.CANCELLED;

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: nextStatus,
      },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        reference: true,
        totalPrice: true,
        depositPaid: true,
        remainingAmount: true,
      },
    });

    if (booking.user?.email && booking.user.name) {
      const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";
      const bookingPeriod = `${format(
        updated.startDate,
        "dd MMMM yyyy 'à' HH:mm",
        { locale: fr },
      )} → ${format(updated.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

      const emailResult = await sendBookingUpdateEmail({
        to: booking.user.email,
        name: booking.user.name,
        greeting,
        booking: {
          reference: booking.reference,
          totalPrice: booking.totalPrice ?? 0,
          depositPaid: booking.depositPaid ?? 0,
          remainingAmount:
            booking.remainingAmount ??
            Math.max((booking.totalPrice ?? 0) - (booking.depositPaid ?? 0), 0),
          startDate: updated.startDate,
          endDate: updated.endDate,
          status: updated.status,
          period: bookingPeriod,
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
      });

      if (!emailResult.success && !emailResult.skipped) {
        console.warn(
          `[Admin Bookings] Échec de l'envoi de l'email de modération pour la réservation ${booking.reference}:`,
          emailResult.error ?? "Erreur inconnue",
        );
      }
    }

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/statistics");
    revalidatePath("/admin/invoices");
    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("[Admin Bookings] moderate error", error);
    return {
      success: false,
      error: "Impossible de traiter la réservation, veuillez réessayer.",
    };
  }
}

