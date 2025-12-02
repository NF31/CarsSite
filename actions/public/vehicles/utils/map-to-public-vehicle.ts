import type { PublicVehicle } from "../types";
import type { Vehicle } from "@prisma/client";

interface VehicleWithRelations extends Vehicle {
  location: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
  reviews: Array<{ rating: number }>;
  _count: {
    bookings: number;
    reviews: number;
  };
}

/**
 * Transforme un véhicule Prisma en format PublicVehicle
 */
export function mapToPublicVehicle(vehicle: VehicleWithRelations): PublicVehicle {
  const avgRating =
    vehicle.reviews.length > 0
      ? vehicle.reviews.reduce((sum, r) => sum + r.rating, 0) / vehicle.reviews.length
      : 0;

  return {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    category: vehicle.category,
    pricePerDay: vehicle.pricePerDay,
    images: vehicle.images,
    seats: vehicle.seats,
    transmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    location: {
      id: vehicle.location.id,
      name: vehicle.location.name,
      city: vehicle.location.city,
      address: vehicle.location.address,
    },
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: vehicle._count.reviews,
    bookingCount: vehicle._count.bookings,
  };
}

