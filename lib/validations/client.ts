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

const normalizePhone = (value?: string | null) => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed.replace(/\s+/g, " ");
};

export const updateClientSchema = z
  .object({
    name: quickClientSchema.shape.name,
    email: quickClientSchema.shape.email,
    phone: z
      .string()
      .optional()
      .transform((value) => normalizePhone(value)),
    status: z.enum(["active", "inactive", "locked"]),
    lockedUntil: z
      .union([z.string(), z.date(), z.null(), z.undefined()])
      .optional()
      .transform((value) => {
        if (value === null || value === undefined) {
          return null;
        }
        const parsed =
          typeof value === "string"
            ? value.trim().length === 0
              ? null
              : new Date(value)
            : value instanceof Date
            ? value
            : null;
        if (!parsed) {
          return null;
        }
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }),
  })
  .refine(
    (data) => {
      if (data.status !== "locked") {
        return true;
      }
      return data.lockedUntil instanceof Date;
    },
    {
      message: "Veuillez préciser une date de déverrouillage.",
      path: ["lockedUntil"],
    }
  )
  .refine(
    (data) => {
      if (!data.lockedUntil) {
        return true;
      }
      return data.lockedUntil.getTime() > Date.now();
    },
    {
      message: "La date de déverrouillage doit être dans le futur.",
      path: ["lockedUntil"],
    }
  );

export type UpdateClientInput = z.infer<typeof updateClientSchema>;



