import nodemailer from "nodemailer";
import { getVerificationEmailTemplate } from "./templates/verification-email";
import { getPasswordResetEmailTemplate } from "./templates/password-reset-email";

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

