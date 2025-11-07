"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MaintenanceStatus, MaintenanceType, VehicleStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import {
  serializeMaintenanceRecord,
  type MaintenanceRecord,
  type MaintenanceVehicleInfo,
} from "@/lib/maintenance/serialization";

export type { MaintenanceRecord, MaintenanceVehicleInfo } from "@/lib/maintenance/serialization";

export type MaintenanceStatusFilter =
  | MaintenanceStatus
  | "ACTIVE"
  | "ALL"
  | "UPCOMING"
  | "PAST";

export interface MaintenanceSummary {
  total: number;
  scheduled: number;
  inProgress: number;
  cancelled: number;
  completedThisMonth: number;
  overdue: number;
  active: number;
  totalCost: number;
  totalCostThisMonth: number;
  vehiclesInMaintenance: number;
  nextMaintenance?: {
    id: string;
    startDate: string;
    endDate: string;
    vehicle: {
      id: string;
      label: string;
    };
  };
}

export interface GetMaintenanceFilters {
  status?: MaintenanceStatusFilter;
  type?: MaintenanceType | "ALL";
  vehicleId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  includeBlocked?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "startDate" | "endDate" | "createdAt" | "cost";
  sortOrder?: "asc" | "desc";
}

export interface GetMaintenanceDashboardResult {
  success: boolean;
  data?: {
    maintenances: MaintenanceRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    summary: MaintenanceSummary;
  };
  error?: string;
}

function parseDateInput(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
}

async function autoUpdateMaintenanceStatuses(now: Date) {
  console.log("🕒 [Maintenance] Auto-update start:", now.toISOString());

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

export async function getMaintenanceDashboardAction(
  filters: GetMaintenanceFilters = {}
): Promise<GetMaintenanceDashboardResult> {
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

    const now = new Date();
    await autoUpdateMaintenanceStatuses(now);
    const {
      status = "ACTIVE",
      type = "ALL",
      vehicleId,
      search,
      startDate,
      endDate,
      includeBlocked = false,
      page = 1,
      limit = 10,
      sortBy = "startDate",
      sortOrder,
    } = filters;

    const normalizedLimit = Math.min(Math.max(limit, 1), 50);
    const normalizedPage = Math.max(page, 1);

    const startFilter = parseDateInput(startDate);
    const endFilter = parseDateInput(endDate);

    const andFilters: Prisma.MaintenanceWhereInput[] = [];

    if (!includeBlocked && (type === "ALL" || type === undefined)) {
      andFilters.push({
        type: {
          not: MaintenanceType.BLOCKED,
        },
      });
    }

    if (type && type !== "ALL") {
      andFilters.push({
        type,
      });
    }

    if (vehicleId) {
      andFilters.push({
        vehicleId,
      });
    }

    if (status && status !== "ALL") {
      if (status === "ACTIVE") {
        andFilters.push({
          status: {
            in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
          },
        });
      } else if (status === "UPCOMING") {
        andFilters.push({
          status: MaintenanceStatus.SCHEDULED,
          startDate: {
            gte: now,
          },
        });
      } else if (status === "PAST") {
        andFilters.push({
          status: {
            in: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
          },
        });
      } else {
        andFilters.push({
          status,
        });
      }
    }

    if (startFilter && endFilter) {
      andFilters.push({
        OR: [
          {
            startDate: {
              gte: startFilter,
              lte: endFilter,
            },
          },
          {
            endDate: {
              gte: startFilter,
              lte: endFilter,
            },
          },
          {
            startDate: {
              lte: startFilter,
            },
            endDate: {
              gte: endFilter,
            },
          },
        ],
      });
    } else if (startFilter) {
      andFilters.push({
        endDate: {
          gte: startFilter,
        },
      });
    } else if (endFilter) {
      andFilters.push({
        startDate: {
          lte: endFilter,
        },
      });
    }

    if (search && search.trim().length > 0) {
      const term = search.trim();
      andFilters.push({
        OR: [
          {
            description: {
              contains: term,
              mode: "insensitive",
            },
          },
          {
            notes: {
              contains: term,
              mode: "insensitive",
            },
          },
          {
            vehicle: {
              OR: [
                {
                  brand: {
                    contains: term,
                    mode: "insensitive",
                  },
                },
                {
                  model: {
                    contains: term,
                    mode: "insensitive",
                  },
                },
                {
                  licensePlate: {
                    contains: term,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        ],
      });
    }

    const baseFilters = [...andFilters];
    const where: Prisma.MaintenanceWhereInput =
      baseFilters.length > 0 ? { AND: baseFilters } : {};

    const orderField = sortBy ?? "startDate";
    const orderDirection =
      sortOrder ??
      (status === "PAST" ? "desc" : "asc");

    const skip = (normalizedPage - 1) * normalizedLimit;

    const [maintenances, total, summaryData] = await Promise.all([
      prisma.maintenance.findMany({
        where,
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
        orderBy: {
          [orderField]: orderDirection,
        },
        skip,
        take: normalizedLimit,
      }),
      prisma.maintenance.count({ where }),
      computeSummary(baseFilters),
    ]);

    const records: MaintenanceRecord[] = maintenances.map((item) =>
      serializeMaintenanceRecord(item, now)
    );

    const totalPages = Math.max(1, Math.ceil(total / normalizedLimit));

    return {
      success: true,
      data: {
        maintenances: records,
        pagination: {
          total,
          page: normalizedPage,
          limit: normalizedLimit,
          totalPages,
          hasNext: normalizedPage < totalPages,
          hasPrev: normalizedPage > 1,
        },
        summary: summaryData,
      },
    };
  } catch (error) {
    console.error("Error fetching maintenances:", error);
    return {
      success: false,
      error: "Erreur lors du chargement des maintenances",
    };
  }
}

async function computeSummary(baseFilters: Prisma.MaintenanceWhereInput[]) {
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
          select: {
            id: true,
            brand: true,
            model: true,
            licensePlate: true,
          },
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

