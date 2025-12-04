import type { Prisma } from '@/lib/prisma';
import type { PublicVehicleSearchFilters } from "../types";

/**
 * Construit la clause orderBy Prisma pour le tri des véhicules
 */
export function buildOrderBy(
  sortBy: PublicVehicleSearchFilters["sortBy"] = "price_asc"
): Prisma.VehicleOrderByWithRelationInput {
  switch (sortBy) {
    case "price_asc":
      return { pricePerDay: "asc" };
    case "price_desc":
      return { pricePerDay: "desc" };
    case "newest":
      return { createdAt: "desc" };
    case "oldest":
      return { createdAt: "asc" };
    default:
      return { pricePerDay: "asc" };
  }
}

