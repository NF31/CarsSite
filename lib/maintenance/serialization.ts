import { MaintenanceStatus } from "@/lib/types/maintenance-status";
import { MaintenanceType } from "@/lib/types/maintenance-type";
import { VehicleStatus } from "@/lib/types/vehicle-status";
import { type Prisma } from "@prisma/client";

export interface MaintenanceVehicleInfo {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  year: number;
  status: VehicleStatus;
  location?: {
    id: string;
    name: string;
    city: string;
  } | null;
  image?: string | null;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  startDate: string;
  endDate: string;
  description: string | null;
  cost: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  durationHours: number;
  isOngoing: boolean;
  isOverdue: boolean;
  vehicle: MaintenanceVehicleInfo;
}

export type MaintenanceWithVehicle = Prisma.MaintenanceGetPayload<{
  include: {
    vehicle: {
      select: {
        id: true;
        brand: true;
        model: true;
        licensePlate: true;
        year: true;
        status: true;
        images: true;
        location: {
          select: {
            id: true;
            name: true;
            city: true;
          };
        };
      };
    };
  };
}>;

export function serializeMaintenanceRecord(
  maintenance: MaintenanceWithVehicle,
  referenceDate: Date = new Date()
): MaintenanceRecord {
  const start = new Date(maintenance.startDate);
  const end = new Date(maintenance.endDate);
  const durationMs = end.getTime() - start.getTime();
  const durationHours = Math.max(
    1,
    Math.ceil(durationMs / (1000 * 60 * 60))
  );

  const isOngoing =
    maintenance.status === MaintenanceStatus.IN_PROGRESS ||
    (maintenance.status === MaintenanceStatus.SCHEDULED && start <= referenceDate && end >= referenceDate);

  const isOverdue =
    maintenance.status === MaintenanceStatus.IN_PROGRESS && end < referenceDate;

  return {
    id: maintenance.id,
    vehicleId: maintenance.vehicleId,
    type: maintenance.type,
    status: maintenance.status,
    startDate: maintenance.startDate.toISOString(),
    endDate: maintenance.endDate.toISOString(),
    description: maintenance.description,
    cost: maintenance.cost,
    notes: maintenance.notes,
    createdAt: maintenance.createdAt.toISOString(),
    updatedAt: maintenance.updatedAt.toISOString(),
    durationHours,
    isOngoing,
    isOverdue,
    vehicle: {
      id: maintenance.vehicle.id,
      brand: maintenance.vehicle.brand,
      model: maintenance.vehicle.model,
      licensePlate: maintenance.vehicle.licensePlate,
      year: maintenance.vehicle.year,
      status: maintenance.vehicle.status,
      location: maintenance.vehicle.location,
      image: maintenance.vehicle.images?.[0] ?? null,
    },
  };
}

