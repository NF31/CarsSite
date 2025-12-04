"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MaintenanceStatus } from "@/lib/types/maintenance-status";
import { MaintenanceType } from "@/lib/types/maintenance-type";
import { VehicleStatus } from "@/lib/types/vehicle-status";
import { BookingStatus } from "@/lib/types/booking-status";
import { createMaintenanceSchema, type CreateMaintenanceInput } from "@/lib/validations/maintenance";
import { serializeMaintenanceRecord, type MaintenanceRecord } from "@/lib/maintenance/serialization";

export interface CreateMaintenanceResult {
  success: boolean;
  data?: MaintenanceRecord;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createMaintenanceAction(
  input: CreateMaintenanceInput
): Promise<CreateMaintenanceResult> {
  try {
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

    const validation = createMaintenanceSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = validation.data;
    const now = new Date();

    // Vérifier que le véhicule existe
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      select: {
        id: true,
        brand: true,
        model: true,
        licensePlate: true,
        status: true,
      },
    });

    if (!vehicle) {
      return {
        success: false,
        error: "Véhicule introuvable",
        fieldErrors: {
          vehicleId: ["Le véhicule sélectionné est introuvable"],
        },
      };
    }

    // Vérifier les réservations qui se chevauchent (non annulées)
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        vehicleId: data.vehicleId,
        status: { not: BookingStatus.CANCELLED },
        startDate: { lte: data.endDate },
        endDate: { gte: data.startDate },
      },
      select: {
        id: true,
        reference: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    if (overlappingBookings.length > 0) {
      const firstConflict = overlappingBookings[0];
      return {
        success: false,
        error: "Impossible de planifier la maintenance sur cette période",
        fieldErrors: {
          dates: [
            `Conflit avec la réservation ${firstConflict.reference} (${firstConflict.status}) du ${firstConflict.startDate.toLocaleDateString()} au ${firstConflict.endDate.toLocaleDateString()}`,
          ],
        },
      };
    }

    // Vérifier les maintenances existantes qui se chevauchent (non annulées)
    const overlappingMaintenances = await prisma.maintenance.findMany({
      where: {
        vehicleId: data.vehicleId,
        status: { not: MaintenanceStatus.CANCELLED },
        endDate: { gte: data.startDate },
        startDate: { lte: data.endDate },
      },
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    if (overlappingMaintenances.length > 0) {
      const conflict = overlappingMaintenances[0];
      return {
        success: false,
        error: "Une maintenance est déjà prévue sur cette période",
        fieldErrors: {
          dates: [
            `Conflit avec une maintenance existante (${conflict.type}) du ${conflict.startDate.toLocaleDateString()} au ${conflict.endDate.toLocaleDateString()}`,
          ],
        },
      };
    }

    const shouldSetVehicleMaintenanceStatus =
      data.type !== MaintenanceType.BLOCKED;

    const maintenance = await prisma.$transaction(async (tx) => {
      const created = await tx.maintenance.create({
        data: {
          vehicleId: data.vehicleId,
          type: data.type,
          status: data.startDate <= now ? MaintenanceStatus.IN_PROGRESS : MaintenanceStatus.SCHEDULED,
          startDate: data.startDate,
          endDate: data.endDate,
          description: data.description,
          cost: data.cost,
          notes: data.notes,
        },
        include: {
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              licensePlate: true,
              year: true,
              status: true,
              images: true,
              location: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                },
              },
            },
          },
        },
      });

      if (shouldSetVehicleMaintenanceStatus) {
        await tx.vehicle.update({
          where: { id: data.vehicleId },
          data: {
            status: VehicleStatus.MAINTENANCE,
          },
        });
      }

      return created;
    });

    const record = serializeMaintenanceRecord(maintenance);

    // Invalider le cache de disponibilité du véhicule
    const { invalidateVehicleAvailabilityCache } = await import("@/lib/cache-invalidation");
    await invalidateVehicleAvailabilityCache(data.vehicleId).catch((error) => {
      console.error("Error invalidating vehicle availability cache:", error);
    });

    return {
      success: true,
      data: record,
    };
  } catch (error) {
    console.error("Error creating maintenance:", error);
    return {
      success: false,
      error: "Erreur lors de la création de la maintenance",
    };
  }
}

