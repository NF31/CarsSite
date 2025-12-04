import { addEmailToQueue } from "../email-queue";
import { getBookingConfirmationEmailTemplate } from "../templates/booking-confirmation-email";
import { getBookingUpdateEmailTemplate } from "../templates/booking-update-email";
import { getBookingReminderEmailTemplate } from "../templates/booking-reminder-email";
import { getBookingCancellationEmailTemplate } from "../templates/booking-cancellation-email";
import { getBookingCancellationRejectedEmailTemplate } from "../templates/booking-cancellation-rejected-email";
import { getBookingCancellationRequestEmailTemplate } from "../templates/booking-cancellation-request-email";
import { BookingStatus } from "@/lib/types/booking-status";
import { getDashboardUrl, convertAttachmentsToBase64, withQueueErrorHandling } from "./utils/helpers";
import {
  getBookingStatusLabels,
  getBookingStatusColors,
  getBookingStatusMessages,
  getBookingHeroContent,
  getBookingUpdateEmailSubject,
  isPendingWithPaymentRequired,
  isModificationRejection,
} from "./utils/booking-helpers";
import type {
  BookingConfirmationEmailParams,
  BookingUpdateEmailParams,
  BookingReminderEmailParams,
  BookingCancellationRejectedEmailParams,
  BookingCancellationRequestEmailParams,
  BookingCancellationEmailParams,
  QueueEmailResult,
} from "./types";

/**
 * Ajoute un email de confirmation de réservation à la queue
 */
export async function queueBookingConfirmationEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
  attachments,
}: BookingConfirmationEmailParams): Promise<QueueEmailResult> {
  return withQueueErrorHandling(async () => {
    const dashboardUrl = getDashboardUrl();
    const statusLabels = getBookingStatusLabels(booking.status);
    const statusColors = getBookingStatusColors();
    const bookingStatus = booking.status ?? BookingStatus.PENDING;

    const template = getBookingConfirmationEmailTemplate({
      greeting,
      name,
      reference: booking.reference,
      period: booking.period,
      vehicle,
      locations,
      pricing: {
        total: booking.totalPrice,
        deposit: booking.depositPaid,
        remaining: booking.remainingAmount,
        securityDeposit: booking.securityDepositPaid,
      },
      status: {
        label: statusLabels[bookingStatus],
        textColor: statusColors[bookingStatus].text,
        backgroundColor: statusColors[bookingStatus].background,
      },
      dashboardUrl,
    });

    const attachmentsBase64 = convertAttachmentsToBase64(attachments);

    await addEmailToQueue({
      type: "booking-confirmation",
      to,
      subject: `Confirmation de réservation ${booking.reference}`,
      html: template.html,
      text: template.text,
      metadata: {
        name,
        bookingReference: booking.reference,
      },
      attachments: attachmentsBase64,
    });
  }, "Erreur lors de l'ajout de l'email de confirmation à la queue:");
}

/**
 * Ajoute un email de mise à jour de réservation à la queue
 */
export async function queueBookingUpdateEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
  modificationInfo,
  rejectionReason,
}: BookingUpdateEmailParams): Promise<QueueEmailResult> {
  return withQueueErrorHandling(async () => {
    const dashboardUrl = getDashboardUrl();
    const bookingStatus = booking.status ?? BookingStatus.PENDING;
    const isRejection = isModificationRejection(rejectionReason);
    const isPendingWithPayment = isPendingWithPaymentRequired(bookingStatus, modificationInfo);

    const statusLabels = getBookingStatusLabels(bookingStatus, isPendingWithPayment);
    const statusColors = getBookingStatusColors();
    const statusMessages = getBookingStatusMessages(
      bookingStatus,
      isPendingWithPayment,
      isRejection,
      !!modificationInfo
    );
    const statusMessage = statusMessages[bookingStatus];
    const heroContent = getBookingHeroContent(
      bookingStatus,
      isPendingWithPayment,
      isRejection,
      modificationInfo
    );
    const hero = heroContent[bookingStatus];

    const emailSubject = getBookingUpdateEmailSubject(
      booking.reference,
      bookingStatus,
      isPendingWithPayment,
      isRejection,
      modificationInfo
    );

    const template = getBookingUpdateEmailTemplate({
      greeting,
      name,
      reference: booking.reference,
      period: booking.period,
      statusMessage,
      heroTitle: hero.title,
      heroSubtitle: hero.subtitle,
      heroBadge: hero.badge,
      heroGradientFrom: hero.gradientFrom,
      heroGradientTo: hero.gradientTo,
      vehicle,
      locations,
      pricing: {
        total: booking.totalPrice,
        deposit: booking.depositPaid,
        remaining: booking.remainingAmount,
      },
      status: {
        label: statusLabels[bookingStatus],
        textColor: statusColors[bookingStatus].text,
        backgroundColor: statusColors[bookingStatus].background,
      },
      dashboardUrl,
      ctaLabel: hero.ctaLabel,
      ctaMutedLabel: hero.ctaMutedLabel,
      // Ne pas passer modificationInfo si c'est un refus (pour éviter d'afficher la comparaison des prix)
      modificationInfo: isRejection ? undefined : modificationInfo,
      rejectionReason,
    });

    await addEmailToQueue({
      type: "booking-update",
      to,
      subject: emailSubject,
      html: template.html,
      text: template.text,
      metadata: {
        name,
        bookingReference: booking.reference,
      },
    });
  }, "Erreur lors de l'ajout de l'email de mise à jour à la queue:");
}

/**
 * Ajoute un email de rappel de réservation à la queue
 */
export async function queueBookingReminderEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
}: BookingReminderEmailParams): Promise<QueueEmailResult> {
  return withQueueErrorHandling(async () => {
    const dashboardUrl = getDashboardUrl();

    const template = getBookingReminderEmailTemplate({
      greeting,
      name,
      reference: booking.reference,
      period: booking.period,
      startDate: booking.startDate,
      vehicle,
      locations,
      pricing: {
        total: booking.totalPrice,
        deposit: booking.depositPaid,
        remaining: booking.remainingAmount,
      },
      dashboardUrl,
    });

    await addEmailToQueue({
      type: "booking-reminder",
      to,
      subject: `⏰ Rappel : Votre réservation ${booking.reference} approche`,
      html: template.html,
      text: template.text,
      metadata: {
        bookingReference: booking.reference,
        name,
      },
    });
  }, "Erreur lors de l'ajout de l'email de rappel à la queue:");
}

/**
 * Ajoute un email de refus d'annulation à la queue
 */
export async function queueBookingCancellationRejectedEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
}: BookingCancellationRejectedEmailParams): Promise<QueueEmailResult> {
  return withQueueErrorHandling(async () => {
    const dashboardUrl = getDashboardUrl();

    const template = getBookingCancellationRejectedEmailTemplate({
      greeting,
      name,
      reference: booking.reference,
      period: booking.period,
      vehicle,
      locations,
      pricing: {
        total: booking.totalPrice ?? 0,
        deposit: booking.depositPaid ?? 0,
        remaining: booking.remainingAmount ?? 0,
      },
      dashboardUrl,
      reason: booking.reason,
      rejectionReason: booking.rejectionReason,
    });

    await addEmailToQueue({
      type: "booking-cancellation-rejected",
      to,
      subject: `Votre demande d'annulation ${booking.reference}`,
      html: template.html,
      text: template.text,
      metadata: {
        name,
        bookingReference: booking.reference,
      },
    });
  }, "Erreur lors de l'ajout de l'email de refus d'annulation à la queue:");
}

/**
 * Ajoute un email de demande d'annulation à la queue
 */
export async function queueBookingCancellationRequestEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
  pricing,
  policy,
}: BookingCancellationRequestEmailParams): Promise<QueueEmailResult> {
  return withQueueErrorHandling(async () => {
    const dashboardUrl = getDashboardUrl();

    const template = getBookingCancellationRequestEmailTemplate({
      greeting,
      name,
      reference: booking.reference,
      period: booking.period,
      vehicle,
      locations,
      pricing,
      policy,
      reason: booking.reason,
      dashboardUrl,
    });

    await addEmailToQueue({
      type: "booking-cancellation-request",
      to,
      subject: `Demande d'annulation ${booking.reference} reçue`,
      html: template.html,
      text: template.text,
      metadata: {
        name,
        bookingReference: booking.reference,
      },
    });
  }, "Erreur lors de l'ajout de l'email de demande d'annulation à la queue:");
}

/**
 * Ajoute un email d'annulation de réservation à la queue
 */
export async function queueBookingCancellationEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
  policy,
}: BookingCancellationEmailParams): Promise<QueueEmailResult> {
  return withQueueErrorHandling(async () => {
    const dashboardUrl = getDashboardUrl();

    const template = getBookingCancellationEmailTemplate({
      greeting,
      name,
      reference: booking.reference,
      period: booking.period,
      vehicle,
      locations,
      pricing: {
        total: booking.totalPrice ?? 0,
        deposit: booking.depositPaid ?? 0,
        refund: booking.refundAmount ?? 0,
        retained: booking.retentionAmount ?? 0,
        remaining: booking.remainingAmount ?? 0,
        refundLabel: booking.refundLabel,
      },
      dashboardUrl,
      policy,
      reason: booking.reason,
    });

    await addEmailToQueue({
      type: "booking-cancellation",
      to,
      subject: `Annulation de votre réservation ${booking.reference}`,
      html: template.html,
      text: template.text,
      metadata: {
        name,
        bookingReference: booking.reference,
      },
    });
  }, "Erreur lors de l'ajout de l'email d'annulation à la queue:");
}

