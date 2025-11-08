"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { ServicePricingType, VehicleCategory } from "@prisma/client";

export interface SingleServiceRecord {
  id: string;
  name: string;
  description: string | null;
  price: number;
  pricingType: ServicePricingType;
  availableForCategories: VehicleCategory[];
  icon: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetServiceResult {
  success: boolean;
  data?: SingleServiceRecord;
  error?: string;
  status?: number;
}

export async function getServiceByIdAction(id: string): Promise<GetServiceResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour consulter ce service.",
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

    const service = await prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        pricingType: true,
        availableForCategories: true,
        icon: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!service) {
      return {
        success: false,
        error: "Service introuvable.",
        status: 404,
      };
    }

    return {
      success: true,
      data: {
        ...service,
        description: service.description ?? null,
        icon: service.icon ?? null,
        availableForCategories: service.availableForCategories ?? [],
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error fetching service:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la récupération du service.",
      status: 500,
    };
  }
}


