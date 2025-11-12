"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getOrSetCache,
  CACHE_PREFIXES,
  CACHE_TTL,
} from "@/lib/cache";

export interface GetVehicleByIdResult {
  success: boolean;
  data?: {
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    mileage: number;
    category: string;
    seats: number;
    transmission: string;
    fuelType: string;
    color: string;
    pricePerDay: number;
    pricePerWeek: number | null;
    pricePerMonth: number | null;
    deposit: number;
    status: string;
    locationId: string;
    location: {
      id: string;
      name: string;
      city: string;
      address?: string;
    };
    features: string[];
    images: string[];
    imagePublicIds: string[];
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      bookings: number;
      reviews: number;
    };
  };
  error?: string;
}

export async function getVehicleByIdAction(
  vehicleId: string
): Promise<GetVehicleByIdResult> {
  try {
    // Vérifier l'authentification et le rôle
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires",
      };
    }

    // Utiliser le cache Redis pour les détails d'un véhicule
    const vehicle = await getOrSetCache(
      vehicleId,
      async () => {
        return await prisma.vehicle.findUnique({
          where: { id: vehicleId },
          include: {
            location: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
              },
            },
            _count: {
              select: {
                bookings: true,
                reviews: true,
              },
            },
          },
        });
      },
      {
        prefix: CACHE_PREFIXES.VEHICLE,
        ttl: CACHE_TTL.VEHICLE,
      }
    );

    if (!vehicle) {
      return {
        success: false,
        error: "Véhicule introuvable",
      };
    }

    return {
      success: true,
      data: {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        mileage: vehicle.mileage,
        category: vehicle.category,
        seats: vehicle.seats,
        transmission: vehicle.transmission,
        fuelType: vehicle.fuelType,
        color: vehicle.color,
        pricePerDay: vehicle.pricePerDay,
        pricePerWeek: vehicle.pricePerWeek,
        pricePerMonth: vehicle.pricePerMonth,
        deposit: vehicle.deposit,
        status: vehicle.status,
        locationId: vehicle.locationId,
        location: {
          id: vehicle.location.id,
          name: vehicle.location.name,
          city: vehicle.location.city,
          address: vehicle.location.address || undefined,
        },
        features: vehicle.features,
        images: vehicle.images,
        imagePublicIds: vehicle.imagePublicIds || [],
        description: vehicle.description,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
        _count: {
          bookings: vehicle._count.bookings,
          reviews: vehicle._count.reviews,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération du véhicule",
    };
  }
}

