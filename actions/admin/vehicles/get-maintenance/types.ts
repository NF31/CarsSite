import type { MaintenanceStatus } from "@/lib/types/maintenance-status";
import type { MaintenanceType } from "@/lib/types/maintenance-type";
import type { Prisma } from "@prisma/client";
import type {
  MaintenanceRecord,
  MaintenanceVehicleInfo,
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

