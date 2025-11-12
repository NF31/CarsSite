"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createServiceSchema,
  type CreateServiceInput,
} from "@/lib/validations/service";

export interface CreateServiceResult {
  success: boolean;
  data?: {
    id: string;
    name: string;
  };
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createServiceAction(
  input: CreateServiceInput
): Promise<CreateServiceResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour créer un service.",
      };
    }

    const validation = createServiceSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = validation.data;

    const existingService = await prisma.service.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });

    if (existingService) {
      return {
        success: false,
        error: "Un service portant ce nom existe déjà.",
        fieldErrors: {
          name: ["Un service portant ce nom existe déjà"],
        },
      };
    }

    const created = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        pricingType: data.pricingType,
        availableForCategories: data.availableForCategories ?? [],
        icon: data.icon ?? null,
        active: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Invalider le cache des services
    const { invalidateServicesCache } = await import("@/lib/cache-invalidation");
    await invalidateServicesCache().catch((error) => {
      console.error("Error invalidating services cache:", error);
    });

    return {
      success: true,
      data: created,
    };
  } catch (error) {
    console.error("Error creating service:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la création du service.",
    };
  }
}

