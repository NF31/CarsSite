"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getOrSetCache,
  CACHE_PREFIXES,
  CACHE_TTL,
} from "@/lib/cache";

export interface VehicleAvailabilityItem {
  date: string; // YYYY-MM-DD
  available: boolean;
  reason?: "RESERVED" | "MAINTENANCE" | "BLOCKED" | "UNAVAILABLE";
  bookingId?: string;
  maintenanceId?: string;
  bookingReference?: string;
  bookingStatus?: string;
}

export interface GetVehicleAvailabilityResult {
  success: boolean;
  data?: {
    vehicleId: string;
    vehicle: {
      id: string;
      brand: string;
      model: string;
      licensePlate: string;
    };
    availability: VehicleAvailabilityItem[];
    bookings: Array<{
      id: string;
      reference: string;
      startDate: Date;
      endDate: Date;
      status: string;
    }>;
    maintenances: Array<{
      id: string;
      startDate: Date;
      endDate: Date;
      status: string;
      type: string;
      description: string | null;
    }>;
  };
  error?: string;
}

/**
 * Récupère la disponibilité d'un véhicule pour une période donnée
 */
export async function getVehicleAvailabilityAction(
  vehicleId: string,
  startDate?: Date,
  endDate?: Date
): Promise<GetVehicleAvailabilityResult> {
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

    // Dates par défaut : mois actuel et 2 mois suivants
    const now = new Date();
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 3, 0);

    // Générer une clé de cache basée sur vehicleId et les dates
    const cacheKey = `${vehicleId}:${defaultStartDate.toISOString()}:${defaultEndDate.toISOString()}`;

    // Utiliser le cache Redis pour la disponibilité (TTL court car données changent souvent)
    const cachedData = await getOrSetCache(
      cacheKey,
      async () => {
        // Récupérer le véhicule
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: vehicleId },
          select: {
            id: true,
            brand: true,
            model: true,
            licensePlate: true,
            status: true,
          },
        });

        if (!vehicle) {
          throw new Error("Véhicule introuvable");
        }

        // Récupérer les réservations actives (non annulées)
        const bookings = await prisma.booking.findMany({
          where: {
            vehicleId,
            status: {
              not: "CANCELLED",
            },
            OR: [
              {
                startDate: {
                  lte: defaultEndDate,
                },
                endDate: {
                  gte: defaultStartDate,
                },
              },
            ],
          },
          select: {
            id: true,
            reference: true,
            startDate: true,
            endDate: true,
            status: true,
          },
          orderBy: {
            startDate: "asc",
          },
        });

        // Récupérer les maintenances actives (non annulées) incluant les blocages
        const maintenances = await prisma.maintenance.findMany({
          where: {
            vehicleId,
            status: {
              not: "CANCELLED",
            },
            OR: [
              {
                startDate: {
                  lte: defaultEndDate,
                },
                endDate: {
                  gte: defaultStartDate,
                },
              },
            ],
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            type: true,
            description: true,
          },
          orderBy: {
            startDate: "asc",
          },
        });

        // Générer le tableau de disponibilité par jour
        const availability: VehicleAvailabilityItem[] = [];
        const currentDate = new Date(defaultStartDate);
        
        while (currentDate <= defaultEndDate) {
          const dateStr = currentDate.toISOString().split("T")[0];
          let available = vehicle.status === "AVAILABLE";
          let reason: VehicleAvailabilityItem["reason"] | undefined;
          let bookingId: string | undefined;
          let maintenanceId: string | undefined;
          let bookingReference: string | undefined;
          let bookingStatus: string | undefined;

          // Vérifier si le véhicule est globalement indisponible
          if (vehicle.status === "UNAVAILABLE" || vehicle.status === "RESERVED" || vehicle.status === "MAINTENANCE") {
            available = false;
            reason = vehicle.status === "MAINTENANCE" ? "MAINTENANCE" : "UNAVAILABLE";
          } else {
            // Vérifier les maintenances (incluant les blocages)
            const maintenance = maintenances.find((m) => {
              const mStart = new Date(m.startDate);
              const mEnd = new Date(m.endDate);
              mStart.setHours(0, 0, 0, 0);
              mEnd.setHours(23, 59, 59, 999);
              const checkDate = new Date(currentDate);
              checkDate.setHours(0, 0, 0, 0);
              return checkDate >= mStart && checkDate <= mEnd;
            });

            if (maintenance) {
              available = false;
              // Si c'est un blocage, utiliser "BLOCKED", sinon "MAINTENANCE"
              reason = maintenance.type === "BLOCKED" ? "BLOCKED" : "MAINTENANCE";
              maintenanceId = maintenance.id;
            } else {
              // Vérifier les réservations
              const booking = bookings.find((b) => {
                const bStart = new Date(b.startDate);
                const bEnd = new Date(b.endDate);
                bStart.setHours(0, 0, 0, 0);
                bEnd.setHours(23, 59, 59, 999);
                const checkDate = new Date(currentDate);
                checkDate.setHours(0, 0, 0, 0);
                return checkDate >= bStart && checkDate <= bEnd;
              });

              if (booking) {
                available = false;
                reason = "RESERVED";
                bookingId = booking.id;
                bookingReference = booking.reference;
                bookingStatus = booking.status;
              }
            }
          }

          availability.push({
            date: dateStr,
            available,
            reason,
            bookingId,
            maintenanceId,
            bookingReference,
            bookingStatus,
          });

          // Passer au jour suivant
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return {
          vehicleId: vehicle.id,
          vehicle: {
            id: vehicle.id,
            brand: vehicle.brand,
            model: vehicle.model,
            licensePlate: vehicle.licensePlate,
          },
          availability,
          bookings: bookings.map((b) => ({
            id: b.id,
            reference: b.reference,
            startDate: b.startDate,
            endDate: b.endDate,
            status: b.status,
          })),
          maintenances: maintenances.map((m) => ({
            id: m.id,
            startDate: m.startDate,
            endDate: m.endDate,
            status: m.status,
            type: m.type,
            description: m.description,
          })),
        };
      },
      {
        prefix: "vehicle:availability",
        ttl: 60, // 1 minute (données changent souvent avec nouvelles réservations/maintenances)
      }
    );

    return {
      success: true,
      data: cachedData,
    };
  } catch (error) {
    console.error("Error fetching vehicle availability:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération de la disponibilité",
    };
  }
}

