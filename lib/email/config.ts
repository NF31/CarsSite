import nodemailer from "nodemailer";

// Vérifier si les credentials email sont configurés
export const hasEmailCredentials =
  process.env.GMAIL_USER && process.env.GMAIL_PASSWORD;

export const transporter = hasEmailCredentials
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

export function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export function getFromAddress(): string {
  return `"CarRental" <${process.env.GMAIL_USER}>`;
}

