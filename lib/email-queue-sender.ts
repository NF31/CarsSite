import { addEmailToQueue, EmailJobData } from "./email-queue";
import { getVerificationEmailTemplate } from "./templates/verification-email";
import { getPasswordResetEmailTemplate } from "./templates/password-reset-email";
import { getAccountDeletionEmailTemplate } from "./templates/account-deletion-email";
import { getBookingConfirmationEmailTemplate } from "./templates/booking-confirmation-email";
import { getBookingUpdateEmailTemplate } from "./templates/booking-update-email";
import { getBookingCancellationEmailTemplate } from "./templates/booking-cancellation-email";
import { getBookingCancellationRejectedEmailTemplate } from "./templates/booking-cancellation-rejected-email";
import { getBookingCancellationRequestEmailTemplate } from "./templates/booking-cancellation-request-email";
import { getContactConfirmationEmailTemplate, getContactNotificationEmailTemplate } from "./templates/contact-email";
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
        securityDeposit: booking.securityDepositPaid, // Passer la caution si elle a été payée
      },
      status: {
        label: statusLabels[bookingStatus],
        textColor: statusColors[bookingStatus].text,
        backgroundColor: statusColors[bookingStatus].background,
      },
      dashboardUrl,
    });

    // Convertir les attachments en base64 pour le stockage dans Redis
    const attachmentsBase64 = attachments?.map((att) => ({
      filename: att.filename,
      contentBase64: att.content.toString("base64"),
      contentType: att.contentType || "application/pdf",
    }));

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

    return { success: true, queued: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'email de confirmation à la queue:", error);
    return { success: false, queued: false };
  }
}

export interface BookingUpdateEmailParams {
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
}: BookingUpdateEmailParams): Promise<{ success: boolean; queued: boolean }> {
  try {
    // Log pour déboguer modificationInfo
    console.log(`\n📧 [Queue Booking Update Email] ==========================================`);
    console.log(`📧 [Queue Booking Update Email] modificationInfo reçu: ${modificationInfo ? "OUI" : "NON"}`);
    if (modificationInfo) {
      console.log(`📧 [Queue Booking Update Email] Détails de modificationInfo:`);
      console.log(`   ${JSON.stringify(modificationInfo, null, 2)}`);
    }
    console.log(`📧 [Queue Booking Update Email] ==========================================\n`);

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const dashboardUrl = `${baseUrl}/client/dashboard`;

    const bookingStatus = booking.status ?? BookingStatus.PENDING;

    // Détecter si c'est un refus de modification (rejectionReason présent)
    const isRejection = rejectionReason != null && rejectionReason.trim() !== "";
    
    // Log pour déboguer
    console.log(`\n📧 [Queue Email] Détection de refus:`);
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

    // Log avant génération du template
    console.log(`\n📧 [Queue Booking Update Email] Génération du template...`);
    console.log(`📧 [Queue Booking Update Email] modificationInfo passé au template: ${modificationInfo ? "OUI" : "NON"}`);
    if (modificationInfo) {
      console.log(`📧 [Queue Booking Update Email] Contenu de modificationInfo:`);
      console.log(`   - originalTotalPrice: ${modificationInfo.originalTotalPrice ?? "undefined"}`);
      console.log(`   - originalDepositPaid: ${modificationInfo.originalDepositPaid ?? "undefined"}`);
      console.log(`   - depositDifference: ${modificationInfo.depositDifference ?? "undefined"}`);
      console.log(`   - originalRemainingAmount: ${modificationInfo.originalRemainingAmount ?? "undefined"}`);
    }

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

    // Log pour vérifier que le HTML contient la section "Comparaison des prix"
    if (modificationInfo) {
      const htmlContainsComparison = template.html.includes("Comparaison des prix");
      const htmlContainsPaymentButton = modificationInfo.paymentUrl && template.html.includes("Payer maintenant");
      const htmlContainsRefund = template.html.includes("Remboursement");
      const depositDiff = modificationInfo.depositDifference ?? 0;
      const isRefund = depositDiff < 0;
      
      // Formater le montant pour la recherche dans le HTML
      const refundAmountFormatted = modificationInfo.refundAmount 
        ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(modificationInfo.refundAmount)
        : null;
      const htmlContainsRefundAmount = refundAmountFormatted && template.html.includes(refundAmountFormatted);
      
      console.log(`\n📧 [Queue Booking Update Email] Vérification du HTML généré:`);
      console.log(`   - HTML contient "Comparaison des prix": ${htmlContainsComparison ? "✅ OUI" : "❌ NON"}`);
      console.log(`   - HTML contient "Payer maintenant": ${htmlContainsPaymentButton ? "✅ OUI" : "❌ NON"}`);
      console.log(`   - HTML contient "Remboursement": ${htmlContainsRefund ? "✅ OUI" : "❌ NON"}`);
      if (isRefund) {
        console.log(`   - C'est un remboursement (depositDiff: ${depositDiff}€)`);
        console.log(`   - refundAmount: ${modificationInfo.refundAmount ?? "N/A"}€`);
        console.log(`   - refundAmountFormatted: ${refundAmountFormatted ?? "N/A"}`);
        console.log(`   - HTML contient le montant de remboursement: ${htmlContainsRefundAmount ? "✅ OUI" : "❌ NON"}`);
      }
      if (!htmlContainsComparison) {
        console.warn(`   ⚠️  PROBLÈME: La section "Comparaison des prix" n'est pas dans le HTML généré !`);
        console.warn(`   - hasModificationInfo devrait être true dans le template`);
        console.warn(`   - modificationInfo: ${JSON.stringify(modificationInfo, null, 2)}`);
      }
      if (isRefund && !htmlContainsRefund) {
        console.warn(`   ⚠️  PROBLÈME: Le message de remboursement n'est pas dans le HTML généré !`);
        console.warn(`   - depositDiff: ${depositDiff}€`);
        console.warn(`   - refundAmount: ${modificationInfo.refundAmount ?? "N/A"}€`);
      }
    }

    const emailSubject = getEmailSubject();

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

interface ContactEmailParams {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/**
 * Ajoute un email de confirmation de contact à la queue
 */
export async function queueContactConfirmationEmail(
  data: ContactEmailParams
): Promise<{ success: boolean; queued: boolean }> {
  try {
    const template = getContactConfirmationEmailTemplate(data);

    await addEmailToQueue({
      type: "contact-confirmation",
      to: data.email,
      subject: `Confirmation de réception - ${data.subject}`,
      html: template.html,
      text: template.text,
      metadata: {
        name: data.name,
        subject: data.subject,
      },
    });

    return { success: true, queued: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'email de confirmation de contact à la queue:", error);
    return { success: false, queued: false };
  }
}

/**
 * Ajoute un email de notification de contact à la queue (pour l'admin)
 */
export async function queueContactNotificationEmail(
  data: ContactEmailParams
): Promise<{ success: boolean; queued: boolean }> {
  try {
    const template = getContactNotificationEmailTemplate(data);
    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER || "admin@carrental.fr";

    await addEmailToQueue({
      type: "contact-notification",
      to: adminEmail,
      subject: `Nouvelle demande de contact - ${data.subject}`,
      html: template.html,
      text: template.text,
      metadata: {
        contactName: data.name,
        contactEmail: data.email,
        subject: data.subject,
      },
      replyTo: data.email,
    });

    return { success: true, queued: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'email de notification de contact à la queue:", error);
    return { success: false, queued: false };
  }
}

