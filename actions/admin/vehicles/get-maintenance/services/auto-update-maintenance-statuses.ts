import { prisma } from "@/lib/prisma";
import { MaintenanceStatus } from "@/lib/types/maintenance-status";
import { MaintenanceType } from "@/lib/types/maintenance-type";
import { VehicleStatus } from "@/lib/types/vehicle-status";

export async function autoUpdateMaintenanceStatuses(now: Date): Promise<void> {
  console.log("🕒 [Maintenance] Auto-update start:", now.toISOString());

  // Mettre à jour les maintenances qui doivent commencer
  const toStart = await prisma.maintenance.findMany({
    where: {
      status: MaintenanceStatus.SCHEDULED,
      startDate: {
        lte: now,
      },
      endDate: {
        gt: now,
      },
    },
    select: {
      id: true,
      vehicleId: true,
      type: true,
    },
  });

  for (const maintenance of toStart) {
    console.log("  ▶️ Passage en IN_PROGRESS:", maintenance.id);
    await prisma.$transaction(async (tx) => {
      await tx.maintenance.update({
        where: { id: maintenance.id },
        data: { status: MaintenanceStatus.IN_PROGRESS },
      });

      if (maintenance.type !== MaintenanceType.BLOCKED) {
        await tx.vehicle.update({
          where: { id: maintenance.vehicleId },
          data: { status: VehicleStatus.MAINTENANCE },
        });
      }
    });
  }

  // Mettre à jour les maintenances qui doivent se terminer
  const toComplete = await prisma.maintenance.findMany({
    where: {
      status: {
        in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
      },
      endDate: {
        lt: now,
      },
    },
    select: {
      id: true,
      vehicleId: true,
      type: true,
    },
  });

  for (const maintenance of toComplete) {
    console.log("  ✅ Passage en COMPLETED:", maintenance.id);
    await prisma.$transaction(async (tx) => {
      await tx.maintenance.update({
        where: { id: maintenance.id },
        data: { status: MaintenanceStatus.COMPLETED },
      });

      if (maintenance.type !== MaintenanceType.BLOCKED) {
        const remaining = await tx.maintenance.count({
          where: {
            vehicleId: maintenance.vehicleId,
            type: {
              not: MaintenanceType.BLOCKED,
            },
            status: {
              in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
            },
          },
        });

        if (remaining === 0) {
          console.log("  🚗 Véhicule redevenu disponible:", maintenance.vehicleId);
          await tx.vehicle.update({
            where: { id: maintenance.vehicleId },
            data: { status: VehicleStatus.AVAILABLE },
          });
        }
      }
    });
  }

  console.log("🕒 [Maintenance] Auto-update end");
}

