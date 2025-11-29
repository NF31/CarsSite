import nodemailer from "nodemailer";
import { BookingStatus } from "@prisma/client";
import { getBookingConfirmationEmailTemplate } from "@/lib/templates/booking-confirmation-email";
import { getBookingUpdateEmailTemplate } from "@/lib/templates/booking-update-email";
import { getBookingReminderEmailTemplate } from "@/lib/templates/booking-reminder-email";
import { getBookingCancellationEmailTemplate } from "@/lib/templates/booking-cancellation-email";
import { getBookingCancellationRejectedEmailTemplate } from "@/lib/templates/booking-cancellation-rejected-email";
import { getBookingCancellationRequestEmailTemplate } from "@/lib/templates/booking-cancellation-request-email";
import {
  queueBookingConfirmationEmail,
  queueBookingUpdateEmail,
  queueBookingCancellationRejectedEmail,
  queueBookingCancellationRequestEmail,
  queueBookingCancellationEmail,
  queueBookingReminderEmail,
} from "@/lib/email-queue-sender";
import { getBaseUrl, getFromAddress } from "../config";
import { sendEmailWithQueue, getGreeting } from "../utils";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from "../utils/booking-constants";
import {
  getBookingUpdateStatusLabels,
  getBookingUpdateStatusMessages,
  getBookingUpdateHeroContent,
  getBookingUpdateEmailSubject,
} from "../utils/booking-update-helpers";
import type {
  BookingConfirmationEmailParams,
  BookingUpdateEmailParams,
  BookingReminderEmailParams,
  BookingCancellationRejectedEmailParams,
  BookingCancellationEmailParams,
  BookingCancellationRequestEmailParams,
} from "../types";

export async function sendBookingConfirmationEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
  attachments,
}: BookingConfirmationEmailParams) {
  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/client/dashboard`;
  const bookingStatus = booking.status ?? BookingStatus.PENDING;
  const finalGreeting = greeting ?? getGreeting();

  const template = getBookingConfirmationEmailTemplate({
    greeting: finalGreeting,
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
      label: BOOKING_STATUS_LABELS[bookingStatus],
      textColor: BOOKING_STATUS_COLORS[bookingStatus].text,
      backgroundColor: BOOKING_STATUS_COLORS[bookingStatus].background,
    },
    dashboardUrl,
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: getFromAddress(),
    to,
    subject: `Confirmation de réservation ${booking.reference}`,
    html: template.html,
    text: template.text,
  };

  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType || "application/pdf",
    }));
  }

  return await sendEmailWithQueue({
    mailOptions,
    queueFunction: () => queueBookingConfirmationEmail({
      to,
      name,
      greeting: finalGreeting,
      booking,
      vehicle,
      locations,
      attachments,
    }),
    skipIfNoCredentials: true,
  });
}

export async function sendBookingUpdateEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
  modificationInfo,
  rejectionReason,
}: BookingUpdateEmailParams) {
  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/client/dashboard`;
  const bookingStatus = booking.status ?? BookingStatus.PENDING;
  const isRejection = rejectionReason != null && rejectionReason.trim() !== "";
  const isPendingWithPayment = bookingStatus === BookingStatus.PENDING && 
    modificationInfo?.paymentUrl != null && 
    modificationInfo?.additionalPaymentAmount != null && 
    modificationInfo.additionalPaymentAmount > 0;
  const finalGreeting = greeting ?? getGreeting();

  const statusLabels = getBookingUpdateStatusLabels(bookingStatus, isPendingWithPayment);
  const statusMessages = getBookingUpdateStatusMessages(
    bookingStatus,
    isPendingWithPayment,
    isRejection,
    !!modificationInfo
  );
  const statusMessage = statusMessages[bookingStatus];
  const heroContent = getBookingUpdateHeroContent(
    bookingStatus,
    isPendingWithPayment,
    isRejection,
    modificationInfo
  );
  const hero = heroContent[bookingStatus];

  const template = getBookingUpdateEmailTemplate({
    greeting: finalGreeting,
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
      textColor: BOOKING_STATUS_COLORS[bookingStatus].text,
      backgroundColor: BOOKING_STATUS_COLORS[bookingStatus].background,
    },
    dashboardUrl,
    ctaLabel: hero.ctaLabel,
    ctaMutedLabel: hero.ctaMutedLabel,
    modificationInfo: isRejection ? undefined : modificationInfo,
    rejectionReason,
  });

  const emailSubject = getBookingUpdateEmailSubject(
    bookingStatus,
    booking.reference,
    isPendingWithPayment,
    isRejection,
    modificationInfo
  );

  return await sendEmailWithQueue({
    mailOptions: {
      from: getFromAddress(),
      to,
      subject: emailSubject,
      html: template.html,
      text: template.text,
    },
    queueFunction: () => queueBookingUpdateEmail({
      to,
      name,
      greeting: finalGreeting,
      booking,
      vehicle,
      locations,
      modificationInfo,
      rejectionReason,
    } as Parameters<typeof queueBookingUpdateEmail>[0]),
    skipIfNoCredentials: true,
  });
}

export async function sendBookingReminderEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
}: BookingReminderEmailParams) {
  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/client/dashboard`;
  const finalGreeting = greeting ?? getGreeting();

  const template = getBookingReminderEmailTemplate({
    greeting: finalGreeting,
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

  return await sendEmailWithQueue({
    mailOptions: {
      from: getFromAddress(),
      to,
      subject: `⏰ Rappel : Votre réservation ${booking.reference} approche`,
      html: template.html,
      text: template.text,
    },
    queueFunction: () => queueBookingReminderEmail({
      to,
      name,
      greeting: finalGreeting,
      booking,
      vehicle,
      locations,
    }),
    skipIfNoCredentials: true,
  });
}

export async function sendBookingCancellationRejectedEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
}: BookingCancellationRejectedEmailParams) {
  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/client/dashboard`;
  const finalGreeting = greeting ?? getGreeting();

  const template = getBookingCancellationRejectedEmailTemplate({
    greeting: finalGreeting,
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

  return await sendEmailWithQueue({
    mailOptions: {
      from: getFromAddress(),
      to,
      subject: `Votre demande d'annulation ${booking.reference}`,
      html: template.html,
      text: template.text,
    },
    queueFunction: () => queueBookingCancellationRejectedEmail({
      to,
      name,
      greeting: finalGreeting,
      booking,
      vehicle,
      locations,
    }),
    skipIfNoCredentials: true,
  });
}

export async function sendBookingCancellationRequestEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
  pricing,
  policy,
}: BookingCancellationRequestEmailParams) {
  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/client/dashboard`;
  const finalGreeting = greeting ?? getGreeting();

  const template = getBookingCancellationRequestEmailTemplate({
    greeting: finalGreeting,
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

  return await sendEmailWithQueue({
    mailOptions: {
      from: getFromAddress(),
      to,
      subject: `Demande d'annulation ${booking.reference} reçue`,
      html: template.html,
      text: template.text,
    },
    queueFunction: () => queueBookingCancellationRequestEmail({
      to,
      name,
      greeting: finalGreeting,
      booking,
      vehicle,
      locations,
      pricing,
      policy,
    }),
    skipIfNoCredentials: true,
  });
}

export async function sendBookingCancellationEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
  policy,
}: BookingCancellationEmailParams) {
  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/client/dashboard`;
  const finalGreeting = greeting ?? getGreeting();

  const template = getBookingCancellationEmailTemplate({
    greeting: finalGreeting,
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

  return await sendEmailWithQueue({
    mailOptions: {
      from: getFromAddress(),
      to,
      subject: `Annulation de votre réservation ${booking.reference}`,
      html: template.html,
      text: template.text,
    },
    queueFunction: () => queueBookingCancellationEmail({
      to,
      name,
      greeting: finalGreeting,
      booking,
      vehicle,
      locations,
      policy,
    }),
    skipIfNoCredentials: true,
  });
}

