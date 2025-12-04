import { type Prisma } from "@prisma/client";
import type { PublicVehicleSearchFilters } from "../types";
import { mapCategoryToVehicleCategories } from "./map-category";
import { buildAvailabilityFilter } from "./build-availability-filter";

/**
 * Construit la clause WHERE Prisma pour la recherche de véhicules
 */
export function buildWhereClause(filters: PublicVehicleSearchFilters): Prisma.VehicleWhereInput {
  const {
    category,
    transmission,
    minSeats,
    maxPrice,
    fuelType,
    startDate,
    endDate,
    startTime,
    endTime,
  } = filters;

  const where: Prisma.VehicleWhereInput = {
    status: {
      in: ["AVAILABLE", "RESERVED"],
    },
  };

  // Filtrer par catégorie
  const vehicleCategories = mapCategoryToVehicleCategories(category);
  if (vehicleCategories && vehicleCategories.length > 0) {
    where.category = {
      in: vehicleCategories,
    };
  }

  // Filtrer par transmission
  if (transmission) {
    where.transmission = transmission;
  }

  // Filtrer par nombre de places minimum
  if (minSeats) {
    where.seats = {
      gte: minSeats,
    };
  }

  // Filtrer par prix maximum
  if (maxPrice) {
    where.pricePerDay = {
      lte: maxPrice,
    };
  }

  // Filtrer par type de carburant
  if (fuelType) {
    where.fuelType = fuelType;
  }

  // Filtrer par disponibilité selon les dates et heures
  const availabilityFilter = buildAvailabilityFilter(startDate, endDate, startTime, endTime);
  if (availabilityFilter) {
    where.NOT = availabilityFilter;
  }

  return where;
}

