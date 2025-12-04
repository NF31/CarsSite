"use server";

import prisma from '@/lib/prisma'
import {
  getOrSetCache,
  CACHE_PREFIXES,
  CACHE_TTL,
} from "@/lib/cache";

export interface GetPublicVehicleByIdResult {
  success: boolean;
  data?: {
    id: string;
    brand: string;
    model: string;
    year: number;
    category: string;
    seats: number;
    transmission: string;
    fuelType: string;
    color: string;
    mileage: number;
    pricePerDay: number;
    pricePerWeek: number | null;
    pricePerMonth: number | null;
    deposit: number;
    location: {
      id: string;
      name: string;
      city: string;
      address?: string;
    };
    features: string[];
    images: string[];
    description: string | null;
    rating: number;
    reviewCount: number;
    bookingCount: number;
  };
  error?: string;
}

export async function getPublicVehicleByIdAction(
  vehicleId: string
): Promise<GetPublicVehicleByIdResult> {
  try {
    // Utiliser le cache Redis pour les détails d'un véhicule
    const vehicle = await getOrSetCache(
      vehicleId,
      async () => {
        return await prisma.vehicle.findUnique({
          where: { 
            id: vehicleId,
            status: {
              in: ["AVAILABLE", "RESERVED"], // Seulement les véhicules disponibles ou réservés
            },
          },
          include: {
            location: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
              },
            },
            // TODO: Décommenter quand les avis seront implémentés
            // reviews: {
            //   where: {
            //     status: "APPROVED",
            //   },
            //   select: {
            //     rating: true,
            //   },
            // },
            _count: {
              select: {
                bookings: true,
                // TODO: Décommenter quand les avis seront implémentés
                // reviews: {
                //   where: {
                //     status: "APPROVED",
                //   },
                // },
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

    // Calculer la note moyenne
    // TODO: Décommenter quand les avis seront implémentés
    // const rating =
    //   vehicle.reviews && vehicle.reviews.length > 0
    //     ? vehicle.reviews.reduce((sum, review) => sum + review.rating, 0) /
    //       vehicle.reviews.length
    //     : 0;
    const rating = 0; // Pas encore d'avis disponibles

    return {
      success: true,
      data: {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        category: vehicle.category,
        seats: vehicle.seats,
        transmission: vehicle.transmission,
        fuelType: vehicle.fuelType,
        color: vehicle.color,
        mileage: vehicle.mileage,
        pricePerDay: vehicle.pricePerDay,
        pricePerWeek: vehicle.pricePerWeek,
        pricePerMonth: vehicle.pricePerMonth,
        deposit: vehicle.deposit,
        location: {
          id: vehicle.location.id,
          name: vehicle.location.name,
          city: vehicle.location.city,
          address: vehicle.location.address || undefined,
        },
        features: vehicle.features,
        images: vehicle.images,
        description: vehicle.description,
        rating: rating, // Pas encore d'avis disponibles
        reviewCount: 0, // vehicle._count.reviews, // TODO: Décommenter quand les avis seront implémentés
        bookingCount: vehicle._count.bookings,
      },
    };
  } catch (error) {
    console.error("Error fetching public vehicle:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération du véhicule",
    };
  }
}

