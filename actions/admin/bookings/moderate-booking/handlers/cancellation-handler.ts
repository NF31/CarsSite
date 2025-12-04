import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/lib/types/booking-status";
import { InvoiceStatus } from "@/lib/types/invoice-status";
import { type Prisma } from "@prisma/client";
import { createDefaultAdminSettings } from "@/actions/admin/settings/shared";
import type {
  BookingModerationPayload,
  EmailModule,
  ModerateBookingResult,
  ModerateBookingAction,
} from "../types";
import { computeRefundRate, roundCurrency } from "../utils/refund-helpers";
import {
  getEmailGreeting,
  formatBookingPeriod,
  prepareVehicleEmailData,
  prepareLocationsEmailData,
} from "../utils/email-helpers";

/**
 * Vérifie si une erreur de remboursement d'annulation est récupérable
 */
function isCancellationRefundErrorRecoverable(error?: string): boolean {
  if (!error) return false;
  return (
    error.includes("déjà été complètement remboursé") ||
    error.includes("remboursable disponible : 0") ||
    error.includes("remboursable est de") ||
    error.includes("Aucun remboursement supplémentaire")
  );
}

/**
 * Traite l'approbation d'une demande d'annulation
 */
async function handleCancellationApproval(
  booking: BookingModerationPayload,
  bookingId: string,
  emailModule: EmailModule
): Promise<ModerateBookingResult> {
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
      bookingId,
      amount: refundAmount,
      reason: "cancellation",
    });

    if (!refundResult.success) {
      if (!isCancellationRefundErrorRecoverable(refundResult.error)) {
        return {
          success: false,
          error: `Erreur lors du remboursement: ${refundResult.error}`,
        };
      }
    }
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

  // Envoyer l'email d'annulation
  if (booking.user?.email && booking.user.name) {
    const greeting = getEmailGreeting();
    const bookingPeriod = formatBookingPeriod(updated.startDate, updated.endDate);

    await emailModule.sendBookingCancellationEmail({
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
      vehicle: prepareVehicleEmailData(booking),
      locations: prepareLocationsEmailData(booking),
      policy: cancellationPolicy,
    });
  }

  return { success: true };
}

/**
 * Traite le rejet d'une demande d'annulation
 */
async function handleCancellationRejection(
  booking: BookingModerationPayload,
  bookingId: string,
  emailModule: EmailModule,
  rejectionReason?: string
): Promise<ModerateBookingResult> {
  const previousStatus = booking.cancellationPreviousStatus ?? BookingStatus.CONFIRMED;

  const updateData: Prisma.BookingUpdateInput = {
    cancellationRequested: false,
    cancellationRequestedAt: null,
    cancellationRequestedRefundRate: null,
    cancellationPreviousStatus: null,
    cancellationReason: null,
    cancellationRejectionReason: rejectionReason || null,
  };

  // Restaurer le statut : si PENDING, mettre CONFIRMED car refuser l'annulation = confirmer la réservation
  const restoredStatus = previousStatus === BookingStatus.PENDING ? BookingStatus.CONFIRMED : previousStatus;
  updateData.status = restoredStatus;

  const restored = await prisma.booking.update({
    where: { id: bookingId },
    data: updateData,
    select: {
      startDate: true,
      endDate: true,
      totalPrice: true,
      depositPaid: true,
      remainingAmount: true,
      status: true,
    },
  });

  // Envoyer l'email de refus d'annulation
  if (booking.user?.email && booking.user.name) {
    const greeting = getEmailGreeting();
    const bookingPeriod = formatBookingPeriod(restored.startDate, restored.endDate);

    await emailModule.sendBookingCancellationRejectedEmail({
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
        rejectionReason: rejectionReason || null,
      },
      vehicle: prepareVehicleEmailData(booking),
      locations: prepareLocationsEmailData(booking),
    });
  }

  return { success: true };
}

/**
 * Handler principal pour les demandes d'annulation
 */
export async function handleCancellationRequest(
  booking: BookingModerationPayload,
  bookingId: string,
  action: ModerateBookingAction,
  emailModule: EmailModule,
  rejectionReason?: string
): Promise<ModerateBookingResult> {
  if (action === "approve") {
    return handleCancellationApproval(booking, bookingId, emailModule);
  } else {
    return handleCancellationRejection(booking, bookingId, emailModule, rejectionReason);
  }
}

