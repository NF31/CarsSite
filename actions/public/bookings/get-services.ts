"use server";

import prisma from '@/lib/prisma'
import { VehicleCategory } from "@/lib/types/vehicle-category";
import { getPublicVehicleByIdAction } from "../vehicles/get-by-id";

// Mapper la catégorie string vers VehicleCategory
function mapCategoryToVehicleCategory(category: string): VehicleCategory | null {
  const categoryMap: Record<string, VehicleCategory> = {
    ECONOMY: "ECONOMY",
    COMPACT: "COMPACT",
    MID_SIZE: "MID_SIZE",
    FULL_SIZE: "FULL_SIZE",
    SUV: "SUV",
    LUXURY: "LUXURY",
    VAN: "VAN",
  };
  return categoryMap[category] || null;
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  pricingType: "PER_DAY" | "FIXED" | "PERCENTAGE";
  icon: string | null;
}

export interface GetPublicServicesResult {
  success: boolean;
  data?: PublicService[];
  error?: string;
}

/**
 * Récupère les services disponibles pour un véhicule
 * Les services sont filtrés par catégorie de véhicule
 */
export async function getPublicServicesAction(
  vehicleId: string
): Promise<GetPublicServicesResult> {
  try {
    // Récupérer le véhicule pour obtenir sa catégorie
    const vehicleResult = await getPublicVehicleByIdAction(vehicleId);

    if (!vehicleResult.success || !vehicleResult.data) {
      return {
        success: false,
        error: "Véhicule introuvable",
      };
    }

    const vehicleCategoryString = vehicleResult.data.category;
    const vehicleCategory = mapCategoryToVehicleCategory(vehicleCategoryString);

    if (!vehicleCategory) {
      return {
        success: false,
        error: "Catégorie de véhicule invalide",
      };
    }

    // Récupérer les services actifs disponibles pour cette catégorie
    const services = await prisma.service.findMany({
      where: {
        active: true,
        OR: [
          {
            availableForCategories: {
              has: vehicleCategory,
            },
          },
          {
            availableForCategories: {
              equals: [],
            },
          },
        ],
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        pricingType: true,
        icon: true,
      },
    });

    return {
      success: true,
      data: services,
    };
  } catch (error) {
    console.error("[Public Booking] Erreur lors de la récupération des services", error);
    return {
      success: false,
      error: "Impossible de récupérer les services disponibles",
    };
  }
}

