import { z } from "zod";

/**
 * Schéma de validation pour le formulaire de contact
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes")
    .trim(),
  
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Email invalide")
    .max(255, "L'email ne peut pas dépasser 255 caractères")
    .toLowerCase()
    .trim(),
  
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true; // Optionnel
        // Format français: +33 6 12 34 56 78, 06 12 34 56 78, 0612345678, etc.
        const phoneRegex = /^(?:(?:\+|00)33|0)[1-9](?:[\s.-]?\d{2}){4}$/;
        return phoneRegex.test(val.replace(/\s/g, ""));
      },
      {
        message: "Format de téléphone invalide. Utilisez un format français (ex: +33 6 12 34 56 78 ou 06 12 34 56 78)",
      }
    )
    .transform((val) => (val?.trim() || undefined)),
  
  subject: z
    .string()
    .min(1, "Le sujet est requis")
    .min(5, "Le sujet doit contenir au moins 5 caractères")
    .max(200, "Le sujet ne peut pas dépasser 200 caractères")
    .trim(),
  
  message: z
    .string()
    .min(1, "Le message est requis")
    .min(20, "Le message doit contenir au moins 20 caractères")
    .max(1000, "Le message ne peut pas dépasser 1000 caractères")
    .trim(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

