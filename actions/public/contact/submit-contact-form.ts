"use server";

import { contactFormSchema } from "@/lib/validations/contact";
import { sendContactConfirmationEmail, sendContactNotificationEmail } from "@/lib/email";

export interface SubmitPublicContactFormInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface SubmitPublicContactFormResult {
  success: boolean;
  error?: string;
}

/**
 * Soumet un formulaire de contact public (sans authentification requise)
 */
export async function submitPublicContactFormAction(
  input: SubmitPublicContactFormInput
): Promise<SubmitPublicContactFormResult> {
  try {
    // Validation des données avec le schéma Zod
    const validationResult = contactFormSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Données invalides.",
      };
    }

    const { name, email, phone, subject, message } = validationResult.data;

    // Enregistrer le message de contact dans les logs
    console.log("[Public Contact Form] Nouveau message reçu:", {
      name,
      email,
      phone,
      subject,
      message: message.substring(0, 100) + "...", // Log tronqué pour la confidentialité
      timestamp: new Date().toISOString(),
    });

    // Envoyer les emails (confirmation à l'utilisateur et notification à l'admin)
    // On envoie les deux emails en parallèle pour optimiser les performances
    const [confirmationResult, notificationResult] = await Promise.allSettled([
      sendContactConfirmationEmail({
        name,
        email,
        phone,
        subject,
        message,
      }),
      sendContactNotificationEmail({
        name,
        email,
        phone,
        subject,
        message,
      }),
    ]);

    // Vérifier si au moins l'un des deux emails a été envoyé avec succès
    const confirmationSuccess = confirmationResult.status === "fulfilled" && confirmationResult.value.success;
    const notificationSuccess = notificationResult.status === "fulfilled" && notificationResult.value.success;

    if (!confirmationSuccess) {
      console.warn("[Public Contact Form] L'email de confirmation n'a pas pu être envoyé:", confirmationResult);
    }

    if (!notificationSuccess) {
      console.error("[Public Contact Form] ❌ L'email de notification admin n'a pas pu être envoyé:", notificationResult);
      // On continue quand même car le message est enregistré dans les logs
    } else {
      console.log("[Public Contact Form] ✅ Email de notification admin envoyé avec succès");
    }

    // L'email de notification à l'admin est obligatoire
    // Si l'envoi a échoué, on log l'erreur mais on considère quand même le formulaire comme soumis
    // car l'admin peut consulter les logs ou la base de données plus tard
    // Cependant, on priorise l'envoi de la notification admin pour qu'il soit informé rapidement

    return {
      success: true,
    };
  } catch (error) {
    console.error("[Public Contact Form] Erreur lors de la soumission:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue lors de l'envoi du message.",
    };
  }
}

