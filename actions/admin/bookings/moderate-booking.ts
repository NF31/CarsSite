"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BookingStatus, InvoiceStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createDefaultAdminSettings } from "@/actions/admin/settings/shared";

type BookingModerationPayload = Prisma.BookingGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        email: true;
      };
    };
    vehicle: {
      select: {
        brand: true;
        model: true;
        licensePlate: true;
      };
    };
    pickupLocation: {
      select: {
        name: true;
      };
    };
    returnLocation: {
      select: {
        name: true;
      };
    };
  };
}> & {
  cancellationRequested: boolean;
  cancellationReason: string | null;
  cancellationRequestedAt: Date | null;
  cancellationRequestedRefundRate: number | null;
  cancellationPreviousStatus: BookingStatus | null;
  totalPrice: number | null;
  depositPaid: number | null;
  remainingAmount: number | null;
};

type EmailResult = { success: boolean; skipped?: boolean; error?: string };

type EmailFunction = (...args: unknown[]) => Promise<EmailResult>;

type EmailModule = {
  sendBookingCancellationEmail: EmailFunction;
  sendBookingCancellationRejectedEmail: EmailFunction;
  sendBookingUpdateEmail: EmailFunction;
};

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

function computeRefundRate(startDate: Date, referenceDate: Date): number {
  const hoursBeforeStart = (startDate.getTime() - referenceDate.getTime()) / 3600000;
  const daysBeforeStart = hoursBeforeStart / 24;

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

    const booking = (await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
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
    })) as BookingModerationPayload | null;

    if (!booking) {
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    const emailModule = (await import("@/lib/email")) as unknown as EmailModule;

    const isCancellationRequest = booking.cancellationRequested;

    if (!isCancellationRequest && booking.status !== BookingStatus.PENDING) {
      return {
        success: false,
        error: "Cette réservation a déjà été traitée.",
      };
    }

    if (isCancellationRequest) {
      const previousStatus = booking.cancellationPreviousStatus ?? BookingStatus.CONFIRMED;

      if (action === "approve") {
        const defaultSettings = createDefaultAdminSettings();
        const defaultPolicy = defaultSettings.configuration.cancellationPolicy;
        const now = new Date();
        const referenceDate = booking.cancellationRequestedAt ?? now;
        const refundRate =
          booking.cancellationRequestedRefundRate ??
          computeRefundRate(booking.startDate, referenceDate);
        const depositPaid = booking.depositPaid ?? 0;
        const refundAmount = roundCurrency(depositPaid * refundRate);
        const retentionAmount = roundCurrency(depositPaid - refundAmount);

        const cancellationPolicySetting = await prisma.setting.findUnique({
          where: { key: "config.cancellationPolicy" },
          select: { value: true },
        });

        const cancellationPolicy =
          typeof cancellationPolicySetting?.value === "string"
            ? cancellationPolicySetting.value
            : defaultPolicy;

        const updated = await prisma.$transaction(async (tx) => {
          const updatedBooking = await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: BookingStatus.CANCELLED,
              cancelledAt: now,
              remainingAmount: 0,
              cancellationRequested: false,
              cancellationRequestedAt: null,
              cancellationRequestedRefundRate: null,
              cancellationPreviousStatus: null,
            } as Prisma.BookingUpdateInput,
            select: {
              startDate: true,
              endDate: true,
              totalPrice: true,
              depositPaid: true,
              remainingAmount: true,
            },
          });

          await tx.invoice.updateMany({
            where: {
              bookingId,
              status: {
                not: InvoiceStatus.CANCELLED,
              },
            },
            data: {
              status: InvoiceStatus.CANCELLED,
            },
          });

          return updatedBooking;
        });

        if (booking.user?.email && booking.user.name) {
          const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";
          const bookingPeriod = `${format(
            updated.startDate,
            "dd MMMM yyyy 'à' HH:mm",
            { locale: fr },
          )} → ${format(updated.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

          const emailResult = await emailModule.sendBookingCancellationEmail({
            to: booking.user.email,
            name: booking.user.name,
            greeting,
            booking: {
              reference: booking.reference,
              totalPrice: updated.totalPrice ?? 0,
              depositPaid: updated.depositPaid ?? 0,
              remainingAmount: updated.remainingAmount ?? 0,
              startDate: updated.startDate,
              endDate: updated.endDate,
              refundAmount,
              refundRate,
              refundLabel:
                refundRate === 1
                  ? "Remboursement intégral (100%)"
                  : refundRate === 0.5
                  ? "Remboursement partiel (50%)"
                  : "Pas de remboursement (0%)",
              retentionAmount,
              period: bookingPeriod,
              reason: booking.cancellationReason,
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
            policy: cancellationPolicy,
          });

          if (emailResult.skipped) {
            console.warn(
              `[Admin Bookings] ⚠️  Email d'annulation ignoré pour la réservation ${booking.reference} (credentials non configurés). Vérifiez GMAIL_USER et GMAIL_PASSWORD dans .env`,
            );
          } else if (!emailResult.success) {
            console.warn(
              `[Admin Bookings] ❌ Échec de l'envoi de l'email d'annulation pour la réservation ${booking.reference}:`,
              emailResult.error ?? "Erreur inconnue",
            );
          } else {
            console.log(
              `[Admin Bookings] ✅ Email d'annulation envoyé pour la réservation ${booking.reference}`,
              emailResult.queued ? "(mis en queue)" : "(envoyé directement)",
            );
          }
        }
      } else {
        const restored = await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: previousStatus,
            cancellationRequested: false,
            cancellationRequestedAt: null,
            cancellationRequestedRefundRate: null,
            cancellationPreviousStatus: null,
            cancellationReason: null,
          } as Prisma.BookingUpdateInput,
          select: {
            startDate: true,
            endDate: true,
            totalPrice: true,
            depositPaid: true,
            remainingAmount: true,
          },
        });

        if (booking.user?.email && booking.user.name) {
          const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";
          const bookingPeriod = `${format(
            restored.startDate,
            "dd MMMM yyyy 'à' HH:mm",
            { locale: fr },
          )} → ${format(restored.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

          const emailResult = await emailModule.sendBookingCancellationRejectedEmail({
            to: booking.user.email,
            name: booking.user.name,
            greeting,
            booking: {
              reference: booking.reference,
              totalPrice: restored.totalPrice ?? 0,
              depositPaid: restored.depositPaid ?? 0,
              remainingAmount: restored.remainingAmount ?? 0,
              startDate: restored.startDate,
              endDate: restored.endDate,
              period: bookingPeriod,
              reason: booking.cancellationReason,
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

          if (emailResult.skipped) {
            console.warn(
              `[Admin Bookings] ⚠️  Email de refus d'annulation ignoré pour la réservation ${booking.reference} (credentials non configurés). Vérifiez GMAIL_USER et GMAIL_PASSWORD dans .env`,
            );
          } else if (!emailResult.success) {
            console.warn(
              `[Admin Bookings] ❌ Échec de l'envoi de l'email de refus d'annulation pour la réservation ${booking.reference}:`,
              emailResult.error ?? "Erreur inconnue",
            );
          } else {
            console.log(
              `[Admin Bookings] ✅ Email de refus d'annulation envoyé pour la réservation ${booking.reference}`,
              emailResult.queued ? "(mis en queue)" : "(envoyé directement)",
            );
          }
        }
      }
    } else {
      const nextStatus =
        action === "approve" ? BookingStatus.CONFIRMED : BookingStatus.CANCELLED;

      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: nextStatus,
        } as Prisma.BookingUpdateInput,
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

        const emailResult = await emailModule.sendBookingUpdateEmail({
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

        if (emailResult.skipped) {
          console.warn(
            `[Admin Bookings] ⚠️  Email de modération ignoré pour la réservation ${booking.reference} (credentials non configurés). Vérifiez GMAIL_USER et GMAIL_PASSWORD dans .env`,
          );
        } else if (!emailResult.success) {
          console.warn(
            `[Admin Bookings] ❌ Échec de l'envoi de l'email de modération pour la réservation ${booking.reference}:`,
            emailResult.error ?? "Erreur inconnue",
          );
        } else {
          console.log(
            `[Admin Bookings] ✅ Email de modération envoyé pour la réservation ${booking.reference}`,
            emailResult.queued ? "(mis en queue)" : "(envoyé directement)",
          );
        }
      }
    }

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/statistics");
    revalidatePath("/admin/invoices");
    revalidatePath("/dashboard");

    // Invalider le cache des réservations et de disponibilité
    const { invalidateBookingCache, invalidateVehicleAvailabilityCache } = await import("@/lib/cache-invalidation");
    await Promise.all([
      invalidateBookingCache(booking.id).catch((error) => {
        console.error("Error invalidating booking cache:", error);
      }),
      invalidateVehicleAvailabilityCache(booking.vehicleId).catch((error) => {
        console.error("Error invalidating vehicle availability cache:", error);
      }),
    ]);

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

