import type { VehicleCategory, TransmissionType, FuelType } from "@prisma/client";

export const categoryOptions: { value: VehicleCategory; label: string }[] = [
  { value: "ECONOMY", label: "Économique" },
  { value: "COMPACT", label: "Compact" },
  { value: "MID_SIZE", label: "Moyenne" },
  { value: "FULL_SIZE", label: "Grande" },
  { value: "SUV", label: "SUV" },
  { value: "LUXURY", label: "Luxe" },
  { value: "VAN", label: "Utilitaire" },
];

export const transmissionOptions: { value: TransmissionType; label: string }[] = [
  { value: "MANUAL", label: "Manuelle" },
  { value: "AUTOMATIC", label: "Automatique" },
];

export const fuelTypeOptions: { value: FuelType; label: string }[] = [
  { value: "PETROL", label: "Essence" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Électrique" },
  { value: "HYBRID", label: "Hybride" },
];

export const availableFeatures = [
  "GPS",
  "Bluetooth",
  "Climatisation",
  "Caméra de recul",
  "Aide au stationnement",
  "Toit ouvrant",
  "Sièges chauffants",
  "Volant cuir",
  "Système audio premium",
  "Wi-Fi",
  "Chargeur sans fil",
  "Détecteur d'angle mort",
];

const currentYear = new Date().getFullYear();
export const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

