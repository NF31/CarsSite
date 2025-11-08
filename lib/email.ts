import nodemailer from "nodemailer";
import { getVerificationEmailTemplate } from "./templates/verification-email";
import { getPasswordResetEmailTemplate } from "./templates/password-reset-email";
import { getAccountDeletionEmailTemplate } from "./templates/account-deletion-email";
import { getBookingConfirmationEmailTemplate } from "./templates/booking-confirmation-email";
import { BookingStatus } from "@prisma/client";

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
    return { success: true, messageId: info.messageId };
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
    return { success: true, messageId: info.messageId };
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
    return { success: true, messageId: info.messageId };
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

export async function sendBookingConfirmationEmail({
  to,
  name,
  greeting,
  booking,
  vehicle,
  locations,
}: BookingConfirmationEmailParams) {
  if (!hasEmailCredentials || !transporter) {
    console.warn(
      "⚠️  Email credentials non configurés. L'email de confirmation de réservation n'a pas pu être envoyé."
    );
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
    },
    status: {
      label: statusLabels[bookingStatus],
      textColor: statusColors[bookingStatus].text,
      backgroundColor: statusColors[bookingStatus].background,
    },
    dashboardUrl,
  });

  try {
    const info = await transporter.sendMail({
      from: `"CarRental" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Confirmation de réservation ${booking.reference}`,
      html: template.html,
      text: template.text,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi de l'email",
    };
  }
}

