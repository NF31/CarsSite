import { getContactConfirmationEmailTemplate, getContactNotificationEmailTemplate } from "@/lib/templates/contact-email";
import { queueContactConfirmationEmail, queueContactNotificationEmail } from "@/lib/email-queue-sender";
import { getFromAddress } from "../config";
import { sendEmailWithQueue } from "../utils";
import type { ContactEmailParams } from "../types";

export async function sendContactConfirmationEmail(data: ContactEmailParams) {
  const template = getContactConfirmationEmailTemplate(data);

  return await sendEmailWithQueue({
    mailOptions: {
      from: getFromAddress(),
      to: data.email,
      subject: `Confirmation de réception - ${data.subject}`,
      html: template.html,
      text: template.text,
    },
    queueFunction: () => queueContactConfirmationEmail(data),
    skipIfNoCredentials: true,
  });
}

export async function sendContactNotificationEmail(data: ContactEmailParams) {
  const template = getContactNotificationEmailTemplate(data);
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER || "admin@carrental.fr";

  return await sendEmailWithQueue({
    mailOptions: {
      from: getFromAddress(),
      to: adminEmail,
      subject: `Nouvelle demande de contact - ${data.subject}`,
      html: template.html,
      text: template.text,
      replyTo: data.email,
    },
    queueFunction: () => queueContactNotificationEmail(data),
    skipIfNoCredentials: true,
  });
}

