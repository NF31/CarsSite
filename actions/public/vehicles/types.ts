import type { VehicleCategory } from "@prisma/client";

export interface PublicVehicleSearchFilters {
  category?: "cars" | "utility" | "subscription";
  pickupPlaceId?: string;
  returnPlaceId?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  locationId?: string;
  transmission?: "MANUAL" | "AUTOMATIC";
  minSeats?: number;
  maxPrice?: number;
  fuelType?: "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID";
  sortBy?: "price_asc" | "price_desc" | "newest" | "oldest";
  page?: number;
  limit?: number;
}

export interface PublicVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: VehicleCategory;
  pricePerDay: number;
  images: string[];
  seats: number;
  transmission: string;
  fuelType: string;
  location: {
    id: string;
    name: string;
    city: string;
    address: string;
  };
  rating: number;
  reviewCount: number;
  bookingCount: number;
}

export interface PublicVehiclesResult {
  success: boolean;
  data?: {
    vehicles: PublicVehicle[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

