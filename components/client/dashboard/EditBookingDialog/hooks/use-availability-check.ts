import { useState, useEffect, useTransition, useCallback } from "react";
import { checkClientBookingAvailabilityAction } from "@/actions/client/bookings/check-availability";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { AvailabilityState } from "../types";
import { formatDateTimeLocal } from "../utils/helpers";

export function useAvailabilityCheck(
  bookingId: string,
  open: boolean,
  startValue: string,
  endValue: string,
  startDate: string,
  endDate: string
) {
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>({ status: "idle" });
  const [isCheckingAvailability, startAvailabilityTransition] = useTransition();

  const scheduleAvailabilityUpdate = useCallback(
    (nextState: AvailabilityState) => {
      startAvailabilityTransition(() => {
        setAvailabilityState(nextState);
      });
    },
    [startAvailabilityTransition]
  );

  useEffect(() => {
    if (!open) {
      scheduleAvailabilityUpdate({ status: "idle" });
      return;
    }

    const start = startValue ? new Date(startValue) : null;
    const end = endValue ? new Date(endValue) : null;
    const now = new Date();

    if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
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

    if (start <= now) {
      scheduleAvailabilityUpdate({
        status: "error",
        message: "La date de départ doit être dans le futur.",
      });
      return;
    }

    if (end <= now) {
      scheduleAvailabilityUpdate({
        status: "error",
        message: "La date de fin doit être dans le futur.",
      });
      return;
    }

    const originalStart = formatDateTimeLocal(startDate);
    const originalEnd = formatDateTimeLocal(endDate);
    // Si les dates n'ont pas changé, afficher une disponibilité neutre
    if (startValue === originalStart && endValue === originalEnd) {
      scheduleAvailabilityUpdate({ status: "available" });
      return;
    }

    scheduleAvailabilityUpdate({ status: "checking" });
    startAvailabilityTransition(async () => {
      const result = await checkClientBookingAvailabilityAction({
        bookingId,
        startDate: new Date(startValue).toISOString(),
        endDate: new Date(endValue).toISOString(),
      });

      if (!result.success) {
        scheduleAvailabilityUpdate({
          status: "error",
          message: result.error ?? "Impossible de vérifier la disponibilité.",
        });
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
  }, [
    bookingId,
    endDate,
    endValue,
    open,
    scheduleAvailabilityUpdate,
    startAvailabilityTransition,
    startDate,
    startValue,
  ]);

  return {
    availabilityState,
    isCheckingAvailability,
    isSubmitDisabled:
      availabilityState.status === "checking" ||
      isCheckingAvailability ||
      availabilityState.status === "booking_conflict" ||
      availabilityState.status === "maintenance_conflict" ||
      availabilityState.status === "error",
  };
}

