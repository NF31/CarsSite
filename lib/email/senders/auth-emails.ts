import { getVerificationEmailTemplate } from "@/lib/templates/verification-email";
import { getPasswordResetEmailTemplate } from "@/lib/templates/password-reset-email";
import { getAccountDeletionEmailTemplate } from "@/lib/templates/account-deletion-email";
import { getBaseUrl, getFromAddress } from "../config";
import { sendEmailWithQueue } from "../utils";
import {
  queueVerificationEmail,
  queuePasswordResetEmail,
  queueAccountDeletionEmail,
} from "@/lib/email-queue-sender";

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verificationUrl = `${getBaseUrl()}/verify-email?token=${token}`;
  const template = getVerificationEmailTemplate({
    name,
    verificationUrl,
  });

  return await sendEmailWithQueue({
    mailOptions: {
      from: getFromAddress(),
      to: email,
      subject: "Vérifiez votre adresse email - CarRental",
      html: template.html,
      text: template.text,
    },
    queueFunction: () => queueVerificationEmail(email, name, token),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;
  const template = getPasswordResetEmailTemplate({
    name,
    resetUrl,
  });

  return await sendEmailWithQueue({
    mailOptions: {
      from: getFromAddress(),
      to: email,
      subject: "Réinitialisation de votre mot de passe - CarRental",
      html: template.html,
    },
    queueFunction: () => queuePasswordResetEmail(email, name, token),
  });
}

export async function sendAccountDeletionEmail(
  email: string,
  name: string,
  token: string
) {
  const confirmationUrl = `${getBaseUrl()}/confirm-account-deletion?token=${token}`;
  const template = getAccountDeletionEmailTemplate({
    name,
    confirmationUrl,
  });

  return await sendEmailWithQueue({
    mailOptions: {
      from: getFromAddress(),
      to: email,
      subject: "Confirmation de suppression de compte - CarRental",
      html: template.html,
    },
    queueFunction: () => queueAccountDeletionEmail(email, name, token),
  });
}

