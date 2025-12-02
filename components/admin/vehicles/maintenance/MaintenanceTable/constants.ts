import { MaintenanceStatus, MaintenanceType } from "@prisma/client";

export const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.SCHEDULED]: "Planifiée",
  [MaintenanceStatus.IN_PROGRESS]: "En cours",
  [MaintenanceStatus.COMPLETED]: "Terminée",
  [MaintenanceStatus.CANCELLED]: "Annulée",
};

export const STATUS_CLASSES: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.SCHEDULED]: "bg-amber-100 text-amber-800 border-amber-200",
  [MaintenanceStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800 border-blue-200",
  [MaintenanceStatus.COMPLETED]: "bg-emerald-100 text-emerald-700 border-emerald-200",
  [MaintenanceStatus.CANCELLED]: "bg-gray-200 text-gray-600 border-gray-300",
};

export const TYPE_LABELS: Record<MaintenanceType, string> = {
  [MaintenanceType.SERVICE]: "Entretien",
  [MaintenanceType.REPAIR]: "Réparation",
  [MaintenanceType.INSPECTION]: "Inspection",
  [MaintenanceType.BLOCKED]: "Blocage",
};

export const CURRENCY_FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

