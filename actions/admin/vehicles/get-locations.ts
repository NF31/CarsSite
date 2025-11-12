"use server";

import { prisma } from "@/lib/prisma";
import {
  getOrSetCache,
  CACHE_PREFIXES,
  CACHE_TTL,
} from "@/lib/cache";

export async function getLocationsAction() {
  try {
    // Utiliser le cache Redis pour les locations
    const locations = await getOrSetCache(
      "active",
      async () => {
        return await prisma.location.findMany({
          where: { active: true },
          select: {
            id: true,
            name: true,
            city: true,
          },
          orderBy: {
            name: "asc",
          },
        });
      },
      {
        prefix: CACHE_PREFIXES.LOCATIONS_LIST,
        ttl: CACHE_TTL.LOCATIONS_LIST,
      }
    );

    return {
      success: true,
      data: locations,
    };
  } catch (error) {
    console.error("Error fetching locations:", error);
    return {
      success: false,
      data: [],
      error: "Erreur lors de la récupération des localisations",
    };
  }
}

