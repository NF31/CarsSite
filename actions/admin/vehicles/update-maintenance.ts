"use server";

import prisma from '@/lib/prisma'
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MaintenanceStatus } from "@/lib/types/maintenance-status";
import { MaintenanceType } from "@/lib/types/maintenance-type";
import { VehicleStatus } from "@/lib/types/vehicle-status";
import { BookingStatus } from "@/lib/types/booking-status";
import {
  updateMaintenanceSchema,
  type UpdateMaintenanceInput,
} from "@/lib/validations/maintenance";
import {
  serializeMaintenanceRecord,
  type MaintenanceRecord,
} from "@/lib/maintenance/serialization";

export interface UpdateMaintenanceResult {
  success: boolean;
  data?: MaintenanceRecord;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

const allowedTransitions: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  [MaintenanceStatus.SCHEDULED]: [
    MaintenanceStatus.SCHEDULED,
    MaintenanceStatus.IN_PROGRESS,
    MaintenanceStatus.CANCELLED,
  ],
  [MaintenanceStatus.IN_PROGRESS]: [
    MaintenanceStatus.IN_PROGRESS,
    MaintenanceStatus.COMPLETED,
    MaintenanceStatus.CANCELLED,
  ],
  [MaintenanceStatus.COMPLETED]: [MaintenanceStatus.COMPLETED],
  [MaintenanceStatus.CANCELLED]: [
    MaintenanceStatus.CANCELLED,
    MaintenanceStatus.SCHEDULED,
  ],
};

export async function updateMaintenanceAction(
  input: UpdateMaintenanceInput
): Promise<UpdateMaintenanceResult> {
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

    const validation = updateMaintenanceSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: validation.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const data = validation.data;
    const now = new Date();

    const existing = await prisma.maintenance.findUnique({
      where: { id: data.id },
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

    if (!existing) {
      return {
        success: false,
        error: "Maintenance introuvable",
      };
    }

    const newStart = data.startDate ?? existing.startDate;
    const newEnd = data.endDate ?? existing.endDate;

    if (newStart >= newEnd) {
      return {
        success: false,
        error: "La date de fin doit être postérieure à la date de début",
        fieldErrors: {
          endDate: ["La date de fin doit être postérieure à la date de début"],
        },
      };
    }

    // Vérifier la transition de statut
    if (data.status && data.status !== existing.status) {
      const allowed = allowedTransitions[existing.status] ?? [existing.status];
      if (!allowed.includes(data.status)) {
        return {
          success: false,
          error: "Transition de statut non autorisée",
          fieldErrors: {
            status: [
              `Impossible de passer du statut ${existing.status} vers ${data.status}`,
            ],
          },
        };
      }

      if (
        data.status === MaintenanceStatus.IN_PROGRESS &&
        newStart > now
      ) {
        return {
          success: false,
          error: "Impossible de démarrer une maintenance avant sa date de début",
          fieldErrors: {
            startDate: [
              "La date de début doit être antérieure ou égale à maintenant pour démarrer la maintenance",
            ],
          },
        };
      }
    }

    const hasDateChange =
      data.startDate !== undefined || data.endDate !== undefined;
    const hasTypeChange = data.type !== undefined;

    // Vérifier les conflits si les dates ou le véhicule changent
    if (hasDateChange || hasTypeChange) {
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          vehicleId: existing.vehicleId,
          status: { not: BookingStatus.CANCELLED },
          startDate: { lte: newEnd },
          endDate: { gte: newStart },
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
        const conflict = overlappingBookings[0];
        return {
          success: false,
          error: "La période sélectionnée entre en conflit avec une réservation",
          fieldErrors: {
            dates: [
              `Conflit avec la réservation ${conflict.reference} (${conflict.status}) du ${conflict.startDate.toLocaleDateString()} au ${conflict.endDate.toLocaleDateString()}`,
            ],
          },
        };
      }

      const overlappingMaintenances = await prisma.maintenance.findMany({
        where: {
          vehicleId: existing.vehicleId,
          id: { not: existing.id },
          status: { not: MaintenanceStatus.CANCELLED },
          endDate: { gte: newStart },
          startDate: { lte: newEnd },
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
          error: "Conflit avec une maintenance existante",
          fieldErrors: {
            dates: [
              `Conflit avec la maintenance ${conflict.id} (${conflict.type}) du ${conflict.startDate.toLocaleDateString()} au ${conflict.endDate.toLocaleDateString()}`,
            ],
          },
        };
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.type) {
      updateData.type = data.type;
    }
    if (data.startDate) {
      updateData.startDate = data.startDate;
    }
    if (data.endDate) {
      updateData.endDate = data.endDate;
    }
    if (data.description !== undefined) {
      updateData.description = data.description ?? null;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes ?? null;
    }
    if (data.cost !== undefined) {
      updateData.cost = data.cost;
    }
    if (data.status) {
      updateData.status = data.status;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const maintenance = await tx.maintenance.update({
        where: { id: existing.id },
        data: updateData,
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

      let targetVehicleStatus: VehicleStatus | null = null;

      if (maintenance.type !== MaintenanceType.BLOCKED) {
        if (
          maintenance.status === MaintenanceStatus.COMPLETED ||
          maintenance.status === MaintenanceStatus.CANCELLED
        ) {
          const otherActive = await tx.maintenance.count({
            where: {
              vehicleId: maintenance.vehicleId,
              id: { not: maintenance.id },
              status: {
                in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
              },
              type: { not: MaintenanceType.BLOCKED },
            },
          });

          if (otherActive === 0) {
            targetVehicleStatus = VehicleStatus.AVAILABLE;
          }
        } else if (
          maintenance.status === MaintenanceStatus.SCHEDULED ||
          maintenance.status === MaintenanceStatus.IN_PROGRESS
        ) {
          targetVehicleStatus = VehicleStatus.MAINTENANCE;
        }
      } else {
        if (
          maintenance.status === MaintenanceStatus.COMPLETED ||
          maintenance.status === MaintenanceStatus.CANCELLED
        ) {
          const otherActive = await tx.maintenance.count({
            where: {
              vehicleId: maintenance.vehicleId,
              id: { not: maintenance.id },
              status: {
                in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
              },
              type: { not: MaintenanceType.BLOCKED },
            },
          });

          if (otherActive === 0) {
            targetVehicleStatus = VehicleStatus.AVAILABLE;
          }
        }
      }

      if (
        targetVehicleStatus &&
        targetVehicleStatus !== maintenance.vehicle.status
      ) {
        await tx.vehicle.update({
          where: { id: maintenance.vehicleId },
          data: {
            status: targetVehicleStatus,
          },
        });
        maintenance.vehicle.status = targetVehicleStatus;
      }

      return maintenance;
    });

    const record = serializeMaintenanceRecord(updated, now);

    // Invalider le cache de disponibilité du véhicule
    const { invalidateVehicleAvailabilityCache } = await import("@/lib/cache-invalidation");
    await invalidateVehicleAvailabilityCache(updated.vehicleId).catch((error) => {
      console.error("Error invalidating vehicle availability cache:", error);
    });

    return {
      success: true,
      data: record,
    };
  } catch (error) {
    console.error("Error updating maintenance:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour de la maintenance",
    };
  }
}

