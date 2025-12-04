"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma, { type Prisma } from '@/lib/prisma'
import { serializeMaintenanceRecord } from "@/lib/maintenance/serialization";
import type {
  GetMaintenanceFilters,
  GetMaintenanceDashboardResult,
} from "./types";
import { DEFAULT_FILTERS, VEHICLE_SELECT_FIELDS } from "./constants";
import { normalizePagination } from "./utils/normalize-pagination";
import { buildMaintenanceFilters } from "./utils/build-filters";
import { buildOrderBy } from "./utils/build-order-by";
import { autoUpdateMaintenanceStatuses } from "./services/auto-update-maintenance-statuses";
import { computeSummary } from "./services/compute-summary";

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
      status = DEFAULT_FILTERS.status,
      type = DEFAULT_FILTERS.type,
      vehicleId,
      search,
      startDate,
      endDate,
      includeBlocked = DEFAULT_FILTERS.includeBlocked,
      page = DEFAULT_FILTERS.page,
      limit = DEFAULT_FILTERS.limit,
      sortBy = DEFAULT_FILTERS.sortBy,
      sortOrder,
    } = filters;

    const { normalizedPage, normalizedLimit } = normalizePagination(page, limit);

    const baseFilters = buildMaintenanceFilters(
      {
        status,
        type,
        vehicleId,
        search,
        startDate,
        endDate,
        includeBlocked,
      },
      now
    );

    const where: Prisma.MaintenanceWhereInput =
      baseFilters.length > 0 ? { AND: baseFilters } : {};

    const orderBy = buildOrderBy({ sortBy, sortOrder }, status);

    const skip = (normalizedPage - 1) * normalizedLimit;

    const [maintenances, total, summaryData] = await Promise.all([
      prisma.maintenance.findMany({
        where,
        include: {
          vehicle: {
            select: VEHICLE_SELECT_FIELDS,
          },
        },
        orderBy,
        skip,
        take: normalizedLimit,
      }),
      prisma.maintenance.count({ where }),
      computeSummary(baseFilters),
    ]);

    const records = maintenances.map((item) =>
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

