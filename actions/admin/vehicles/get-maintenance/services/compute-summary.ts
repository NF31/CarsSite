import { prisma } from "@/lib/prisma";
import { MaintenanceStatus, VehicleStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { MaintenanceSummary } from "../types";
import { NEXT_MAINTENANCE_SELECT_FIELDS } from "../constants";

export async function computeSummary(
  baseFilters: Prisma.MaintenanceWhereInput[]
): Promise<MaintenanceSummary> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  const withBaseFilters = (extra?: Prisma.MaintenanceWhereInput) => {
    if (!extra) {
      return baseFilters.length > 0 ? { AND: baseFilters } : {};
    }
    return {
      AND: [...baseFilters, extra],
    };
  };

  const [
    total,
    scheduled,
    inProgress,
    cancelled,
    overdue,
    completedThisMonth,
    totalCostAgg,
    totalCostThisMonthAgg,
    vehiclesInMaintenance,
    nextMaintenance,
  ] = await Promise.all([
    prisma.maintenance.count({
      where: withBaseFilters(),
    }),
    prisma.maintenance.count({
      where: withBaseFilters({
        status: MaintenanceStatus.SCHEDULED,
      }),
    }),
    prisma.maintenance.count({
      where: withBaseFilters({
        status: MaintenanceStatus.IN_PROGRESS,
      }),
    }),
    prisma.maintenance.count({
      where: withBaseFilters({
        status: MaintenanceStatus.CANCELLED,
      }),
    }),
    prisma.maintenance.count({
      where: withBaseFilters({
        status: MaintenanceStatus.IN_PROGRESS,
        endDate: {
          lt: now,
        },
      }),
    }),
    prisma.maintenance.count({
      where: withBaseFilters({
        status: MaintenanceStatus.COMPLETED,
        endDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      }),
    }),
    prisma.maintenance.aggregate({
      where: withBaseFilters(),
      _sum: {
        cost: true,
      },
    }),
    prisma.maintenance.aggregate({
      where: withBaseFilters({
        status: MaintenanceStatus.COMPLETED,
        endDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      }),
      _sum: {
        cost: true,
      },
    }),
    prisma.vehicle.count({
      where: {
        status: VehicleStatus.MAINTENANCE,
      },
    }),
    prisma.maintenance.findFirst({
      where: withBaseFilters({
        status: {
          in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
        },
        endDate: {
          gte: now,
        },
      }),
      include: {
        vehicle: {
          select: NEXT_MAINTENANCE_SELECT_FIELDS,
        },
      },
      orderBy: [
        {
          status: "asc",
        },
        {
          startDate: "asc",
        },
      ],
    }),
  ]);

  const active = scheduled + inProgress;
  const summary: MaintenanceSummary = {
    total,
    scheduled,
    inProgress,
    cancelled,
    completedThisMonth,
    overdue,
    active,
    totalCost: totalCostAgg._sum.cost ?? 0,
    totalCostThisMonth: totalCostThisMonthAgg._sum.cost ?? 0,
    vehiclesInMaintenance,
  };

  if (nextMaintenance) {
    summary.nextMaintenance = {
      id: nextMaintenance.id,
      startDate: nextMaintenance.startDate.toISOString(),
      endDate: nextMaintenance.endDate.toISOString(),
      vehicle: {
        id: nextMaintenance.vehicle.id,
        label: `${nextMaintenance.vehicle.brand} ${nextMaintenance.vehicle.model} (${nextMaintenance.vehicle.licensePlate})`,
      },
    };
  }

  return summary;
}

