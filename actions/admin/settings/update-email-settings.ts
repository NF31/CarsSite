"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSettingMeta } from "./shared";
import type { AdminSettingKey } from "./shared";
import { z } from "zod";

const emailSettingsSchema = z.object({
  smtpFromName: z
    .string()
    .trim()
    .min(2, { message: "Le nom de l'expéditeur doit contenir au moins 2 caractères." }),
  smtpFromEmail: z.string().trim().email({ message: "Adresse email de l'expéditeur invalide." }),
  bookingConfirmation: z.boolean(),
  bookingReminder: z.boolean(),
  paymentConfirmation: z.boolean(),
  cancellationNotification: z.boolean(),
});

export type UpdateEmailSettingsInput = z.infer<typeof emailSettingsSchema>;

export interface UpdateEmailSettingsResult {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  status?: number;
}

export async function updateEmailSettingsAction(
  input: UpdateEmailSettingsInput,
): Promise<UpdateEmailSettingsResult> {
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

    const parsed = emailSettingsSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        status: 400,
      };
    }

    const data = parsed.data;

    const updates: Array<[AdminSettingKey, string | boolean | Record<string, boolean>]> = [
      ["email.smtp.fromName", data.smtpFromName],
      ["email.smtp.fromEmail", data.smtpFromEmail],
      ["email.notifications", {
        bookingConfirmation: data.bookingConfirmation,
        bookingReminder: data.bookingReminder,
        paymentConfirmation: data.paymentConfirmation,
        cancellationNotification: data.cancellationNotification,
      }],
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

    return {
      success: true,
      message: "Paramètres d'envoi mis à jour avec succès.",
    };
  } catch (error) {
    console.error("Admin settings - update email error:", error);

    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour des paramètres d'email.",
      status: 500,
    };
  }
}


