import nodemailer from "nodemailer";
import { getVerificationEmailTemplate } from "./templates/verification-email";
import { getPasswordResetEmailTemplate } from "./templates/password-reset-email";
import { getAccountDeletionEmailTemplate } from "./templates/account-deletion-email";
import { getBookingConfirmationEmailTemplate } from "./templates/booking-confirmation-email";
import { getBookingUpdateEmailTemplate } from "./templates/booking-update-email";
import { getBookingReminderEmailTemplate } from "./templates/booking-reminder-email";
import { getBookingCancellationEmailTemplate } from "./templates/booking-cancellation-email";
import { getBookingCancellationRejectedEmailTemplate } from "./templates/booking-cancellation-rejected-email";
import { getBookingCancellationRequestEmailTemplate } from "./templates/booking-cancellation-request-email";
import { getContactConfirmationEmailTemplate, getContactNotificationEmailTemplate } from "./templates/contact-email";
import { getInvoiceEmailTemplate } from "./templates/invoice-email";
import { BookingStatus } from "@prisma/client";
import {
  queueVerificationEmail,
  queuePasswordResetEmail,
  queueAccountDeletionEmail,
  queueBookingConfirmationEmail,
  queueBookingUpdateEmail,
  queueBookingCancellationRejectedEmail,
  queueBookingCancellationRequestEmail,
  queueBookingCancellationEmail,
  queueBookingReminderEmail,
  queueContactConfirmationEmail,
  queueContactNotificationEmail,
} from "./email-queue-sender";
import { isRedisAvailable } from "./redis";

// Vérifier si les credentials email sont configurés
const hasEmailCredentials =
  process.env.GMAIL_USER && process.env.GMAIL_PASSWORD;

const transporter = hasEmailCredentials
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true pour 465, false pour autres ports
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    })
  : null;

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  // Vérifier si les credentials sont configurés
  if (!hasEmailCredentials) {
    console.warn(
      "⚠️  Email credentials non configurés. En mode développement, utilisez ce lien :"
    );
    console.log(
      `🔗 ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?token=${token}`
    );
    throw new Error(
      "Configuration email manquante. Veuillez configurer GMAIL_USER et GMAIL_PASSWORD dans votre fichier .env"
    );
  }

  // Utiliser la queue si Redis est disponible, sinon envoyer directement
  const useQueue = await isRedisAvailable().catch(() => false);

  if (useQueue) {
    try {
      const result = await queueVerificationEmail(email, name, token);
      if (result.success && result.queued) {
        return { success: true, queued: true, messageId: undefined };
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la queue, fallback vers envoi direct:", error);
    }
  }

  // Fallback vers envoi direct si la queue n'est pas disponible
  if (!transporter) {
    throw new Error("Transporter email non initialisé");
  }

  const verificationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?token=${token}`;
  
  // Utiliser le template depuis lib/templates
  const template = getVerificationEmailTemplate(name, verificationUrl);

  const mailOptions = {
    from: `"CarRental" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Vérifiez votre adresse email - CarRental",
    html: template.html,
    text: template.text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email envoyé:", info.messageId);
    return { success: true, messageId: info.messageId, queued: false };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  // Vérifier si les credentials sont configurés
  if (!hasEmailCredentials) {
    console.warn(
      "⚠️  Email credentials non configurés. En mode développement, utilisez ce lien :"
    );
    console.log(
      `🔗 ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`
    );
    throw new Error(
      "Configuration email manquante. Veuillez configurer GMAIL_USER et GMAIL_PASSWORD dans votre fichier .env"
    );
  }

  // Utiliser la queue si Redis est disponible, sinon envoyer directement
  const useQueue = await isRedisAvailable().catch(() => false);

  if (useQueue) {
    try {
      const result = await queuePasswordResetEmail(email, name, token);
      if (result.success && result.queued) {
        return { success: true, queued: true, messageId: undefined };
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la queue, fallback vers envoi direct:", error);
    }
  }

  // Fallback vers envoi direct si la queue n'est pas disponible
  if (!transporter) {
    throw new Error("Transporter email non initialisé");
  }

  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  
  // Utiliser le template depuis lib/templates
  const template = getPasswordResetEmailTemplate(name, resetUrl);

  const mailOptions = {
    from: `"CarRental" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Réinitialisation de votre mot de passe - CarRental",
    html: template.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email de réinitialisation envoyé:", info.messageId);
    return { success: true, messageId: info.messageId, queued: false };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    throw error;
  }
}

export async function sendAccountDeletionEmail(
  email: string,
  name: string,
  token: string
) {
  // Vérifier si les credentials sont configurés
  if (!hasEmailCredentials) {
    console.warn(
      "⚠️  Email credentials non configurés. En mode développement, utilisez ce lien :"
    );
    console.log(
      `🔗 ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/confirm-account-deletion?token=${token}`
    );
    throw new Error(
      "Configuration email manquante. Veuillez configurer GMAIL_USER et GMAIL_PASSWORD dans votre fichier .env"
    );
  }

  // Utiliser la queue si Redis est disponible, sinon envoyer directement
  const useQueue = await isRedisAvailable().catch(() => false);

  if (useQueue) {
    try {
      const result = await queueAccountDeletionEmail(email, name, token);
      if (result.success && result.queued) {
        return { success: true, queued: true, messageId: undefined };
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la queue, fallback vers envoi direct:", error);
    }
  }

  // Fallback vers envoi direct si la queue n'est pas disponible
  if (!transporter) {
    throw new Error("Transporter email non initialisé");
  }

  const confirmationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/confirm-account-deletion?token=${token}`;
  
  // Utiliser le template depuis lib/templates
  const template = getAccountDeletionEmailTemplate(name, confirmationUrl);

  const mailOptions = {
    from: `"CarRental" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Confirmation de suppression de compte - CarRental",
    html: template.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email de confirmation de suppression envoyé:", info.messageId);
    return { success: true, messageId: info.messageId, queued: false };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    throw error;
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
    securityDepositPaid?: number; // Caution de garantie payée (optionnel)
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
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

export async function sendBookingConfirmationEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
  attachments,
}: BookingConfirmationEmailParams) {
  if (!hasEmailCredentials) {
    console.warn(
      "⚠️  Email credentials non configurés. L'email de confirmation de réservation n'a pas pu être envoyé."
    );
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

  // Utiliser la queue si Redis est disponible, sinon envoyer directement
  const useQueue = await isRedisAvailable().catch(() => false);

  if (useQueue) {
    try {
      const result = await queueBookingConfirmationEmail({
        to,
        name,
        greeting,
        booking,
        vehicle,
        locations,
        attachments,
      });
      if (result.success && result.queued) {
        return { success: true, queued: true, messageId: undefined };
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la queue, fallback vers envoi direct:", error);
    }
  }

  // Fallback vers envoi direct si la queue n'est pas disponible
  if (!transporter) {
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

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
      securityDeposit: booking.securityDepositPaid, // Passer la caution si elle a été payée
    },
    status: {
      label: statusLabels[bookingStatus],
      textColor: statusColors[bookingStatus].text,
      backgroundColor: statusColors[bookingStatus].background,
    },
    dashboardUrl,
  });

  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"CarRental" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Confirmation de réservation ${booking.reference}`,
      html: template.html,
      text: template.text,
    };

    // Ajouter les pièces jointes si présentes
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType || "application/pdf",
      }));
    }

    const info = await transporter.sendMail(mailOptions);

    return { success: true, messageId: info.messageId, queued: false };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi de l'email",
    };
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
  modificationInfo?: {
    originalTotalPrice?: number;
    originalDepositPaid?: number;
    originalRemainingAmount?: number;
    depositDifference?: number;
    refundAmount?: number;
    additionalPaymentAmount?: number;
    paymentUrl?: string;
    securityDepositPaid?: number;
    paymentConfirmed?: boolean; // Indique si le paiement supplémentaire a été confirmé (webhook)
  };
  rejectionReason?: string | null; // Message de refus de l'admin (pour les modifications refusées)
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
  // Log pour déboguer
  if (modificationInfo) {
    console.log(`\n📧 [Email] modificationInfo reçu dans sendBookingUpdateEmail:`);
    console.log(`   ${JSON.stringify(modificationInfo, null, 2)}`);
    console.log(`   - originalTotalPrice: ${modificationInfo.originalTotalPrice ?? "undefined/null"}`);
    console.log(`   - originalDepositPaid: ${modificationInfo.originalDepositPaid ?? "undefined/null"}`);
    console.log(`   - depositDifference: ${modificationInfo.depositDifference ?? "undefined/null"}`);
  } else {
    console.log(`\n📧 [Email] modificationInfo est undefined/null`);
  }

  if (!hasEmailCredentials) {
    console.warn(
      "⚠️  Email credentials non configurés. L'email de mise à jour de réservation n'a pas pu être envoyé."
    );
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

  // Utiliser la queue si Redis est disponible, sinon envoyer directement
  const useQueue = await isRedisAvailable().catch(() => false);

  if (useQueue) {
    try {
      const result = await queueBookingUpdateEmail({
        to,
        name,
        greeting,
        booking,
        vehicle,
        locations,
        modificationInfo, // ✅ IMPORTANT: Passer modificationInfo à la queue
        rejectionReason, // ✅ Passer le motif de refus si présent
      } as Parameters<typeof queueBookingUpdateEmail>[0]);
      if (result.success && result.queued) {
        return { success: true, queued: true, messageId: undefined };
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la queue, fallback vers envoi direct:", error);
    }
  }

  // Fallback vers envoi direct si la queue n'est pas disponible
  if (!transporter) {
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const dashboardUrl = `${baseUrl}/client/dashboard`;

  const bookingStatus = booking.status ?? BookingStatus.PENDING;

  // Détecter si c'est un refus de modification (rejectionReason présent)
  const isRejection = rejectionReason != null && rejectionReason.trim() !== "";
  
  // Log pour déboguer
  console.log(`\n📧 [Email] Détection de refus:`);
  console.log(`   - rejectionReason: ${rejectionReason ?? "null/undefined"}`);
  console.log(`   - isRejection: ${isRejection}`);
  console.log(`   - bookingStatus: ${bookingStatus}`);
  console.log(`   - modificationInfo présent: ${!!modificationInfo}`);

  // Détecter si c'est un PENDING avec paiement nécessaire (admin a validé mais client doit payer)
  const isPendingWithPayment = bookingStatus === BookingStatus.PENDING && 
    modificationInfo?.paymentUrl != null && 
    modificationInfo?.additionalPaymentAmount != null && 
    modificationInfo.additionalPaymentAmount > 0;

  const statusLabels: Record<BookingStatus, string> = {
    [BookingStatus.PENDING]: isPendingWithPayment ? "En attente de paiement" : "En attente",
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

  const statusMessages: Record<BookingStatus, string> = {
    [BookingStatus.PENDING]:
      isPendingWithPayment
        ? "Bonne nouvelle ! Nous avons validé votre demande de modification. Pour finaliser votre réservation, veuillez effectuer le paiement supplémentaire requis."
        : "Votre demande de modification a bien été prise en compte et reste en attente de validation. Nous reviendrons vers vous sous peu.",
    [BookingStatus.CONFIRMED]:
      isRejection
        ? "Nous sommes désolés : nous n'avons pas pu accepter votre demande de modification. Les dates originales ont été restaurées et votre réservation reste confirmée avec les informations initiales."
        : modificationInfo
        ? "Bonne nouvelle ! Nous avons validé votre demande de modification. Les nouvelles dates ainsi que les informations ci-dessous sont désormais confirmées."
        : "Bonne nouvelle ! Votre réservation a été confirmée. Toutes les informations ci-dessous sont désormais validées. Votre véhicule vous attend pour la période indiquée.",
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
      title: isPendingWithPayment 
        ? "Paiement supplémentaire requis" 
        : "Modification en attente",
      subtitle: isPendingWithPayment
        ? "Votre demande est validée ! Effectuez le paiement pour finaliser votre réservation."
        : "Nous traitons votre demande et reviendrons vers vous rapidement.",
      badge: isPendingWithPayment 
        ? "Paiement requis" 
        : "Demande reçue",
      gradientFrom: isPendingWithPayment ? "#f59e0b" : "#fbbf24",
      gradientTo: isPendingWithPayment ? "#d97706" : "#f59e0b",
      ctaLabel: "Suivre ma réservation",
      ctaMutedLabel: "Besoin d'aide ? Répondez directement à ce message.",
    },
    [BookingStatus.CONFIRMED]: {
        title: isRejection
          ? "Votre demande de modification a été refusée"
          : modificationInfo?.paymentConfirmed === true
          ? "Paiement supplémentaire confirmé !"
          : modificationInfo 
          ? "Votre demande est validée !" 
          : "Votre réservation est confirmée !",
        subtitle: isRejection
          ? "Les dates originales ont été restaurées. Votre réservation reste confirmée avec les informations initiales."
          : modificationInfo?.paymentConfirmed === true
          ? "Votre paiement supplémentaire pour la modification a été effectué avec succès"
          : modificationInfo 
          ? "Les nouvelles dates sont confirmées, retrouvez le détail ci-dessous."
          : "Toutes les informations sont validées, retrouvez le détail ci-dessous.",
        badge: isRejection 
          ? "Demande refusée" 
          : modificationInfo?.paymentConfirmed === true
          ? "Paiement confirmé"
          : modificationInfo 
          ? "Demande acceptée" 
          : "Réservation confirmée",
      gradientFrom: isRejection ? "#ef4444" : "#0ea5e9",
      gradientTo: isRejection ? "#b91c1c" : "#0284c7",
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
      subtitle: "Merci d’avoir voyagé avec nous. Voici le récapitulatif final.",
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

  // Générer le sujet de l'email selon le statut et le contexte
  const getEmailSubject = (): string => {
    const reference = booking.reference;
    
    // Selon le statut
    switch (bookingStatus) {
      case BookingStatus.PENDING:
        // Si c'est un PENDING avec paiement requis (admin a validé mais client doit payer)
        if (isPendingWithPayment) {
          return `Demande acceptée - Réservation ${reference}`;
        }
        return `Demande de modification reçue - Réservation ${reference}`;
      case BookingStatus.CONFIRMED:
        // Si c'est un refus de modification (rejectionReason présent)
        if (isRejection) {
          return `Demande refusée - Réservation ${reference}`;
        }
        // Si c'est un paiement supplémentaire confirmé (modificationInfo avec paymentConfirmed = true)
        if (modificationInfo?.paymentConfirmed === true) {
          return `Paiement supplémentaire confirmé - Réservation ${reference}`;
        }
        // Si c'est un paiement supplémentaire requis (modificationInfo avec additionalPaymentAmount mais pas encore confirmé)
        if (modificationInfo?.additionalPaymentAmount != null && modificationInfo.additionalPaymentAmount > 0 && !modificationInfo.paymentConfirmed) {
          return `Paiement supplémentaire requis - Réservation ${reference}`;
        }
        // Si c'est un remboursement effectué (modificationInfo avec refundAmount)
        if (modificationInfo?.refundAmount != null && modificationInfo.refundAmount > 0) {
          return `Remboursement effectué - Réservation ${reference}`;
        }
        // Si c'est une modification validée (modificationInfo présent)
        if (modificationInfo) {
          return `Demande acceptée - Réservation ${reference}`;
        }
        return `Réservation confirmée - ${reference}`;
      case BookingStatus.CANCELLED:
        return `Demande refusée - Réservation ${reference}`;
      case BookingStatus.IN_PROGRESS:
        return `Réservation mise à jour - ${reference}`;
      case BookingStatus.COMPLETED:
        return `Réservation finalisée - ${reference}`;
      default:
        return `Votre réservation ${reference} a été mise à jour`;
    }
  };

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

  const emailSubject = getEmailSubject();

  try {
    const info = await transporter.sendMail({
      from: `"CarRental" <${process.env.GMAIL_USER}>`,
      to,
      subject: emailSubject,
      html: template.html,
      text: template.text,
    });

    return { success: true, messageId: info.messageId, queued: false };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de mise à jour:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi de l'email",
    };
  }
}

interface BookingReminderEmailParams {
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

export async function sendBookingReminderEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
}: BookingReminderEmailParams) {
  if (!hasEmailCredentials) {
    console.warn(
      "⚠️  Email credentials non configurés. L'email de rappel de réservation n'a pas pu être envoyé."
    );
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

  // Utiliser la queue si Redis est disponible, sinon envoyer directement
  const useQueue = await isRedisAvailable().catch(() => false);

  if (useQueue) {
    try {
      const result = await queueBookingReminderEmail({
        to,
        name,
        greeting,
        booking,
        vehicle,
        locations,
      });
      if (result.success && result.queued) {
        return { success: true, queued: true, messageId: undefined };
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la queue, fallback vers envoi direct:", error);
    }
  }

  // Fallback vers envoi direct si la queue n'est pas disponible
  if (!transporter) {
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const dashboardUrl = `${baseUrl}/client/dashboard`;

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

  try {
    const info = await transporter.sendMail({
      from: `"CarRental" <${process.env.GMAIL_USER}>`,
      to,
      subject: `⏰ Rappel : Votre réservation ${booking.reference} approche`,
      html: template.html,
      text: template.text,
    });

    console.log("[Email] ✅ Rappel de réservation envoyé", {
      reference: booking.reference,
      to,
      messageId: info.messageId,
      queued: false,
    });

    return { success: true, messageId: info.messageId, queued: false };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de rappel:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi de l'email",
    };
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

export async function sendBookingCancellationRejectedEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
}: BookingCancellationRejectedEmailParams) {
  if (!hasEmailCredentials) {
    console.warn(
      "⚠️  Email credentials non configurés. L'email de refus d'annulation n'a pas pu être envoyé.",
    );
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

  // Utiliser la queue si Redis est disponible, sinon envoyer directement
  const useQueue = await isRedisAvailable().catch(() => false);

  if (useQueue) {
    try {
      const result = await queueBookingCancellationRejectedEmail({
        to,
        name,
        greeting,
        booking,
        vehicle,
        locations,
      });
      if (result.success && result.queued) {
        return { success: true, queued: true, messageId: undefined };
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la queue, fallback vers envoi direct:", error);
    }
  }

  // Fallback vers envoi direct si la queue n'est pas disponible
  if (!transporter) {
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

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

  try {
    const info = await transporter.sendMail({
      from: `"CarRental" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Votre demande d'annulation ${booking.reference}`,
      html: template.html,
      text: template.text,
    });

    return { success: true, messageId: info.messageId, queued: false };
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de l'email de refus d'annulation de réservation:",
      error,
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi de l'email",
    };
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
  if (!hasEmailCredentials) {
    console.warn(
      "⚠️  Email credentials non configurés. L'email de demande d'annulation n'a pas pu être envoyé.",
    );
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

  // Utiliser la queue si Redis est disponible, sinon envoyer directement
  const useQueue = await isRedisAvailable().catch(() => false);

  if (useQueue) {
    try {
      const result = await queueBookingCancellationRequestEmail({
        to,
        name,
        greeting,
        booking,
        vehicle,
        locations,
        pricing,
        policy,
      });
      if (result.success && result.queued) {
        return { success: true, queued: true, messageId: undefined };
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la queue, fallback vers envoi direct:", error);
    }
  }

  // Fallback vers envoi direct si la queue n'est pas disponible
  if (!transporter) {
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

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

  try {
    const info = await transporter.sendMail({
      from: `"CarRental" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Demande d'annulation ${booking.reference} reçue`,
      html: template.html,
      text: template.text,
    });

    return { success: true, messageId: info.messageId, queued: false };
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de l'email de demande d'annulation:",
      error,
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi de l'email",
    };
  }
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
  if (!hasEmailCredentials) {
    console.warn(
      "⚠️  Email credentials non configurés. L'email d'annulation de réservation n'a pas pu être envoyé.",
    );
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

  // Utiliser la queue si Redis est disponible, sinon envoyer directement
  const useQueue = await isRedisAvailable().catch(() => false);

  if (useQueue) {
    try {
      const result = await queueBookingCancellationEmail({
        to,
        name,
        greeting,
        booking,
        vehicle,
        locations,
        policy,
      });
      if (result.success && result.queued) {
        return { success: true, queued: true, messageId: undefined };
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la queue, fallback vers envoi direct:", error);
    }
  }

  // Fallback vers envoi direct si la queue n'est pas disponible
  if (!transporter) {
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

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

  try {
    const info = await transporter.sendMail({
      from: `"CarRental" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Annulation de votre réservation ${booking.reference}`,
      html: template.html,
      text: template.text,
    });

    return { success: true, messageId: info.messageId, queued: false };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email d'annulation de réservation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi de l'email",
    };
  }
}

interface ContactEmailParams {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/**
 * Envoie un email de confirmation à l'utilisateur après l'envoi d'une demande de contact
 */
export async function sendContactConfirmationEmail(data: ContactEmailParams) {
  if (!hasEmailCredentials) {
    console.warn(
      "⚠️  Email credentials non configurés. L'email de confirmation de contact n'a pas pu être envoyé."
    );
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

  // Utiliser la queue si Redis est disponible, sinon envoyer directement
  const useQueue = await isRedisAvailable().catch(() => false);

  if (useQueue) {
    try {
      const result = await queueContactConfirmationEmail(data);
      if (result.success && result.queued) {
        return { success: true, queued: true, messageId: undefined };
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la queue, fallback vers envoi direct:", error);
    }
  }

  // Fallback vers envoi direct si la queue n'est pas disponible
  if (!transporter) {
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

  const template = getContactConfirmationEmailTemplate(data);

  try {
    const info = await transporter.sendMail({
      from: `"CarRental" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: `Confirmation de réception - ${data.subject}`,
      html: template.html,
      text: template.text,
    });

    return { success: true, messageId: info.messageId, queued: false };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation de contact:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi de l'email",
    };
  }
}

/**
 * Envoie un email de notification à l'admin lorsqu'une nouvelle demande de contact arrive
 */
export async function sendContactNotificationEmail(data: ContactEmailParams) {
  if (!hasEmailCredentials) {
    console.warn(
      "⚠️  Email credentials non configurés. L'email de notification de contact n'a pas pu être envoyé."
    );
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

  // Utiliser la queue si Redis est disponible, sinon envoyer directement
  const useQueue = await isRedisAvailable().catch(() => false);

  if (useQueue) {
    try {
      const result = await queueContactNotificationEmail(data);
      if (result.success && result.queued) {
        return { success: true, queued: true, messageId: undefined };
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la queue, fallback vers envoi direct:", error);
    }
  }

  // Fallback vers envoi direct si la queue n'est pas disponible
  if (!transporter) {
    return {
      success: false,
      skipped: true,
      error: "Configuration email manquante",
    };
  }

  const template = getContactNotificationEmailTemplate(data);
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER || "admin@carrental.fr";

  try {
    const info = await transporter.sendMail({
      from: `"CarRental" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `Nouvelle demande de contact - ${data.subject}`,
      html: template.html,
      text: template.text,
      replyTo: data.email,
    });

    return { success: true, messageId: info.messageId, queued: false };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de notification de contact:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi de l'email",
    };
  }
}

interface InvoiceEmailParams {
  to: string;
  name: string;
  invoiceNumber: string;
  bookingReference: string;
  pdfBuffer?: Buffer;
}

export async function sendInvoiceEmail({
  to,
  name,
  invoiceNumber,
  bookingReference,
  pdfBuffer,
}: InvoiceEmailParams): Promise<{ success: boolean; messageId?: string; queued: boolean; error?: string; skipped?: boolean }> {
  if (!hasEmailCredentials) {
    console.warn(
      "⚠️  Email credentials non configurés. L'email de facture n'a pas pu être envoyé."
    );
    return {
      success: false,
      skipped: true,
      queued: false,
      error: "Configuration email manquante",
    };
  }

  // Utiliser la queue si Redis est disponible, sinon envoyer directement
  const useQueue = await isRedisAvailable().catch(() => false);

  if (useQueue) {
    // TODO: Implémenter queueInvoiceEmail si nécessaire
    // Pour l'instant, on envoie directement
  }

  // Fallback vers envoi direct si la queue n'est pas disponible
  if (!transporter) {
    return {
      success: false,
      skipped: true,
      queued: false,
      error: "Configuration email manquante",
    };
  }

  const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";

  const template = getInvoiceEmailTemplate({
    greeting,
    name,
    invoiceNumber,
    bookingReference,
  });

  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"CarRental" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Facture ${invoiceNumber} - CarRental`,
      html: template.html,
      text: template.text,
    };

    // Ajouter le PDF en pièce jointe si disponible
    if (pdfBuffer) {
      mailOptions.attachments = [
        {
          filename: `Facture_${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
    }

    const info = await transporter.sendMail(mailOptions);

    return { success: true, messageId: info.messageId, queued: false };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de facture:", error);
    return {
      success: false,
      queued: false,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi de l'email",
    };
  }
}

