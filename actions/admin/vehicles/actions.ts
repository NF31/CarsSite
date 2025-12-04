"use server";

import { prisma } from "@/lib/prisma";
import type { TransmissionType, FuelType, Prisma } from "@prisma/client";
import type { VehicleStatus } from "@/lib/types/vehicle-status";
import type { VehicleCategory } from "@/lib/types/vehicle-category";
import {
  getOrSetCache,
  CACHE_PREFIXES,
  CACHE_TTL,
} from "@/lib/cache";

export interface GetVehiclesFilters {
  status?: VehicleStatus;
  category?: VehicleCategory;
  brand?: string;
  locationId?: string;
  search?: string; // Recherche par modèle/plaque
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "pricePerDay" | "brand" | "model";
  sortOrder?: "asc" | "desc";
}

export interface GetVehiclesResult {
  success: boolean;
  data?: {
    vehicles: Array<{
      id: string;
      brand: string;
      model: string;
      year: number;
      licensePlate: string;
      mileage: number;
      category: VehicleCategory;
      seats: number;
      transmission: TransmissionType;
      fuelType: FuelType;
      color: string;
      pricePerDay: number;
      pricePerWeek: number | null;
      pricePerMonth: number | null;
      deposit: number;
      status: VehicleStatus;
      locationId: string;
      location: {
        id: string;
        name: string;
        address: string;
        city: string;
      };
      features: string[];
      images: string[];
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
      _count: {
        bookings: number;
        reviews: number;
      };
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error?: string;
}

/**
 * Génère une clé de cache unique basée sur les filtres
 */
function getVehiclesCacheKey(filters: GetVehiclesFilters): string {
  const parts = [
    filters.status || "all",
    filters.category || "all",
    filters.brand || "all",
    filters.locationId || "all",
    filters.search || "all",
    filters.page || 1,
    filters.limit || 12,
    filters.sortBy || "createdAt",
    filters.sortOrder || "desc",
  ];
  return parts.join(":");
}

export async function getVehiclesAction(
  filters: GetVehiclesFilters = {}
): Promise<GetVehiclesResult> {
  try {
    const {
      status,
      category,
      brand,
      locationId,
      search,
      page = 1,
      limit = 12,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    // Construire les conditions WHERE
    const where: Prisma.VehicleWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (brand) {
      where.brand = {
        contains: brand,
        mode: "insensitive",
      };
    }

    if (locationId) {
      where.locationId = locationId;
    }

    if (search) {
      where.OR = [
        {
          model: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          licensePlate: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          brand: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Construire l'ordre de tri
    const orderBy: Record<string, "asc" | "desc"> = {};
    orderBy[sortBy] = sortOrder;

    // Calculer le skip
    const skip = (page - 1) * limit;

    // Générer la clé de cache
    const cacheKey = getVehiclesCacheKey(filters);

    // Utiliser le cache Redis pour les véhicules
    // Note: On ne met pas en cache si on a une recherche textuelle (trop variable)
    const shouldCache = !search;

    if (shouldCache) {
      const cached = await getOrSetCache(
        cacheKey,
        async () => {
          // Récupérer les véhicules et le total
          const [vehicles, total] = await Promise.all([
            prisma.vehicle.findMany({
              where,
              skip,
              take: limit,
              orderBy,
              include: {
                location: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true,
                  },
                },
                _count: {
                  select: {
                    bookings: true,
                    reviews: true,
                  },
                },
              },
            }),
            prisma.vehicle.count({ where }),
          ]);

          const totalPages = Math.ceil(total / limit);

          return {
            vehicles: vehicles.map((vehicle) => ({
              ...vehicle,
              transmission: vehicle.transmission,
              fuelType: vehicle.fuelType,
            })),
            pagination: {
              total,
              page,
              limit,
              totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1,
            },
          };
        },
        {
          prefix: CACHE_PREFIXES.VEHICLES_LIST,
          ttl: CACHE_TTL.VEHICLES_LIST,
        }
      );

      return {
        success: true,
        data: cached,
      };
    } else {
      // Pas de cache pour les recherches textuelles
      const [vehicles, total] = await Promise.all([
        prisma.vehicle.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            location: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
              },
            },
            _count: {
              select: {
                bookings: true,
                reviews: true,
              },
            },
          },
        }),
        prisma.vehicle.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          vehicles: vehicles.map((vehicle) => ({
            ...vehicle,
            transmission: vehicle.transmission,
            fuelType: vehicle.fuelType,
          })),
          pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      };
    }
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des véhicules",
    };
  }
}

