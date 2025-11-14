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

async function handleModificationRequest(
  booking: BookingModerationPayload & {
    modificationRequested?: boolean;
    modificationRequestedAt?: Date | null;
    originalStartDate?: Date | null;
    originalEndDate?: Date | null;
    originalTotalPrice?: number | null;
    originalDepositPaid?: number | null;
    modificationDepositDifference?: number | null;
    securityDepositPaid?: number | null;
  },
  action: "approve" | "reject",
  emailModule: EmailModule,
): Promise<ModerateBookingResult> {
  const { createRefundAction } = await import("@/actions/public/payments/create-refund");
  const { createCheckoutSessionAction } = await import("@/actions/public/payments/create-checkout-session");

  if (action === "approve") {
    // Admin accepte la modification → déclencher les actions Stripe
    const depositDifference = booking.modificationDepositDifference ?? 0;
    const securityDepositPaid = booking.securityDepositPaid ?? 0;
    let paymentUrl: string | undefined;

    // Si nouveau prix < ancien prix → créer un remboursement
    if (depositDifference < 0 && booking.depositPaid && booking.depositPaid > 0) {
      const refundAmount = Math.abs(depositDifference);
      const refundResult = await createRefundAction({
        bookingId: booking.id,
        amount: refundAmount,
        reason: "booking_modification",
      });

      if (!refundResult.success) {
        console.error("[Admin Moderation] Erreur lors du remboursement:", refundResult.error);
        return {
          success: false,
          error: `Erreur lors du remboursement: ${refundResult.error}`,
        };
      }
      console.log(`[Admin Moderation] ✅ Remboursement créé: ${refundAmount}€`);
    }

    // Si nouveau prix > ancien prix → créer une session de paiement
    if (depositDifference > 0) {
      const cautionInfo = securityDepositPaid > 0 
        ? ` (la caution de ${securityDepositPaid.toFixed(2)}€ a déjà été payée et n'est pas incluse)`
        : "";
      
      const paymentResult = await createCheckoutSessionAction({
        bookingId: booking.id,
        amount: depositDifference,
        description: `Acompte supplémentaire pour la modification de dates - Réservation ${booking.reference}${cautionInfo}`,
      });

      if (!paymentResult.success || !paymentResult.url) {
        console.error("[Admin Moderation] Erreur lors de la création de la session de paiement:", paymentResult.error);
        return {
          success: false,
          error: `Erreur lors de la création de la session de paiement: ${paymentResult.error}`,
        };
      }
      paymentUrl = paymentResult.url;
      console.log(`[Admin Moderation] ✅ Session de paiement créée pour: ${depositDifference}€`);
    }

    // Mettre à jour la réservation : valider la modification et nettoyer les champs de demande
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        modificationRequested: false,
        modificationRequestedAt: null,
        originalStartDate: null,
        originalEndDate: null,
        originalTotalPrice: null,
        originalDepositPaid: null,
        modificationDepositDifference: null,
        // Le statut reste PENDING si un paiement est nécessaire, sinon CONFIRMED
        status: depositDifference > 0 ? BookingStatus.PENDING : BookingStatus.CONFIRMED,
      } as Prisma.BookingUpdateInput,
      select: {
        startDate: true,
        endDate: true,
        totalPrice: true,
        depositPaid: true,
        remainingAmount: true,
        status: true,
      },
    });

    // Envoyer un email de confirmation
    if (booking.user?.email && booking.user.name) {
      const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";
      const bookingPeriod = `${format(
        updated.startDate,
        "dd MMMM yyyy 'à' HH:mm",
        { locale: fr },
      )} → ${format(updated.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

      // Préparer les informations de modification pour l'email
      const modificationInfo: {
        refundAmount?: number;
        additionalPaymentAmount?: number;
        paymentUrl?: string;
        securityDepositPaid?: number;
      } = {};

      if (depositDifference < 0) {
        // Remboursement
        modificationInfo.refundAmount = Math.abs(depositDifference);
      } else if (depositDifference > 0) {
        // Paiement supplémentaire
        modificationInfo.additionalPaymentAmount = depositDifference;
        if (paymentUrl) {
          modificationInfo.paymentUrl = paymentUrl;
          console.log(`[Admin Moderation] 📧 URL de paiement ajoutée à modificationInfo: ${paymentUrl}`);
        } else {
          console.warn(`[Admin Moderation] ⚠️  paymentUrl est undefined alors que depositDifference > 0`);
        }
      }

      // Ajouter la caution si elle a été payée
      if (securityDepositPaid > 0) {
        modificationInfo.securityDepositPaid = securityDepositPaid;
      }

      console.log(`[Admin Moderation] 📧 modificationInfo pour l'email:`, JSON.stringify(modificationInfo, null, 2));
      console.log(`[Admin Moderation] 📧 depositDifference: ${depositDifference}, refundAmount: ${modificationInfo.refundAmount}, additionalPaymentAmount: ${modificationInfo.additionalPaymentAmount}`);

      // Toujours passer modificationInfo si on a un remboursement ou un paiement supplémentaire
      // Même si seulement securityDepositPaid est présent, on le passe pour info
      const shouldIncludeModificationInfo = 
        modificationInfo.refundAmount || 
        modificationInfo.additionalPaymentAmount || 
        modificationInfo.securityDepositPaid;

      const emailResult = await emailModule.sendBookingUpdateEmail({
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
        modificationInfo: shouldIncludeModificationInfo ? modificationInfo : undefined,
      });

      if (emailResult.skipped) {
        console.warn(
          `[Admin Moderation] ⚠️  Email de modification ignoré pour la réservation ${booking.reference}`,
        );
      } else if (!emailResult.success) {
        console.warn(
          `[Admin Moderation] ❌ Échec de l'envoi de l'email de modification pour la réservation ${booking.reference}:`,
          emailResult.error ?? "Erreur inconnue",
        );
      } else {
        console.log(
          `[Admin Moderation] ✅ Email de modification envoyé pour la réservation ${booking.reference}`,
        );
      }
    }

    // Si un paiement est nécessaire, l'URL est déjà incluse dans l'email envoyé au client
    if (paymentUrl) {
      console.log(`[Admin Moderation] 🔗 URL de paiement créée et envoyée au client par email: ${paymentUrl}`);
    }

    return {
      success: true,
    };
  } else {
    // Admin refuse la modification → restaurer les dates originales
    if (!booking.originalStartDate || !booking.originalEndDate) {
      return {
        success: false,
        error: "Impossible de restaurer les dates originales. Les données sont manquantes.",
      };
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        // Restaurer les dates et prix originaux
        startDate: booking.originalStartDate,
        endDate: booking.originalEndDate,
        totalPrice: booking.originalTotalPrice ?? booking.totalPrice ?? 0,
        depositPaid: booking.originalDepositPaid ?? booking.depositPaid ?? 0,
        remainingAmount: (booking.originalTotalPrice ?? booking.totalPrice ?? 0) - (booking.originalDepositPaid ?? booking.depositPaid ?? 0),
        // Nettoyer les champs de demande
        modificationRequested: false,
        modificationRequestedAt: null,
        originalStartDate: null,
        originalEndDate: null,
        originalTotalPrice: null,
        originalDepositPaid: null,
        modificationDepositDifference: null,
        // Restaurer le statut précédent (probablement CONFIRMED)
        status: BookingStatus.CONFIRMED,
      } as Prisma.BookingUpdateInput,
      select: {
        startDate: true,
        endDate: true,
        totalPrice: true,
        depositPaid: true,
        remainingAmount: true,
        status: true,
      },
    });

    // Envoyer un email de refus
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
          totalPrice: updated.totalPrice ?? 0,
          depositPaid: updated.depositPaid ?? 0,
          remainingAmount: updated.remainingAmount ?? 0,
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
          `[Admin Moderation] ⚠️  Email de refus ignoré pour la réservation ${booking.reference}`,
        );
      } else if (!emailResult.success) {
        console.warn(
          `[Admin Moderation] ❌ Échec de l'envoi de l'email de refus pour la réservation ${booking.reference}:`,
          emailResult.error ?? "Erreur inconnue",
        );
      } else {
        console.log(
          `[Admin Moderation] ✅ Email de refus envoyé pour la réservation ${booking.reference}`,
        );
      }
    }

    return {
      success: true,
    };
  }
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
    })) as (BookingModerationPayload & {
      modificationRequested?: boolean;
      modificationRequestedAt?: Date | null;
      originalStartDate?: Date | null;
      originalEndDate?: Date | null;
      originalTotalPrice?: number | null;
      originalDepositPaid?: number | null;
      modificationDepositDifference?: number | null;
      securityDepositPaid?: number | null;
    }) | null;

    if (!booking) {
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    const emailModule = (await import("@/lib/email")) as unknown as EmailModule;

    const isCancellationRequest = booking.cancellationRequested;
    const isModificationRequest = booking.modificationRequested === true;

    // Vérifier que la réservation est en attente de traitement
    if (!isCancellationRequest && !isModificationRequest && booking.status !== BookingStatus.PENDING) {
      return {
        success: false,
        error: "Cette réservation a déjà été traitée.",
      };
    }

    // Gérer les demandes de modification de dates
    if (isModificationRequest) {
      return await handleModificationRequest(booking, action, emailModule);
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

        // Créer le remboursement Stripe si un remboursement est dû
        if (refundAmount > 0 && depositPaid > 0) {
          const { createRefundAction } = await import("@/actions/public/payments/create-refund");
          const refundResult = await createRefundAction({
            bookingId: booking.id,
            amount: refundAmount,
            reason: "cancellation",
          });

          if (!refundResult.success) {
            console.error("[Admin Moderation] Erreur lors du remboursement d'annulation:", refundResult.error);
            return {
              success: false,
              error: `Erreur lors du remboursement: ${refundResult.error}`,
            };
          }
          console.log(`[Admin Moderation] ✅ Remboursement d'annulation créé: ${refundAmount}€ (${(refundRate * 100).toFixed(0)}%)`);
        } else if (refundAmount === 0 && depositPaid > 0) {
          console.log(`[Admin Moderation] ℹ️  Aucun remboursement dû pour cette annulation (taux: ${(refundRate * 100).toFixed(0)}%)`);
        }

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
            totalPrice: updated.totalPrice ?? 0,
            depositPaid: updated.depositPaid ?? 0,
            remainingAmount: updated.remainingAmount ?? 0,
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

