"use client";

import { format } from "date-fns";
import { Wrench } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ScheduleMaintenanceDialogProps } from "./ScheduleMaintenanceDialog/types";
import { useMaintenanceForm, useMaintenanceSubmit } from "./ScheduleMaintenanceDialog/hooks";
import {
  VehicleSelect,
  TypeSelect,
  DateRangeInputs,
  CostAndNotesInputs,
  DescriptionInput,
  ErrorBanner,
  EndedWarning,
} from "./ScheduleMaintenanceDialog/components";

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
  const todayIso = format(now, "yyyy-MM-dd");

  const form = useMaintenanceForm({
    open,
    mode,
    vehicles,
    maintenance,
    defaultVehicleId,
  });

  const { error, fieldErrors, isPending, handleSubmit } = useMaintenanceSubmit({
    mode,
    maintenance,
    onSuccess,
    onOpenChange,
  });

  const title = mode === "create" ? "Planifier une maintenance" : "Modifier la maintenance";
  const actionLabel = mode === "create" ? "Planifier" : "Mettre à jour";

  const existingStart = maintenance ? new Date(maintenance.startDate) : null;
  const existingEnd = maintenance ? new Date(maintenance.endDate) : null;
  const hasStarted = Boolean(existingStart && existingStart <= now);
  const hasEnded = Boolean(existingEnd && existingEnd < now);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (hasEnded) {
      return;
    }

    handleSubmit({
      vehicleId: form.vehicleId,
      type: form.type,
      startDate: form.startDate,
      startTime: form.startTime,
      endDate: form.endDate,
      endTime: form.endTime,
      cost: form.cost,
      description: form.description,
      notes: form.notes,
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

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <VehicleSelect
              vehicleId={form.vehicleId}
              onValueChange={form.setVehicleId}
              vehicles={vehicles}
              mode={mode}
              isPending={isPending}
              hasEnded={hasEnded}
              error={fieldErrors?.vehicleId}
            />
            <TypeSelect
              type={form.type}
              onValueChange={form.setType}
              isPending={isPending}
              hasEnded={hasEnded}
            />
          </div>

          <DateRangeInputs
            startDate={form.startDate}
            startTime={form.startTime}
            endDate={form.endDate}
            endTime={form.endTime}
            onStartDateChange={form.setStartDate}
            onStartTimeChange={form.setStartTime}
            onEndDateChange={form.setEndDate}
            onEndTimeChange={form.setEndTime}
            mode={mode}
            todayIso={todayIso}
            now={now}
            isPending={isPending}
            hasStarted={hasStarted}
            hasEnded={hasEnded}
            error={fieldErrors?.dates}
          />

          <CostAndNotesInputs
            cost={form.cost}
            notes={form.notes}
            onCostChange={form.setCost}
            onNotesChange={form.setNotes}
            isPending={isPending}
            hasEnded={hasEnded}
            costError={fieldErrors?.cost}
          />

          <DescriptionInput
            description={form.description}
            onDescriptionChange={form.setDescription}
            isPending={isPending}
            hasEnded={hasEnded}
          />

          {error && <ErrorBanner message={error} />}
          {hasEnded && <EndedWarning />}

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || hasEnded} className="w-full sm:w-auto">
              {actionLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
