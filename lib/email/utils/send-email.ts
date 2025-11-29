import type { SendMailOptions } from "nodemailer";
import { transporter, getFromAddress } from "../config";

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  queued: boolean;
  skipped?: boolean;
  error?: string;
}

export async function sendEmailDirectly(
  mailOptions: SendMailOptions
): Promise<SendEmailResult> {
  if (!transporter) {
    return {
      success: false,
      skipped: true,
      queued: false,
      error: "Transporter email non initialisé",
    };
  }

  // Ensure from address is set
  if (!mailOptions.from) {
    mailOptions.from = getFromAddress();
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId, queued: false };
  } catch (error) {
    return {
      success: false,
      queued: false,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi de l'email",
    };
  }
}

