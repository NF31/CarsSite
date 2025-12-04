import { MaintenanceStatus } from "@/lib/types/maintenance-status";
import { MaintenanceType } from "@/lib/types/maintenance-type";
import type { MaintenanceRecord } from "@/actions/admin/vehicles/get-maintenance";

export interface MaintenancePermissions {
  canStart: boolean;
  canReplan: boolean;
  canComplete: boolean;
  canCancel: boolean;
  canEdit: boolean;
}

/**
 * Calcule les permissions d'action pour une maintenance
 */
export function getMaintenancePermissions(
  maintenance: MaintenanceRecord,
  now: Date = new Date()
): MaintenancePermissions {
  const start = new Date(maintenance.startDate);
  const end = new Date(maintenance.endDate);
  const isBlocked = maintenance.type === MaintenanceType.BLOCKED;
  const periodEnded = end < now;
  const periodStarted = start <= now;
  const beforeStart = start > now;

  return {
    canStart:
      maintenance.status === MaintenanceStatus.SCHEDULED &&
      !isBlocked &&
      periodStarted &&
      !periodEnded,
    canReplan: maintenance.status === MaintenanceStatus.CANCELLED && beforeStart,
    canComplete: maintenance.status === MaintenanceStatus.IN_PROGRESS && !periodEnded,
    canCancel:
      maintenance.status !== MaintenanceStatus.COMPLETED &&
      maintenance.status !== MaintenanceStatus.CANCELLED &&
      beforeStart,
    canEdit: beforeStart,
  };
}

