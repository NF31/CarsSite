import type { SendMailOptions } from "nodemailer";
import { hasEmailCredentials, transporter, getFromAddress } from "../config";
import { tryQueueEmail, type QueueResult } from "./queue-handler";
import { sendEmailDirectly, type SendEmailResult } from "./send-email";

export interface EmailSendOptions {
  mailOptions: SendMailOptions;
  queueFunction?: () => Promise<QueueResult>;
  skipIfNoCredentials?: boolean;
}

export async function sendEmailWithQueue({
  mailOptions,
  queueFunction,
  skipIfNoCredentials = false,
}: EmailSendOptions): Promise<SendEmailResult> {
  // Vérifier si les credentials sont configurés
  if (!hasEmailCredentials) {
    if (skipIfNoCredentials) {
      return {
        success: false,
        skipped: true,
        queued: false,
        error: "Configuration email manquante",
      };
    }
    throw new Error(
      "Configuration email manquante. Veuillez configurer GMAIL_USER et GMAIL_PASSWORD dans votre fichier .env"
    );
  }

  // Essayer d'utiliser la queue si disponible
  if (queueFunction) {
    const queueResult = await tryQueueEmail(queueFunction);
    if (queueResult) {
      return queueResult;
    }
  }

  // Fallback vers envoi direct
  return await sendEmailDirectly(mailOptions);
}

