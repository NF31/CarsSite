import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type {
  BookingModerationPayload,
  EmailModule,
  ModerateBookingResult,
  ModerateBookingAction,
} from "../types";
import {
  getEmailGreeting,
  formatBookingPeriod,
  prepareModificationInfo,
  hasModificationData,
  prepareBookingEmailData,
  prepareVehicleEmailData,
  prepareLocationsEmailData,
} from "../utils/email-helpers";

/**
 * Vérifie si une erreur de remboursement est récupérable
 */
function isRefundErrorRecoverable(error?: string): boolean {
  if (!error) return false;
  return (
    error.includes("Aucun paiement") ||
    error.includes("paiement Stripe") ||
    error.includes("montant total disponible") ||
    error.includes("montant insuffisant") ||
    error.includes("dépasse le montant total") ||
    error.includes("remboursement manuel") ||
    error.includes("déjà été complètement remboursé") ||
    error.includes("remboursable disponible : 0") ||
    error.includes("greater than or equal to 1")
  );
}

/**
 * Traite l'approbation d'une demande de modification
 */
async function handleModificationApproval(
  booking: BookingModerationPayload,
  emailModule: EmailModule
): Promise<ModerateBookingResult> {
  const { createRefundAction } = await import("@/actions/public/payments/create-refund");
  const { createCheckoutSessionAction } = await import("@/actions/public/payments/create-checkout-session");

  const originalTotalPrice = booking.originalTotalPrice ?? booking.totalPrice ?? 0;
  const originalDepositPaid = booking.originalDepositPaid ?? booking.depositPaid ?? 0;
  const originalRemainingAmount = originalTotalPrice - originalDepositPaid;
  const depositDifference = booking.modificationDepositDifference ?? 0;
  const securityDepositPaid = booking.securityDepositPaid ?? 0;
  let paymentUrl: string | undefined;
  let refundCreated = false;
  let refundAmountCreated = 0;

  // Créer un remboursement si nécessaire
  if (depositDifference < 0 && originalDepositPaid > 0) {
    const refundAmount = Math.abs(depositDifference);
    const refundResult = await createRefundAction({
      bookingId: booking.id,
      amount: refundAmount,
      reason: "booking_modification",
    });

    if (!refundResult.success) {
      if (isRefundErrorRecoverable(refundResult.error)) {
        refundCreated = false;
        refundAmountCreated = 0;
      } else {
        return {
          success: false,
          error: `Erreur lors du remboursement: ${refundResult.error}`,
        };
      }
    } else {
      refundCreated = true;
      refundAmountCreated = refundAmount;
    }
  }

  // Créer une session de paiement si nécessaire
  if (depositDifference > 0) {
    const cautionInfo =
      securityDepositPaid > 0
        ? ` (la caution de ${securityDepositPaid.toFixed(2)}€ a déjà été payée et n'est pas incluse)`
        : "";

    const modificationMetadata = {
      originalTotalPrice: originalTotalPrice.toString(),
      originalDepositPaid: originalDepositPaid.toString(),
      originalRemainingAmount: originalRemainingAmount.toString(),
      depositDifference: depositDifference.toString(),
      securityDepositPaid: securityDepositPaid.toString(),
    };

    const paymentResult = await createCheckoutSessionAction({
      bookingId: booking.id,
      amount: depositDifference,
      description: `Acompte supplémentaire pour la modification de dates - Réservation ${booking.reference}${cautionInfo}`,
      paymentType: "deposit",
      isModificationPayment: true,
      modificationMetadata,
    });

    if (!paymentResult.success || !paymentResult.url) {
      return {
        success: false,
        error: `Erreur lors de la création de la session de paiement: ${paymentResult.error}`,
      };
    }
    paymentUrl = paymentResult.url;
  }

  // Déterminer le statut final
  const hasModificationDepositDiff = (booking.modificationDepositDifference ?? 0) > 0;
  const requiresPayment = depositDifference > 0 || !!paymentUrl || hasModificationDepositDiff;
  const newStatus = requiresPayment ? BookingStatus.PENDING : BookingStatus.CONFIRMED;

  // Mettre à jour la réservation
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      modificationRequested: false,
      modificationRequestedAt: null,
      originalStartDate: requiresPayment ? booking.originalStartDate : null,
      originalEndDate: requiresPayment ? booking.originalEndDate : null,
      originalTotalPrice: requiresPayment ? booking.originalTotalPrice : null,
      originalDepositPaid: requiresPayment ? booking.originalDepositPaid : null,
      modificationDepositDifference: requiresPayment ? depositDifference : null,
      status: newStatus,
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

  // Corriger le statut si nécessaire
  if (depositDifference > 0 && updated.status !== BookingStatus.PENDING) {
    const corrected = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.PENDING },
      select: { status: true },
    });
    updated.status = corrected.status;
  } else if (requiresPayment && updated.status !== BookingStatus.PENDING) {
    const corrected = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.PENDING },
      select: { status: true },
    });
    updated.status = corrected.status;
  }

  // Envoyer l'email de confirmation
  if (booking.user?.email && booking.user.name) {
    const greeting = getEmailGreeting();
    const emailStatus = requiresPayment ? BookingStatus.PENDING : updated.status;

    const modificationInfo = prepareModificationInfo({
      originalTotalPrice,
      originalDepositPaid,
      originalRemainingAmount,
      depositDifference,
      refundAmount: refundCreated ? refundAmountCreated : undefined,
      additionalPaymentAmount: depositDifference > 0 ? depositDifference : undefined,
      paymentUrl,
      securityDepositPaid: securityDepositPaid > 0 ? securityDepositPaid : undefined,
    });

    await emailModule.sendBookingUpdateEmail({
      to: booking.user.email,
      name: booking.user.name,
      greeting,
      booking: {
        ...prepareBookingEmailData(booking, updated),
        status: emailStatus,
      },
      vehicle: prepareVehicleEmailData(booking),
      locations: prepareLocationsEmailData(booking),
      modificationInfo: hasModificationData(modificationInfo) ? modificationInfo : undefined,
    });
  }

  return { success: true };
}

/**
 * Traite le rejet d'une demande de modification
 */
async function handleModificationRejection(
  booking: BookingModerationPayload,
  emailModule: EmailModule,
  rejectionReason?: string
): Promise<ModerateBookingResult> {
  if (!booking.originalStartDate || !booking.originalEndDate) {
    return {
      success: false,
      error:
        "Impossible de restaurer les dates originales. Les données sont manquantes. Si la modification a déjà été acceptée et payée, vous ne pouvez plus la rejeter.",
    };
  }

  const originalTotalPrice = booking.originalTotalPrice ?? booking.totalPrice ?? 0;
  const originalDepositPaid = booking.originalDepositPaid ?? booking.depositPaid ?? 0;
  const originalRemainingAmount = originalTotalPrice - originalDepositPaid;

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      startDate: booking.originalStartDate,
      endDate: booking.originalEndDate,
      totalPrice: originalTotalPrice,
      depositPaid: originalDepositPaid,
      remainingAmount: originalRemainingAmount,
      modificationRequested: false,
      modificationRequestedAt: null,
      originalStartDate: null,
      originalEndDate: null,
      originalTotalPrice: null,
      originalDepositPaid: null,
      modificationDepositDifference: null,
      modificationRejectionReason: rejectionReason || null,
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

  // Envoyer l'email de refus
  if (booking.user?.email && booking.user.name) {
    const greeting = getEmailGreeting();

    await emailModule.sendBookingUpdateEmail({
      to: booking.user.email,
      name: booking.user.name,
      greeting,
      booking: prepareBookingEmailData(booking, updated),
      vehicle: prepareVehicleEmailData(booking),
      locations: prepareLocationsEmailData(booking),
      modificationInfo: undefined,
      rejectionReason,
    });
  }

  return { success: true };
}

/**
 * Handler principal pour les demandes de modification
 */
export async function handleModificationRequest(
  booking: BookingModerationPayload,
  action: ModerateBookingAction,
  emailModule: EmailModule,
  rejectionReason?: string
): Promise<ModerateBookingResult> {
  if (action === "approve") {
    return handleModificationApproval(booking, emailModule);
  } else {
    return handleModificationRejection(booking, emailModule, rejectionReason);
  }
}

