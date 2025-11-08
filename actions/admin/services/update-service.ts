"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createServiceSchema } from "@/lib/validations/service";
import type { CreateServiceInput } from "@/lib/validations/service";

export interface UpdateServiceInput extends CreateServiceInput {
  active: boolean;
}

export interface UpdateServiceResult {
  success: boolean;
  data?: {
    id: string;
    name: string;
    active: boolean;
  };
  error?: string;
  fieldErrors?: Record<string, string[]>;
  status?: number;
}

export async function updateServiceAction(
  id: string,
  input: UpdateServiceInput,
): Promise<UpdateServiceResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour modifier ce service.",
        status: 403,
      };
    }

    if (!id || typeof id !== "string") {
      return {
        success: false,
        error: "Identifiant de service invalide.",
        status: 400,
      };
    }

    const parsed = createServiceSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        status: 400,
      };
    }

    const data = parsed.data;
    const active = Boolean(input.active);

    const existingService = await prisma.service.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingService) {
      return {
        success: false,
        error: "Service introuvable.",
        status: 404,
      };
    }

    const conflictingService = await prisma.service.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: "insensitive",
        },
        NOT: {
          id,
        },
      },
      select: { id: true },
    });

    if (conflictingService) {
      return {
        success: false,
        error: "Un autre service porte déjà ce nom.",
        fieldErrors: {
          name: ["Un autre service porte déjà ce nom"],
        },
        status: 409,
      };
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        pricingType: data.pricingType,
        availableForCategories: data.availableForCategories ?? [],
        icon: data.icon ?? null,
        active,
      },
      select: {
        id: true,
        name: true,
        active: true,
      },
    });

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Error updating service:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour du service.",
      status: 500,
    };
  }
}


