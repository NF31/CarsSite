import { useState, useCallback, useTransition } from "react";
import { updateMaintenanceAction } from "@/actions/admin/vehicles/update-maintenance";
import { MaintenanceStatus } from "@/lib/types/maintenance-status";
import type { MaintenanceRecord } from "@/actions/admin/vehicles/get-maintenance";
import type { MaintenanceVehicleOption } from "@/actions/admin/vehicles/get-maintenance-vehicles";
import { getMaintenanceVehicleOptionsAction } from "@/actions/admin/vehicles/get-maintenance-vehicles";

type FeedbackState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

interface UseMaintenanceActionsProps {
  onStatusChangeSuccess?: () => void;
}

export function useMaintenanceActions({ onStatusChangeSuccess }: UseMaintenanceActionsProps = {}) {
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [vehicles, setVehicles] = useState<MaintenanceVehicleOption[]>([]);
  const [vehiclesError, setVehiclesError] = useState<string | undefined>();

  const refreshVehicles = useCallback(async () => {
    try {
      const result = await getMaintenanceVehicleOptionsAction();
      if (result.success && result.data) {
        setVehicles(result.data);
        setVehiclesError(undefined);
      } else {
        setVehiclesError(result.error ?? "Erreur lors du chargement des véhicules");
      }
    } catch (err) {
      console.error(err);
      setVehiclesError("Erreur inattendue lors du chargement des véhicules");
    }
  }, []);

  const handleStatusChange = useCallback(
    (
      maintenance: MaintenanceRecord,
      status: MaintenanceStatus,
      onSuccess?: () => void
    ) => {
      setActionLoadingId(maintenance.id);
      startTransition(async () => {
        try {
          const result = await updateMaintenanceAction({
            id: maintenance.id,
            status,
            type: maintenance.type,
            description: maintenance.description ?? undefined,
            notes: maintenance.notes ?? undefined,
          });

          if (result.success && result.data) {
            const statusMessages: Record<MaintenanceStatus, string> = {
              [MaintenanceStatus.CANCELLED]: "annulée",
              [MaintenanceStatus.COMPLETED]: "terminée",
              [MaintenanceStatus.IN_PROGRESS]: "mise à jour",
              [MaintenanceStatus.SCHEDULED]: "mise à jour",
            };

            setFeedback({
              type: "success",
              message: `Maintenance ${statusMessages[status]} avec succès.`,
            });
            await refreshVehicles();
            if (onSuccess) {
              onSuccess();
            }
            if (onStatusChangeSuccess) {
              onStatusChangeSuccess();
            }
          } else {
            setFeedback({
              type: "error",
              message: result.error ?? "Erreur lors de la mise à jour du statut",
            });
          }
        } catch (err) {
          console.error(err);
          setFeedback({
            type: "error",
            message: "Erreur inattendue lors de la mise à jour du statut",
          });
        } finally {
          setActionLoadingId(null);
        }
      });
    },
    [refreshVehicles, onStatusChangeSuccess]
  );

  const clearFeedback = useCallback(() => setFeedback(null), []);

  return {
    feedback,
    actionLoadingId,
    isPending,
    vehicles,
    vehiclesError,
    refreshVehicles,
    handleStatusChange,
    clearFeedback,
    setVehicles,
    setVehiclesError,
  };
}

