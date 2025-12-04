import { MaintenanceType } from "@/lib/types/maintenance-type";
import type { MaintenanceTypeOption } from "./types";

export const TYPE_OPTIONS: MaintenanceTypeOption[] = [
  { value: MaintenanceType.SERVICE, label: "Entretien" },
  { value: MaintenanceType.REPAIR, label: "Réparation" },
  { value: MaintenanceType.INSPECTION, label: "Inspection" },
  { value: MaintenanceType.BLOCKED, label: "Blocage de dates" },
];

