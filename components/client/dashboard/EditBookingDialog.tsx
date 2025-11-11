"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateClientBookingAction } from "@/actions/client/bookings/update-booking";
import { checkClientBookingAvailabilityAction } from "@/actions/client/bookings/check-availability";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EditBookingDialogProps {
  bookingId: string;
  startDate: string;
  endDate: string;
  disabled?: boolean;
}

function formatDateTimeLocal(dateValue: string) {
  const date = new Date(dateValue);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function minDateTimeValue(offsetMinutes = 0) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + offsetMinutes);
  return formatDateTimeLocal(date.toISOString());
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? "Enregistrement..." : "Enregistrer les nouvelles dates"}
    </Button>
  );
}

export function EditBookingDialog({
  bookingId,
  startDate,
  endDate,
  disabled = false,
}: EditBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const initialState = useMemo(() => ({ success: false, error: undefined as string | undefined }), []);
  const [state, action] = useActionState(updateClientBookingAction, initialState);
const [availabilityState, setAvailabilityState] = useState<
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "booking_conflict"; message: string }
  | { status: "maintenance_conflict"; message: string }
  | { status: "error"; message: string }
>({ status: "idle" });
const [isCheckingAvailability, startAvailabilityTransition] = useTransition();
  const scheduleAvailabilityUpdate = useCallback(
    (nextState: typeof availabilityState) => {
      startAvailabilityTransition(() => {
        setAvailabilityState(nextState);
      });
    },
    [startAvailabilityTransition],
  );


  const [startValue, setStartValue] = useState(() => formatDateTimeLocal(startDate));
  const [endValue, setEndValue] = useState(() => formatDateTimeLocal(endDate));

  useEffect(() => {
    if (!open) {
      return;
    }
    startTransition(() => {
      setStartValue(formatDateTimeLocal(startDate));
      setEndValue(formatDateTimeLocal(endDate));
    });
  }, [open, startDate, endDate]);

  useEffect(() => {
    if (!state.success) {
      return;
    }
    startTransition(() => {
      setOpen(false);
    });
  }, [state.success]);

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
            { locale: fr },
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
            { locale: fr },
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
      : "border-slate-200 bg-slate-50 text-muted-foreground",
  );

  const isSubmitDisabled =
    availabilityState.status === "checking" ||
    isCheckingAvailability ||
    availabilityState.status === "booking_conflict" ||
    availabilityState.status === "maintenance_conflict" ||
    availabilityState.status === "error";

  const minStart = useMemo(() => minDateTimeValue(30), []);
  const minEnd = useMemo(() => {
    const start = new Date(startValue);
    if (Number.isNaN(start.getTime())) {
      return minStart;
    }
    start.setHours(start.getHours() + 1);
    return formatDateTimeLocal(start.toISOString());
  }, [startValue, minStart]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          Modifier la réservation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier les dates de la réservation</DialogTitle>
          <DialogDescription>
            Sélectionnez de nouvelles dates de départ et de retour. La réservation passera en
            statut <span className="font-semibold text-primary">En attente</span> jusqu&apos;à
            validation par un administrateur.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="bookingId" value={bookingId} />
          <div className="space-y-3">
            <div className="space-y-2">
              <label htmlFor={`start-${bookingId}`} className="text-sm font-medium text-gray-900">
                Nouvelle date de départ
              </label>
              <Input
                id={`start-${bookingId}`}
                name="startDate"
                type="datetime-local"
                value={startValue}
                min={minStart}
                onChange={(event) => setStartValue(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={`end-${bookingId}`} className="text-sm font-medium text-gray-900">
                Nouvelle date de retour
              </label>
              <Input
                id={`end-${bookingId}`}
                name="endDate"
                type="datetime-local"
                value={endValue}
                min={startValue > minEnd ? startValue : minEnd}
                onChange={(event) => setEndValue(event.target.value)}
                required
              />
            </div>
            <div className={availabilityClassName}>{availabilityMessage}</div>
          </div>
          {state.error ? (
            <p className="text-sm font-medium text-red-600">{state.error}</p>
          ) : null}
          <div className="flex justify-end">
            <SubmitButton disabled={isSubmitDisabled} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

