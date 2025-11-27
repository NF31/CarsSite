import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  phone: z
    .union([
      z
        .string()
        .min(10, "Le numéro doit contenir au moins 10 chiffres")
        .max(20, "Le numéro est trop long (maximum 20 caractères)")
        .regex(
          /^[\+]?[0-9]{1,4}[\s\-\.]?[0-9]{1,4}[\s\-\.]?[0-9]{1,4}[\s\-\.]?[0-9]{1,4}[\s\-\.]?[0-9]{1,9}$/,
          "Format de téléphone invalide"
        )
        .refine(
          (val) => {
            // Extraire uniquement les chiffres
            const digits = val.replace(/\D/g, "");
            // Numéro français : 10 chiffres (0612345678) ou 13 avec indicatif (+33612345678)
            // International : max 15 chiffres selon E.164
            return digits.length >= 10 && digits.length <= 15;
          },
          "Le numéro doit contenir entre 10 et 15 chiffres"
        )
        .refine(
          (val) => {
            // Vérifier qu'il n'y a pas que des chiffres identiques (souvent erreur)
            const digits = val.replace(/\D/g, "");
            const uniqueDigits = new Set(digits).size;
            return uniqueDigits > 1;
          },
          "Le numéro semble invalide"
        ),
      z.literal(""),
    ])
    .optional(),
  image: z.string().url("URL invalide").optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial"),
  confirmPassword: z.string().min(1, "La confirmation est requise"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Le mot de passe est requis pour confirmer la suppression"),
  confirmText: z.string(),
}).refine((data) => data.confirmText === "SUPPRIMER", {
  message: "Vous devez taper 'SUPPRIMER' pour confirmer",
  path: ["confirmText"],
});

