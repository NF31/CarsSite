import { type Prisma } from "@prisma/client";
import { MaintenanceStatus } from "@/lib/types/maintenance-status";
import { MaintenanceType } from "@/lib/types/maintenance-type";
import type { GetMaintenanceFilters, MaintenanceStatusFilter } from "../types";
import { parseDateInput } from "./parse-date-input";

export function buildMaintenanceFilters(
  filters: GetMaintenanceFilters,
  now: Date
): Prisma.MaintenanceWhereInput[] {
  const andFilters: Prisma.MaintenanceWhereInput[] = [];
  const {
    status = "ACTIVE",
    type = "ALL",
    vehicleId,
    search,
    startDate,
    endDate,
    includeBlocked = false,
  } = filters;

  // Filtre pour exclure les maintenances bloquées par défaut
  if (!includeBlocked && (type === "ALL" || type === undefined)) {
    andFilters.push({
      type: {
        not: MaintenanceType.BLOCKED,
      },
    });
  }

  // Filtre par type
  if (type && type !== "ALL") {
    andFilters.push({
      type,
    });
  }

  // Filtre par véhicule
  if (vehicleId) {
    andFilters.push({
      vehicleId,
    });
  }

  // Filtre par statut
  if (status && status !== "ALL") {
    const statusFilter = buildStatusFilter(status, now);
    if (statusFilter) {
      andFilters.push(statusFilter);
    }
  }

  // Filtres par date
  const dateFilters = buildDateFilters(startDate, endDate);
  if (dateFilters) {
    andFilters.push(dateFilters);
  }

  // Filtre de recherche
  if (search && search.trim().length > 0) {
    const searchFilter = buildSearchFilter(search.trim());
    andFilters.push(searchFilter);
  }

  return andFilters;
}

function buildStatusFilter(
  status: MaintenanceStatusFilter,
  now: Date
): Prisma.MaintenanceWhereInput | null {
  if (status === "ACTIVE") {
    return {
      status: {
        in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
      },
    };
  }

  if (status === "UPCOMING") {
    return {
      status: MaintenanceStatus.SCHEDULED,
      startDate: {
        gte: now,
      },
    };
  }

  if (status === "PAST") {
    return {
      status: {
        in: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
      },
    };
  }

  // Si status est un MaintenanceStatus valide (pas "ALL", "ACTIVE", "UPCOMING", "PAST")
  if (status && Object.values(MaintenanceStatus).includes(status as MaintenanceStatus)) {
    return {
      status: status as MaintenanceStatus,
    };
  }

  return null;
}

function buildDateFilters(
  startDate?: string,
  endDate?: string
): Prisma.MaintenanceWhereInput | null {
  const startFilter = parseDateInput(startDate);
  const endFilter = parseDateInput(endDate);

  if (startFilter && endFilter) {
    return {
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
    };
  }

  if (startFilter) {
    return {
      endDate: {
        gte: startFilter,
      },
    };
  }

  if (endFilter) {
    return {
      startDate: {
        lte: endFilter,
      },
    };
  }

  return null;
}

function buildSearchFilter(term: string): Prisma.MaintenanceWhereInput {
  return {
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
  };
}

