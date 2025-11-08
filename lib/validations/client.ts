import { z } from "zod";

export const quickClientSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(80, "Le nom est trop long")
    .transform((value) => value.trim()),
  email: z
    .string()
    .email("Adresse email invalide")
    .transform((value) => value.trim().toLowerCase()),
  phone: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) {
        return undefined;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }),
  sendInvitation: z.boolean().optional().default(false),
});

export type QuickClientInput = z.infer<typeof quickClientSchema>;



