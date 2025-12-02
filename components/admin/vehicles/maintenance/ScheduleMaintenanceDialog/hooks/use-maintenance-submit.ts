import { useState, useTransition } from "react";
import { createMaintenanceAction } from "@/actions/admin/vehicles/create-maintenance";
import { updateMaintenanceAction } from "@/actions/admin/vehicles/update-maintenance";
import type { MaintenanceRecord } from "@/actions/admin/vehicles/get-maintenance";
import type { MaintenanceType } from "@prisma/client";
import type { DialogMode } from "../types";
import { validateMaintenanceForm, type ValidationErrors } from "../utils";

interface UseMaintenanceSubmitProps {
  mode: DialogMode;
  maintenance?: MaintenanceRecord | null;
  onSuccess?: (maintenance: MaintenanceRecord) => void;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
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

export function useMaintenanceSubmit({
  mode,
  maintenance,
  onSuccess,
  onOpenChange,
}: UseMaintenanceSubmitProps) {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setFieldErrors(null);

    const now = new Date();
    const existingEnd = maintenance ? new Date(maintenance.endDate) : null;
    const hasEnded = Boolean(existingEnd && existingEnd < now);

    if (hasEnded) {
      setError("Impossible de modifier une intervention déjà terminée.");
      return;
    }

    const validationErrors = validateMaintenanceForm({
      mode,
      vehicleId: formData.vehicleId,
      startDate: formData.startDate,
      startTime: formData.startTime,
      endDate: formData.endDate,
      endTime: formData.endTime,
      cost: formData.cost,
      maintenance,
      now,
    });

    if (validationErrors) {
      setFieldErrors(validationErrors);
      return;
    }

    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const end = new Date(`${formData.endDate}T${formData.endTime}`);
    const numericCost = Number.parseFloat(formData.cost.replace(",", "."));

    startTransition(async () => {
      try {
        if (mode === "create") {
          const result = await createMaintenanceAction({
            vehicleId: formData.vehicleId,
            type: formData.type,
            startDate: start,
            endDate: end,
            cost: numericCost,
            description: formData.description.trim() || undefined,
            notes: formData.notes.trim() || undefined,
          });

          if (result.success && result.data) {
            onSuccess?.(result.data);
            onOpenChange(false);
          } else {
            setError(result.error ?? "Erreur lors de la création");
            if (result.fieldErrors) {
              setFieldErrors(result.fieldErrors);
            }
          }
        } else if (mode === "edit" && maintenance) {
          const result = await updateMaintenanceAction({
            id: maintenance.id,
            type: formData.type,
            startDate: start,
            endDate: end,
            cost: numericCost,
            description: formData.description.trim() || undefined,
            notes: formData.notes.trim() || undefined,
          });

          if (result.success && result.data) {
            onSuccess?.(result.data);
            onOpenChange(false);
          } else {
            setError(result.error ?? "Erreur lors de la mise à jour");
            if (result.fieldErrors) {
              setFieldErrors(result.fieldErrors);
            }
          }
        }
      } catch (err) {
        console.error(err);
        setError("Une erreur inattendue s'est produite");
      }
    });
  };

  return {
    error,
    fieldErrors,
    isPending,
    handleSubmit,
  };
}

