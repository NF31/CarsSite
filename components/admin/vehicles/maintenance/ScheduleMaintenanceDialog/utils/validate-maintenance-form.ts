import type { MaintenanceRecord } from "@/actions/admin/vehicles/get-maintenance";

export type ValidationErrors = Record<string, string[]>;

export interface ValidationContext {
  mode: "create" | "edit";
  vehicleId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  cost: string;
  maintenance?: MaintenanceRecord | null;
  now: Date;
}

/**
 * Valide le formulaire de maintenance
 */
export function validateMaintenanceForm(context: ValidationContext): ValidationErrors | null {
  const { mode, vehicleId, startDate, endDate, startTime, endTime, cost, maintenance, now } = context;

  const errors: ValidationErrors = {};

  if (!vehicleId) {
    errors.vehicleId = ["Veuillez sélectionner un véhicule"];
  }

  if (!startDate || !endDate) {
    errors.dates = ["Les dates de début et de fin sont requises"];
    return errors;
  }

  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    errors.dates = ["Dates invalides"];
    return errors;
  }

  if (mode === "create") {
    if (start < now) {
      errors.dates = ["La date et l'heure de début doivent être dans le futur"];
    }
    if (end < now) {
      errors.dates = ["La date et l'heure de fin doivent être dans le futur"];
    }
  }

  if (mode === "edit" && maintenance) {
    const existingStart = new Date(maintenance.startDate);
    const hasStarted = existingStart <= now;
    
    if (hasStarted && start < existingStart) {
      errors.dates = ["Impossible d'avancer l'heure de début après démarrage"];
    }
  }

  if (end <= start) {
    errors.dates = ["La date de fin doit être postérieure à la date de début"];
  }

  const numericCost = Number.parseFloat(cost.replace(",", "."));
  if (Number.isNaN(numericCost) || numericCost < 0) {
    errors.cost = ["Le coût doit être un nombre positif"];
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

