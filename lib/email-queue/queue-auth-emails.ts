import { addEmailToQueue } from "../email-queue";
import { getVerificationEmailTemplate } from "../templates/verification-email";
import { getPasswordResetEmailTemplate } from "../templates/password-reset-email";
import { getAccountDeletionEmailTemplate } from "../templates/account-deletion-email";
import { getBaseUrl, withQueueErrorHandling } from "./utils/helpers";
import type { QueueEmailResult } from "./types";

/**
 * Ajoute un email de vérification à la queue
 */
export async function queueVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<QueueEmailResult> {
  return withQueueErrorHandling(async () => {
    const verificationUrl = `${getBaseUrl()}/verify-email?token=${token}`;
    const template = getVerificationEmailTemplate({
      name,
      verificationUrl,
    });

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
  }, "Erreur lors de l'ajout de l'email de vérification à la queue:");
}

/**
 * Ajoute un email de réinitialisation de mot de passe à la queue
 */
export async function queuePasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<QueueEmailResult> {
  return withQueueErrorHandling(async () => {
    const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;
    const template = getPasswordResetEmailTemplate({
      name,
      resetUrl,
    });

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
  }, "Erreur lors de l'ajout de l'email de réinitialisation à la queue:");
}

/**
 * Ajoute un email de suppression de compte à la queue
 */
export async function queueAccountDeletionEmail(
  email: string,
  name: string,
  token: string
): Promise<QueueEmailResult> {
  return withQueueErrorHandling(async () => {
    const confirmationUrl = `${getBaseUrl()}/confirm-account-deletion?token=${token}`;
    const template = getAccountDeletionEmailTemplate({
      name,
      confirmationUrl,
    });

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
  }, "Erreur lors de l'ajout de l'email de suppression à la queue:");
}

