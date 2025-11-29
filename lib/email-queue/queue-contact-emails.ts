import { addEmailToQueue } from "../email-queue";
import { getContactConfirmationEmailTemplate, getContactNotificationEmailTemplate } from "../templates/contact-email";
import { withQueueErrorHandling, getAdminEmail } from "./utils/helpers";
import type { ContactEmailParams, QueueEmailResult } from "./types";

/**
 * Ajoute un email de confirmation de contact à la queue
 */
export async function queueContactConfirmationEmail(
  data: ContactEmailParams
): Promise<QueueEmailResult> {
  return withQueueErrorHandling(async () => {
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
  }, "Erreur lors de l'ajout de l'email de confirmation de contact à la queue:");
}

/**
 * Ajoute un email de notification de contact à la queue (pour l'admin)
 */
export async function queueContactNotificationEmail(
  data: ContactEmailParams
): Promise<QueueEmailResult> {
  return withQueueErrorHandling(async () => {
    const template = getContactNotificationEmailTemplate(data);
    const adminEmail = getAdminEmail();

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
        replyTo: data.email,
      },
    });
  }, "Erreur lors de l'ajout de l'email de notification de contact à la queue:");
}

