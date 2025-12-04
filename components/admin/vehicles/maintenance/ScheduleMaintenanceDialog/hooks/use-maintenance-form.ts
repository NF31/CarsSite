import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { MaintenanceType } from "@/lib/types/maintenance-type";
import type { MaintenanceVehicleOption } from "@/actions/admin/vehicles/get-maintenance-vehicles";
import type { MaintenanceRecord } from "@/actions/admin/vehicles/get-maintenance";
import type { DialogMode } from "../types";
import { calculateDefaultDates } from "../utils";

interface UseMaintenanceFormProps {
  open: boolean;
  mode: DialogMode;
  vehicles: MaintenanceVehicleOption[];
  maintenance?: MaintenanceRecord | null;
  defaultVehicleId?: string;
}

interface FormState {
  vehicleId: string;
  type: MaintenanceType;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  cost: string;
  description: string;
  notes: string;
}

export function useMaintenanceForm({
  open,
  mode,
  vehicles,
  maintenance,
  defaultVehicleId,
}: UseMaintenanceFormProps) {
  const defaultDates = useMemo(() => calculateDefaultDates(), []);

  const getInitialState = useMemo((): FormState => {
    if (!open) {
      return {
        vehicleId: "",
        type: MaintenanceType.SERVICE,
        startDate: "",
        startTime: "09:00",
        endDate: "",
        endTime: "18:00",
        cost: "0",
        description: "",
        notes: "",
      };
    }

    if (mode === "edit" && maintenance) {
      const start = new Date(maintenance.startDate);
      const end = new Date(maintenance.endDate);
      return {
        vehicleId: maintenance.vehicleId,
        type: maintenance.type,
        startDate: format(start, "yyyy-MM-dd"),
        startTime: format(start, "HH:mm"),
        endDate: format(end, "yyyy-MM-dd"),
        endTime: format(end, "HH:mm"),
        cost: String(maintenance.cost),
        description: maintenance.description ?? "",
        notes: maintenance.notes ?? "",
      };
    }

    const fallbackVehicle =
      defaultVehicleId ??
      vehicles.find((v) => v.activeMaintenances === 0)?.id ??
      vehicles[0]?.id ??
      "";

    return {
      vehicleId: fallbackVehicle,
      type: MaintenanceType.SERVICE,
      startDate: defaultDates.startDate,
      startTime: defaultDates.startTime,
      endDate: defaultDates.endDate,
      endTime: defaultDates.endTime,
      cost: "0",
      description: "",
      notes: "",
    };
  }, [open, mode, maintenance, vehicles, defaultVehicleId, defaultDates]);

  const [formState, setFormState] = useState<FormState>(getInitialState);

  // Mettre à jour l'état quand le dialog s'ouvre ou que les dépendances changent
  useEffect(() => {
    if (open) {
      setFormState(getInitialState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return {
    vehicleId: formState.vehicleId,
    setVehicleId: (value: string) => setFormState((prev) => ({ ...prev, vehicleId: value })),
    type: formState.type,
    setType: (value: MaintenanceType) => setFormState((prev) => ({ ...prev, type: value })),
    startDate: formState.startDate,
    setStartDate: (value: string) => setFormState((prev) => ({ ...prev, startDate: value })),
    startTime: formState.startTime,
    setStartTime: (value: string) => setFormState((prev) => ({ ...prev, startTime: value })),
    endDate: formState.endDate,
    setEndDate: (value: string) => setFormState((prev) => ({ ...prev, endDate: value })),
    endTime: formState.endTime,
    setEndTime: (value: string) => setFormState((prev) => ({ ...prev, endTime: value })),
    cost: formState.cost,
    setCost: (value: string) => setFormState((prev) => ({ ...prev, cost: value })),
    description: formState.description,
    setDescription: (value: string) => setFormState((prev) => ({ ...prev, description: value })),
    notes: formState.notes,
    setNotes: (value: string) => setFormState((prev) => ({ ...prev, notes: value })),
  };
}

