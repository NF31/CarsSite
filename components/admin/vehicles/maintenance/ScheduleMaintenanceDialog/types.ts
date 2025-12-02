import type { MaintenanceVehicleOption } from "@/actions/admin/vehicles/get-maintenance-vehicles";
import type { MaintenanceRecord } from "@/actions/admin/vehicles/get-maintenance";
import type { MaintenanceType } from "@prisma/client";

export type DialogMode = "create" | "edit";

export interface ScheduleMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  vehicles: MaintenanceVehicleOption[];
  maintenance?: MaintenanceRecord | null;
  onSuccess?: (maintenance: MaintenanceRecord) => void;
  defaultVehicleId?: string;
}

export interface MaintenanceTypeOption {
  value: MaintenanceType;
  label: string;
}

