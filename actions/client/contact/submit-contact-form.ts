"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const contactFormSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  subject: z.string().min(5, "Le sujet doit contenir au moins 5 caractères"),
  message: z.string().min(20, "Le message doit contenir au moins 20 caractères").max(1000, "Le message ne peut pas dépasser 1000 caractères"),
});

export interface SubmitContactFormInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface SubmitContactFormResult {
  success: boolean;
  error?: string;
}

/**
 * Soumet un formulaire de contact
 */
export async function submitContactFormAction(
  input: SubmitContactFormInput
): Promise<SubmitContactFormResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Authentification requise.",
      };
    }

    // Validation des données
    const validationResult = contactFormSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return {
        success: false,
        error: firstError?.message || "Données invalides.",
      };
    }

    const { name, email, phone, subject, message } = validationResult.data;

    // Enregistrer le message de contact dans la base de données
    // Note: Vous pouvez créer une table `ContactMessage` dans Prisma si nécessaire
    // Pour l'instant, on log juste pour démonstration
    console.log("[Contact Form] Nouveau message reçu:", {
      userId: session.user.id,
      name,
      email,
      phone,
      subject,
      message: message.substring(0, 100) + "...", // Log tronqué pour la confidentialité
      timestamp: new Date().toISOString(),
    });

    // TODO: Implémenter l'envoi d'email via un service d'email (Resend, SendGrid, etc.)
    // TODO: Sauvegarder dans une table `ContactMessage` si nécessaire

    return {
      success: true,
    };
  } catch (error) {
    console.error("[Contact Form] Erreur lors de la soumission:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue lors de l'envoi du message.",
    };
  }
}

