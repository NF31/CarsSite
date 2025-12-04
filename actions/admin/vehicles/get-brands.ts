"use server";

import prisma from '@/lib/prisma'
import {
  getOrSetCache,
  CACHE_TTL,
} from "@/lib/cache";

export async function getBrandsAction() {
  try {
    // Utiliser le cache Redis pour les marques
    const brands = await getOrSetCache(
      "all",
      async () => {
        const vehicles = await prisma.vehicle.findMany({
          select: {
            brand: true,
          },
          distinct: ["brand"],
          orderBy: {
            brand: "asc",
          },
        });

        return vehicles.map((v) => v.brand);
      },
      {
        prefix: "brands",
        ttl: CACHE_TTL.VEHICLES_LIST, // 5 minutes (change peu)
      }
    );

    return {
      success: true,
      data: brands,
    };
  } catch (error) {
    console.error("Error fetching brands:", error);
    return {
      success: false,
      data: [],
      error: "Erreur lors de la récupération des marques",
    };
  }
}

