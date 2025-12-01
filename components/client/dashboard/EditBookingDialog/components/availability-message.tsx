"use client";

import { cn } from "@/lib/utils";
import type { AvailabilityState } from "../types";

type AvailabilityMessageProps = {
  availabilityState: AvailabilityState;
  isCheckingAvailability: boolean;
};

export function AvailabilityMessage({ availabilityState, isCheckingAvailability }: AvailabilityMessageProps) {
  const availabilityMessage =
    availabilityState.status === "checking" || isCheckingAvailability
      ? "Vérification des disponibilités en cours..."
      : availabilityState.status === "available"
      ? "Le véhicule est disponible pour les dates sélectionnées."
      : availabilityState.status === "booking_conflict" || availabilityState.status === "maintenance_conflict"
      ? availabilityState.message
      : availabilityState.status === "error"
      ? availabilityState.message
      : "Sélectionnez vos nouvelles dates pour vérifier la disponibilité.";

  const availabilityClassName = cn(
    "rounded-md border px-3 py-2 text-sm transition-colors",
    availabilityState.status === "available"
      ? "border-green-200 bg-green-50 text-green-700"
      : availabilityState.status === "booking_conflict" || availabilityState.status === "maintenance_conflict"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : availabilityState.status === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-slate-200 bg-slate-50 text-muted-foreground"
  );

  return <div className={availabilityClassName}>{availabilityMessage}</div>;
}

