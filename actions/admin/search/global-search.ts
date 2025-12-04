"use server";

import { prisma } from "@/lib/prisma";
import { type Prisma } from "@prisma/client";

export interface SearchResult {
  vehicles: Array<{
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    pricePerDay: number;
    status: string;
    location: {
      name: string;
      city: string;
    } | null;
  }>;
  bookings: Array<{
    id: string;
    reference: string;
    totalPrice: number;
    status: string;
    user: {
      name: string | null;
      email: string;
    };
    vehicle: {
      brand: string;
      model: string;
      licensePlate: string;
    };
    startDate: Date;
  }>;
  clients: Array<{
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  }>;
}

export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  bookingStatus?: string;
  vehicleStatus?: string;
}

export async function globalSearchAction(
  searchTerm: string,
  filters?: SearchFilters
): Promise<{
  success: boolean;
  data?: SearchResult;
  error?: string;
}> {
  try {
    const trimmedTerm = searchTerm.trim();

    if (!trimmedTerm || trimmedTerm.length < 2) {
      return {
        success: true,
        data: {
          vehicles: [],
          bookings: [],
          clients: [],
        },
      };
    }

    // Construire les conditions pour les véhicules
    const vehicleWhere: Prisma.VehicleWhereInput = {
      OR: [
        { brand: { contains: trimmedTerm, mode: "insensitive" } },
        { model: { contains: trimmedTerm, mode: "insensitive" } },
        { licensePlate: { contains: trimmedTerm, mode: "insensitive" } },
      ],
    };

    // Ajouter le filtre de prix pour les véhicules
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      vehicleWhere.pricePerDay = {};
      if (filters.minPrice !== undefined) {
        vehicleWhere.pricePerDay.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        vehicleWhere.pricePerDay.lte = filters.maxPrice;
      }
    }

    // Ajouter le filtre de statut pour les véhicules
    if (filters?.vehicleStatus && filters.vehicleStatus !== "all") {
      vehicleWhere.status = filters.vehicleStatus as "AVAILABLE" | "RESERVED" | "MAINTENANCE" | "UNAVAILABLE";
    }

    // Recherche dans les véhicules
    const vehicles = await prisma.vehicle.findMany({
      where: vehicleWhere,
      take: 5,
      select: {
        id: true,
        brand: true,
        model: true,
        year: true,
        licensePlate: true,
        pricePerDay: true,
        status: true,
        location: {
          select: {
            name: true,
            city: true,
          },
        },
      },
    });

    // Construire les conditions pour les réservations
    const bookingWhere: Prisma.BookingWhereInput = {
      OR: [
        { reference: { contains: trimmedTerm, mode: "insensitive" } },
        {
          user: {
            OR: [
              { name: { contains: trimmedTerm, mode: "insensitive" } },
              { email: { contains: trimmedTerm, mode: "insensitive" } },
            ],
          },
        },
        {
          vehicle: {
            OR: [
              { brand: { contains: trimmedTerm, mode: "insensitive" } },
              { model: { contains: trimmedTerm, mode: "insensitive" } },
            ],
          },
        },
      ],
    };

    // Ajouter le filtre de prix pour les réservations
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      bookingWhere.totalPrice = {};
      if (filters.minPrice !== undefined) {
        bookingWhere.totalPrice.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        bookingWhere.totalPrice.lte = filters.maxPrice;
      }
    }

    // Ajouter le filtre de statut pour les réservations
    if (filters?.bookingStatus && filters.bookingStatus !== "all") {
      bookingWhere.status = filters.bookingStatus as "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    }

    // Recherche dans les réservations
    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      take: 5,
      select: {
        id: true,
        reference: true,
        startDate: true,
        totalPrice: true,
        status: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            brand: true,
            model: true,
            licensePlate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Recherche dans les clients (exclure les comptes supprimés)
    const clients = await prisma.user.findMany({
      where: {
        role: "CLIENT",
        deletedAt: null,
        OR: [
          { name: { contains: trimmedTerm, mode: "insensitive" } },
          { email: { contains: trimmedTerm, mode: "insensitive" } },
          { phone: { contains: trimmedTerm, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    return {
      success: true,
      data: {
        vehicles: vehicles.map((v) => ({
          id: v.id,
          brand: v.brand,
          model: v.model,
          year: v.year,
          licensePlate: v.licensePlate,
          pricePerDay: v.pricePerDay,
          status: v.status,
          location: v.location,
        })),
        bookings: bookings.map((b) => ({
          id: b.id,
          reference: b.reference,
          totalPrice: b.totalPrice,
          status: b.status,
          startDate: b.startDate,
          user: b.user,
          vehicle: b.vehicle,
        })),
        clients,
      },
    };
  } catch (error) {
    console.error("Error in global search:", error);
    return {
      success: false,
      error: "Erreur lors de la recherche",
    };
  }
}

