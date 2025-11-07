"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createMaintenanceAction } from "@/actions/admin/vehicles/create-maintenance";
import { updateMaintenanceAction } from "@/actions/admin/vehicles/update-maintenance";
import type { MaintenanceVehicleOption } from "@/actions/admin/vehicles/get-maintenance-vehicles";
import type { MaintenanceRecord } from "@/actions/admin/vehicles/get-maintenance";
import { MaintenanceType } from "@prisma/client";
import { format } from "date-fns";
import { CalendarDays, StickyNote, Wrench } from "lucide-react";

type DialogMode = "create" | "edit";

interface ScheduleMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  vehicles: MaintenanceVehicleOption[];
  maintenance?: MaintenanceRecord | null;
  onSuccess?: (maintenance: MaintenanceRecord) => void;
  defaultVehicleId?: string;
}

const typeOptions = [
  { value: MaintenanceType.SERVICE, label: "Entretien" },
  { value: MaintenanceType.REPAIR, label: "Réparation" },
  { value: MaintenanceType.INSPECTION, label: "Inspection" },
  { value: MaintenanceType.BLOCKED, label: "Blocage de dates" },
];

export function ScheduleMaintenanceDialog({
  open,
  onOpenChange,
  mode,
  vehicles,
  maintenance,
  onSuccess,
  defaultVehicleId,
}: ScheduleMaintenanceDialogProps) {
  const now = new Date();
  const [vehicleId, setVehicleId] = useState<string>("");
  const [type, setType] = useState<MaintenanceType>(MaintenanceType.SERVICE);
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endDate, setEndDate] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("18:00");
  const [cost, setCost] = useState<string>("0");
  const [description, setDescription] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [isPending, startTransition] = useTransition();

  const title = mode === "create" ? "Planifier une maintenance" : "Modifier la maintenance";
  const actionLabel = mode === "create" ? "Planifier" : "Mettre à jour";

  const defaultDates = useMemo(() => {
    const defaultStart = new Date(now.getTime() + 60 * 60 * 1000);
    defaultStart.setMinutes(0, 0, 0);
    const defaultEnd = new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);
    return {
      startDate: format(defaultStart, "yyyy-MM-dd"),
      startTime: format(defaultStart, "HH:mm"),
      endDate: format(defaultEnd, "yyyy-MM-dd"),
      endTime: format(defaultEnd, "HH:mm"),
    };
  }, []);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && maintenance) {
        setVehicleId(maintenance.vehicleId);
        setType(maintenance.type);
        const start = new Date(maintenance.startDate);
        const end = new Date(maintenance.endDate);
        setStartDate(format(start, "yyyy-MM-dd"));
        setStartTime(format(start, "HH:mm"));
        setEndDate(format(end, "yyyy-MM-dd"));
        setEndTime(format(end, "HH:mm"));
        setCost(String(maintenance.cost));
        setDescription(maintenance.description ?? "");
        setNotes(maintenance.notes ?? "");
      } else {
        const fallbackVehicle =
          defaultVehicleId ??
          vehicles.find((v) => v.activeMaintenances === 0)?.id ??
          vehicles[0]?.id ??
          "";
        setVehicleId(fallbackVehicle);
        setType(MaintenanceType.SERVICE);
        setStartDate(defaultDates.startDate);
        setStartTime(defaultDates.startTime);
        setEndDate(defaultDates.endDate);
        setEndTime(defaultDates.endTime);
        setCost("0");
        setDescription("");
        setNotes("");
      }
      setError(null);
      setFieldErrors(null);
    }
  }, [open, mode, maintenance, vehicles, defaultVehicleId, defaultDates]);

  const todayIso = format(now, "yyyy-MM-dd");
  const existingStart = maintenance ? new Date(maintenance.startDate) : null;
  const existingEnd = maintenance ? new Date(maintenance.endDate) : null;
  const hasStarted = Boolean(existingStart && existingStart <= now);
  const hasEnded = Boolean(existingEnd && existingEnd < now);
  const isExisting = mode === "edit" && Boolean(maintenance);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors(null);

    if (hasEnded) {
      setError("Impossible de modifier une intervention déjà terminée.");
      return;
    }

    if (!vehicleId) {
      setFieldErrors({ vehicleId: ["Veuillez sélectionner un véhicule"] });
      return;
    }

    if (!startDate || !endDate) {
      setFieldErrors({ dates: ["Les dates de début et de fin sont requises"] });
      return;
    }

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setFieldErrors({ dates: ["Dates invalides"] });
      return;
    }

    if (mode === "create" && start < now) {
      setFieldErrors({
        dates: ["La date et l'heure de début doivent être dans le futur"],
      });
      return;
    }

    if (mode === "create" && end < now) {
      setFieldErrors({
        dates: ["La date et l'heure de fin doivent être dans le futur"],
      });
      return;
    }

    if (mode === "edit" && hasStarted && existingStart && start < existingStart) {
      setFieldErrors({
        dates: ["Impossible d'avancer l'heure de début après démarrage"],
      });
      return;
    }

    if (end <= start) {
      setFieldErrors({
        dates: ["La date de fin doit être postérieure à la date de début"],
      });
      return;
    }

    const numericCost = Number.parseFloat(cost.replace(",", "."));
    if (Number.isNaN(numericCost) || numericCost < 0) {
      setFieldErrors({ cost: ["Le coût doit être un nombre positif"] });
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          const result = await createMaintenanceAction({
            vehicleId,
            type,
            startDate: start,
            endDate: end,
            cost: numericCost,
            description: description.trim() || undefined,
            notes: notes.trim() || undefined,
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
            type,
            startDate: start,
            endDate: end,
            cost: numericCost,
            description: description.trim() || undefined,
            notes: notes.trim() || undefined,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,560px)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Sélectionnez un véhicule, définissez les dates et la nature de l'intervention."
              : "Ajustez les informations et les dates pour cette intervention."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance-vehicle">Véhicule</Label>
              <Select
                value={vehicleId}
                onValueChange={setVehicleId}
                disabled={mode === "edit" || vehicles.length === 0 || isPending || hasEnded}
              >
                <SelectTrigger id="maintenance-vehicle" className="w-full">
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                      {vehicle.activeMaintenances > 0
                        ? ` • ${vehicle.activeMaintenances} maintenance(s)`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors?.vehicleId && (
                <p className="text-xs text-red-500">{fieldErrors.vehicleId[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-type">Type de maintenance</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as MaintenanceType)}
                disabled={isPending || hasEnded}
              >
                <SelectTrigger id="maintenance-type" className="w-full">
                  <SelectValue placeholder="Type d'intervention" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Début
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  min={todayIso}
                  disabled={isPending || hasStarted || hasEnded}
                  className="w-full"
                />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  min={
                    mode === "create" && startDate === todayIso
                      ? format(new Date(now.getTime() + 15 * 60 * 1000), "HH:mm")
                      : undefined
                  }
                  disabled={isPending || hasStarted || hasEnded}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Fin
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  min={startDate || todayIso}
                  disabled={isPending || hasEnded}
                  className="w-full"
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  min={startDate === endDate ? startTime : undefined}
                  disabled={isPending || hasEnded}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          {fieldErrors?.dates && (
            <p className="text-xs text-red-500">{fieldErrors.dates[0]}</p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance-cost">Coût estimé</Label>
              <Input
                id="maintenance-cost"
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
                disabled={isPending || hasEnded}
                className="w-full"
              />
              {fieldErrors?.cost && (
                <p className="text-xs text-red-500">{fieldErrors.cost[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-notes" className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-primary" />
                Notes internes
              </Label>
              <Textarea
                id="maintenance-notes"
                rows={3}
                placeholder="Informations internes, pièces commandées, suivi..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={isPending || hasEnded}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance-description">Description</Label>
            <Textarea
              id="maintenance-description"
              rows={4}
              placeholder="Détails visibles par les autres administrateurs (travaux, prestataire, etc.)"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isPending || hasEnded}
              className="w-full"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-md p-3">
              {error}
            </p>
          )}

          {hasEnded && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
              Cette intervention est terminée. Les dates et le contenu ne peuvent plus être modifiés.
            </p>
          )}

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending || hasEnded}
              className="w-full sm:w-auto"
            >
              {actionLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

