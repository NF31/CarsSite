"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSettingMeta } from "./shared";
import type { AdminSettingKey } from "./shared";
import { z } from "zod";

const finiteNumber = (value: number) => Number.isFinite(value);

const configurationSettingsSchema = z.object({
  currency: z.string().trim().min(1, { message: "La devise est requise." }),
  language: z
    .string()
    .trim()
    .min(2, { message: "La langue doit contenir au moins 2 caractères." }),
  timezone: z
    .string()
    .trim()
    .min(2, { message: "Le fuseau horaire doit contenir au moins 2 caractères." }),
  cancellationPolicy: z
    .string()
    .trim()
    .min(10, {
      message: "La politique d'annulation doit contenir au moins 10 caractères.",
    }),
  taxRate: z.coerce
    .number({ message: "Le taux de TVA doit être un nombre." })
    .refine(finiteNumber, { message: "Le taux de TVA doit être un nombre valide." })
    .min(0, { message: "Le taux de TVA ne peut pas être négatif." })
    .max(100, { message: "Le taux de TVA ne peut pas dépasser 100%." }),
  deposit: z.coerce
    .number({ message: "Le dépôt de garantie doit être un nombre." })
    .refine(finiteNumber, {
      message: "Le dépôt de garantie doit être un nombre valide.",
    })
    .min(0, { message: "Le dépôt de garantie ne peut pas être négatif." }),
  serviceFee: z.coerce
    .number({ message: "Les frais de service doivent être un nombre." })
    .refine(finiteNumber, { message: "Les frais de service doivent être un nombre valide." })
    .min(0, { message: "Les frais de service ne peuvent pas être négatifs." }),
});

export type UpdateConfigurationSettingsInput = z.infer<typeof configurationSettingsSchema>;

export interface UpdateConfigurationSettingsResult {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  status?: number;
}

export async function updateConfigurationSettingsAction(
  input: UpdateConfigurationSettingsInput,
): Promise<UpdateConfigurationSettingsResult> {
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

    const parsed = configurationSettingsSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        status: 400,
      };
    }

    const data = parsed.data;

    const updates: Array<[AdminSettingKey, string | number]> = [
      ["config.currency", data.currency],
      ["config.language", data.language],
      ["config.timezone", data.timezone],
      ["config.cancellationPolicy", data.cancellationPolicy],
      ["config.taxRate", data.taxRate],
      ["config.deposit", data.deposit],
      ["config.serviceFee", data.serviceFee],
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
      message: "Configuration générale mise à jour avec succès.",
    };
  } catch (error) {
    console.error("Admin settings - update configuration error:", error);

    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour de la configuration.",
      status: 500,
    };
  }
}


