"use server";

import prisma from '@/lib/prisma'
import type { PublicVehicleSearchFilters, PublicVehiclesResult } from "./vehicles/types";
import { buildWhereClause, buildOrderBy, mapToPublicVehicle } from "./vehicles/utils";
import { VEHICLE_SELECT_FIELDS } from "./vehicles/constants";

/**
 * Récupère les véhicules disponibles avec les filtres de recherche
 */
export async function getPublicVehiclesAction(
  filters: PublicVehicleSearchFilters = {}
): Promise<PublicVehiclesResult> {
  try {
    const {
      sortBy = "price_asc",
      page = 1,
      limit = 12,
    } = filters;

    // Construire les conditions WHERE
    const where = buildWhereClause(filters);

    // Calculer le skip
    const skip = (page - 1) * limit;

    // Déterminer l'ordre de tri
    const orderBy = buildOrderBy(sortBy);

    // Récupérer les véhicules
    const vehicles = await prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: VEHICLE_SELECT_FIELDS,
    });

    // Calculer le total
    const total = await prisma.vehicle.count({ where });

    // Transformer les véhicules en format public
    const publicVehicles = vehicles.map(mapToPublicVehicle);

    // Calculer le nombre total de pages
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        vehicles: publicVehicles,
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Ré-exporter les types pour compatibilité
export type { PublicVehicleSearchFilters, PublicVehicle, PublicVehiclesResult } from "./vehicles/types";
