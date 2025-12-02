import type { VehicleCategory } from "@prisma/client";

/**
 * Mappe les catégories du widget vers les catégories Prisma
 */
export function mapCategoryToVehicleCategories(
  category?: "cars" | "utility" | "subscription"
): VehicleCategory[] | undefined {
  if (!category) return undefined;

  switch (category) {
    case "cars":
      // Toutes les catégories sauf VAN
      return ["ECONOMY", "COMPACT", "MID_SIZE", "FULL_SIZE", "SUV", "LUXURY"];
    case "utility":
      return ["VAN"];
    case "subscription":
      // Pour l'abonnement, on pourrait inclure toutes les catégories ou certaines spécifiques
      // Pour l'instant, on inclut toutes les catégories
      return undefined; // undefined signifie toutes les catégories
    default:
      return undefined;
  }
}

