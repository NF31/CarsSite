"use server";

import { auth } from "@/auth";
import prisma from '@/lib/prisma'
import { getSettingMeta } from "./shared";
import type { AdminSettingKey } from "./shared";
import { z } from "zod";

const phoneRegex = /^[0-9+\s().-]{5,}$/;

const agencySettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Le nom de l'agence doit contenir au moins 2 caractères." }),
  logoUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .refine(
      (value) => {
        if (!value) {
          return true;
        }
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: "L'URL du logo est invalide." },
    ),
  address: z
    .string()
    .trim()
    .min(5, { message: "L'adresse doit contenir au moins 5 caractères." }),
  phone: z
    .string()
    .trim()
    .refine((value) => phoneRegex.test(value), {
      message: "Format de numéro de téléphone invalide.",
    }),
  email: z.string().trim().email({ message: "Adresse email invalide." }),
  openingHours: z
    .string()
    .trim()
    .min(5, {
      message: "Les horaires d'ouverture doivent contenir au moins 5 caractères.",
    }),
});

export type UpdateAgencySettingsInput = z.infer<typeof agencySettingsSchema>;

export interface UpdateAgencySettingsResult {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  status?: number;
}

export async function updateAgencySettingsAction(
  input: UpdateAgencySettingsInput,
): Promise<UpdateAgencySettingsResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Non autorisé",
        status: 401,
      };
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Accès refusé",
        status: 403,
      };
    }

    const parsed = agencySettingsSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        status: 400,
      };
    }

    const data = parsed.data;

    const updates: Array<[AdminSettingKey, string]> = [
      ["agency.name", data.name],
      ["agency.logoUrl", data.logoUrl],
      ["agency.address", data.address],
      ["agency.phone", data.phone],
      ["agency.email", data.email],
      ["agency.openingHours", data.openingHours],
    ];

    await prisma.$transaction(
      updates.map(([key, value]) => {
        const meta = getSettingMeta(key);

        return prisma.setting.upsert({
          where: { key },
          update: {
            value,
            category: meta.category,
            description: meta.description,
          },
          create: {
            key,
            value,
            category: meta.category,
            description: meta.description,
          },
        });
      }),
    );

    // Invalider le cache des settings
    const { invalidateSettingsCache } = await import("@/lib/cache-invalidation");
    await invalidateSettingsCache().catch((error) => {
      console.error("Error invalidating settings cache:", error);
    });

    return {
      success: true,
      message: "Informations de l'agence mises à jour avec succès.",
    };
  } catch (error) {
    console.error("Admin settings - update agency error:", error);

    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour des informations de l'agence.",
      status: 500,
    };
  }
}


