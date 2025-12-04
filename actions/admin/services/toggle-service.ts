"use server";

import { auth } from "@/auth";
import prisma from '@/lib/prisma'
import { redirect } from "next/navigation";

export interface ToggleServiceResult {
  success: boolean;
  data?: {
    id: string;
    active: boolean;
    name: string;
  };
  error?: string;
  status?: number;
}

export async function toggleServiceActiveAction(
  id: string,
  active: boolean,
): Promise<ToggleServiceResult> {
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

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return {
        success: false,
        error: "Identifiant de service invalide.",
        status: 400,
      };
    }

    const existingService = await prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        active: true,
      },
    });

    if (!existingService) {
      return {
        success: false,
        error: "Service introuvable.",
        status: 404,
      };
    }

    if (existingService.active === active) {
      return {
        success: true,
        data: {
          id: existingService.id,
          active: existingService.active,
          name: existingService.name,
        },
      };
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        active,
      },
      select: {
        id: true,
        active: true,
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
      data: updated,
    };
  } catch (error) {
    console.error("Error toggling service state:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour du statut du service.",
      status: 500,
    };
  }
}


