import { addEmailToQueue, EmailJobData } from "./email-queue";
import { getVerificationEmailTemplate } from "./templates/verification-email";
import { getPasswordResetEmailTemplate } from "./templates/password-reset-email";
import { getAccountDeletionEmailTemplate } from "./templates/account-deletion-email";
import { getBookingConfirmationEmailTemplate } from "./templates/booking-confirmation-email";
import { getBookingUpdateEmailTemplate } from "./templates/booking-update-email";
import { getBookingCancellationEmailTemplate } from "./templates/booking-cancellation-email";
import { getBookingCancellationRejectedEmailTemplate } from "./templates/booking-cancellation-rejected-email";
import { getBookingCancellationRequestEmailTemplate } from "./templates/booking-cancellation-request-email";
import { BookingStatus } from "@prisma/client";

/**
 * Ajoute un email de vérification à la queue
 */
export async function queueVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<{ success: boolean; queued: boolean }> {
  try {
    const verificationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?token=${token}`;
    const template = getVerificationEmailTemplate(name, verificationUrl);

    await addEmailToQueue({
      type: "verification",
      to: email,
      subject: "Vérifiez votre adresse email - CarRental",
      html: template.html,
      text: template.text,
      metadata: {
        name,
        token,
      },
    });

    return { success: true, queued: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'email de vérification à la queue:", error);
    return { success: false, queued: false };
  }
}

/**
 * Ajoute un email de réinitialisation de mot de passe à la queue
 */
export async function queuePasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<{ success: boolean; queued: boolean }> {
  try {
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    const template = getPasswordResetEmailTemplate(name, resetUrl);

    await addEmailToQueue({
      type: "password-reset",
      to: email,
      subject: "Réinitialisation de votre mot de passe - CarRental",
      html: template.html,
      metadata: {
        name,
        token,
      },
    });

    return { success: true, queued: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'email de réinitialisation à la queue:", error);
    return { success: false, queued: false };
  }
}

/**
 * Ajoute un email de suppression de compte à la queue
 */
export async function queueAccountDeletionEmail(
  email: string,
  name: string,
  token: string
): Promise<{ success: boolean; queued: boolean }> {
  try {
    const confirmationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/confirm-account-deletion?token=${token}`;
    const template = getAccountDeletionEmailTemplate(name, confirmationUrl);

    await addEmailToQueue({
      type: "account-deletion",
      to: email,
      subject: "Confirmation de suppression de compte - CarRental",
      html: template.html,
      metadata: {
        name,
        token,
      },
    });

    return { success: true, queued: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'email de suppression à la queue:", error);
    return { success: false, queued: false };
  }
}

interface BookingConfirmationEmailParams {
  to: string;
  name: string;
  greeting: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    startDate: Date;
    endDate: Date;
    status: BookingStatus;
    period: string;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
}

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
}: BookingConfirmationEmailParams): Promise<{ success: boolean; queued: boolean }> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const dashboardUrl = `${baseUrl}/client/dashboard`;

    const statusLabels: Record<BookingStatus, string> = {
      [BookingStatus.PENDING]: "En attente",
      [BookingStatus.CONFIRMED]: "Confirmée",
      [BookingStatus.IN_PROGRESS]: "En cours",
      [BookingStatus.COMPLETED]: "Terminée",
      [BookingStatus.CANCELLED]: "Annulée",
    };

    const statusColors: Record<BookingStatus, { text: string; background: string }> = {
      [BookingStatus.PENDING]: { text: "#92400e", background: "#fef3c7" },
      [BookingStatus.CONFIRMED]: { text: "#1d4ed8", background: "#dbeafe" },
      [BookingStatus.IN_PROGRESS]: { text: "#7c3aed", background: "#ede9fe" },
      [BookingStatus.COMPLETED]: { text: "#065f46", background: "#d1fae5" },
      [BookingStatus.CANCELLED]: { text: "#991b1b", background: "#fee2e2" },
    };

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
      },
      status: {
        label: statusLabels[bookingStatus],
        textColor: statusColors[bookingStatus].text,
        backgroundColor: statusColors[bookingStatus].background,
      },
      dashboardUrl,
    });

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
    });

    return { success: true, queued: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'email de confirmation à la queue:", error);
    return { success: false, queued: false };
  }
}

interface BookingUpdateEmailParams {
  to: string;
  name: string;
  greeting: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    startDate: Date;
    endDate: Date;
    status: BookingStatus;
    period: string;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
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
}: BookingUpdateEmailParams): Promise<{ success: boolean; queued: boolean }> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const dashboardUrl = `${baseUrl}/client/dashboard`;

    const statusLabels: Record<BookingStatus, string> = {
      [BookingStatus.PENDING]: "En attente",
      [BookingStatus.CONFIRMED]: "Confirmée",
      [BookingStatus.IN_PROGRESS]: "En cours",
      [BookingStatus.COMPLETED]: "Terminée",
      [BookingStatus.CANCELLED]: "Annulée",
    };

    const statusColors: Record<BookingStatus, { text: string; background: string }> = {
      [BookingStatus.PENDING]: { text: "#92400e", background: "#fef3c7" },
      [BookingStatus.CONFIRMED]: { text: "#1d4ed8", background: "#dbeafe" },
      [BookingStatus.IN_PROGRESS]: { text: "#7c3aed", background: "#ede9fe" },
      [BookingStatus.COMPLETED]: { text: "#065f46", background: "#d1fae5" },
      [BookingStatus.CANCELLED]: { text: "#991b1b", background: "#fee2e2" },
    };

    const bookingStatus = booking.status ?? BookingStatus.PENDING;

    const statusMessages: Record<BookingStatus, string> = {
      [BookingStatus.PENDING]:
        "Votre demande de modification a bien été prise en compte et reste en attente de validation. Nous reviendrons vers vous sous peu.",
      [BookingStatus.CONFIRMED]:
        "Bonne nouvelle ! Nous avons validé votre demande de modification. Les nouvelles dates ainsi que les informations ci-dessous sont désormais confirmées.",
      [BookingStatus.IN_PROGRESS]:
        "Les nouvelles dates de votre réservation ont été intégrées. Votre véhicule vous attend pour la période indiquée ci-dessous.",
      [BookingStatus.COMPLETED]:
        "Votre réservation a été mise à jour et terminée. Retrouvez ci-dessous le récapitulatif des informations finales.",
      [BookingStatus.CANCELLED]:
        "Nous sommes désolés : nous n'avons pas pu accepter votre demande de modification. La réservation a été annulée. N'hésitez pas à nous contacter pour envisager une autre solution.",
    };

    const statusMessage = statusMessages[bookingStatus];
    const heroContent: Record<
      BookingStatus,
      {
        title: string;
        subtitle: string;
        badge: string;
        gradientFrom: string;
        gradientTo: string;
        ctaLabel: string;
        ctaMutedLabel?: string;
      }
    > = {
      [BookingStatus.PENDING]: {
        title: "Modification en attente",
        subtitle: "Nous traitons votre demande et reviendrons vers vous rapidement.",
        badge: "Demande reçue",
        gradientFrom: "#fbbf24",
        gradientTo: "#f59e0b",
        ctaLabel: "Suivre ma réservation",
        ctaMutedLabel: "Besoin d'aide ? Répondez directement à ce message.",
      },
      [BookingStatus.CONFIRMED]: {
        title: "Votre demande est validée !",
        subtitle: "Les nouvelles dates sont confirmées, retrouvez le détail ci-dessous.",
        badge: "Demande acceptée",
        gradientFrom: "#0ea5e9",
        gradientTo: "#0284c7",
        ctaLabel: "Voir la réservation mise à jour",
      },
      [BookingStatus.IN_PROGRESS]: {
        title: "Votre trajet démarre bientôt",
        subtitle: "Retrouvez toutes les informations utiles avant votre départ.",
        badge: "Réservation active",
        gradientFrom: "#7c3aed",
        gradientTo: "#5b21b6",
        ctaLabel: "Consulter les détails",
      },
      [BookingStatus.COMPLETED]: {
        title: "Réservation finalisée",
        subtitle: "Merci d'avoir voyagé avec nous. Voici le récapitulatif final.",
        badge: "Trajet terminé",
        gradientFrom: "#10b981",
        gradientTo: "#059669",
        ctaLabel: "Voir mon historique",
      },
      [BookingStatus.CANCELLED]: {
        title: "Nous n'avons pas pu valider votre demande",
        subtitle: "Nous restons disponibles pour vous proposer une alternative.",
        badge: "Demande refusée",
        gradientFrom: "#ef4444",
        gradientTo: "#b91c1c",
        ctaLabel: "Contacter le support",
        ctaMutedLabel: "Une question ? Répondez à cet email et nous vous aiderons rapidement.",
      },
    };

    const hero = heroContent[bookingStatus];

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
    });

    await addEmailToQueue({
      type: "booking-update",
      to,
      subject: `Votre réservation ${booking.reference} a été mise à jour`,
      html: template.html,
      text: template.text,
      metadata: {
        name,
        bookingReference: booking.reference,
      },
    });

    return { success: true, queued: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'email de mise à jour à la queue:", error);
    return { success: false, queued: false };
  }
}

interface BookingCancellationRejectedEmailParams {
  to: string;
  name: string;
  greeting: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    startDate: Date;
    endDate: Date;
    period: string;
    reason?: string | null;
    rejectionReason?: string | null; // Message de refus de l'admin
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
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
}: BookingCancellationRejectedEmailParams): Promise<{ success: boolean; queued: boolean }> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const dashboardUrl = `${baseUrl}/client/dashboard`;

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

    return { success: true, queued: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'email de refus d'annulation à la queue:", error);
    return { success: false, queued: false };
  }
}

interface BookingCancellationRequestEmailParams {
  to: string;
  name: string;
  greeting: string;
  booking: {
    reference: string;
    period: string;
    reason?: string | null;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
  pricing: {
    total: number;
    deposit: number;
    refund: number;
    retained: number;
  };
  policy: string;
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
}: BookingCancellationRequestEmailParams): Promise<{ success: boolean; queued: boolean }> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const dashboardUrl = `${baseUrl}/client/dashboard`;

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

    return { success: true, queued: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'email de demande d'annulation à la queue:", error);
    return { success: false, queued: false };
  }
}

interface BookingCancellationEmailParams {
  to: string;
  name: string;
  greeting: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    startDate: Date;
    endDate: Date;
    refundAmount: number;
    refundRate: number;
    refundLabel: string;
    retentionAmount: number;
    period: string;
    reason?: string | null;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
  policy: string;
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
}: BookingCancellationEmailParams): Promise<{ success: boolean; queued: boolean }> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const dashboardUrl = `${baseUrl}/client/dashboard`;

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

    return { success: true, queued: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'email d'annulation à la queue:", error);
    return { success: false, queued: false };
  }
}

