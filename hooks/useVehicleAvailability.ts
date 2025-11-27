import { useState, useTransition, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { checkVehicleAvailabilityAction, type VehicleAvailabilityResponse } from "@/actions/admin/bookings";

type AvailabilityStatus =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "booking_conflict"; message: string }
  | { status: "maintenance_conflict"; message: string }
  | { status: "error"; message: string };

interface UseVehicleAvailabilityProps {
  vehicleId: string | null;
  startDate: string;
  endDate: string;
  isEditMode: boolean;
  bookingId?: string;
}

export function useVehicleAvailability({
  vehicleId,
  startDate,
  endDate,
  isEditMode,
  bookingId,
}: UseVehicleAvailabilityProps) {
  const [isCheckingAvailability, startAvailabilityTransition] = useTransition();
  const [availability, setAvailability] = useState<AvailabilityStatus>({ status: "idle" });

  const scheduleAvailabilityUpdate = useCallback(
    (nextState: AvailabilityStatus) => {
      startAvailabilityTransition(() => {
        setAvailability(nextState);
      });
    },
    [startAvailabilityTransition]
  );

  useEffect(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (!vehicleId) {
      scheduleAvailabilityUpdate({ status: "idle" });
      return;
    }

    if (!start || !end) {
      scheduleAvailabilityUpdate({ status: "idle" });
      return;
    }

    if (end <= start) {
      scheduleAvailabilityUpdate({
        status: "error",
        message: "La date de fin doit être postérieure à la date de début.",
      });
      return;
    }

    const now = new Date();
    if (start < now || end < now) {
      scheduleAvailabilityUpdate({
        status: "error",
        message: "Les dates passées ne peuvent pas être sélectionnées.",
      });
      return;
    }

    scheduleAvailabilityUpdate({ status: "checking" });
    startAvailabilityTransition(async () => {
      const availabilityPayload = {
        vehicleId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        ...(isEditMode && bookingId ? { bookingId } : {}),
      };

      const result: VehicleAvailabilityResponse = await checkVehicleAvailabilityAction(
        availabilityPayload
      );

      if (!result.success) {
        scheduleAvailabilityUpdate({ status: "error", message: result.error });
        return;
      }

      if (result.status === "available") {
        scheduleAvailabilityUpdate({ status: "available" });
        return;
      }

      if (result.status === "booking_conflict") {
        scheduleAvailabilityUpdate({
          status: "booking_conflict",
          message: `Réservation existante (${result.conflict.reference}) du ${format(
            new Date(result.conflict.startDate),
            "dd/MM/yyyy HH:mm",
            { locale: fr }
          )} au ${format(new Date(result.conflict.endDate), "dd/MM/yyyy HH:mm", { locale: fr })}.`,
        });
        return;
      }

      if (result.status === "maintenance_conflict") {
        scheduleAvailabilityUpdate({
          status: "maintenance_conflict",
          message: `Maintenance planifiée (${result.maintenance.type.toLowerCase()}) du ${format(
            new Date(result.maintenance.startDate),
            "dd/MM/yyyy HH:mm",
            { locale: fr }
          )} au ${format(new Date(result.maintenance.endDate), "dd/MM/yyyy HH:mm", { locale: fr })}.`,
        });
      }
    });
  }, [vehicleId, startDate, endDate, isEditMode, bookingId, scheduleAvailabilityUpdate]);

  return {
    availability,
    isCheckingAvailability,
  };
}

