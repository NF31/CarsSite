import {
  CheckCircle2,
  Calendar,
  Wrench,
  XCircle,
} from "lucide-react";
import type { FuelType } from "@/lib/types/fuel-type";
import type { TransmissionType } from "@/lib/types/transmission-type";
import type { VehicleCategory } from "@/lib/types/vehicle-category";
import type { VehicleStatus } from "@/lib/types/vehicle-status";

export const statusLabels: Record<VehicleStatus, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  MAINTENANCE: "Maintenance",
  UNAVAILABLE: "Indisponible",
};

export const statusColors: Record<VehicleStatus, string> = {
  AVAILABLE: "bg-green-100 text-green-800 border-green-300",
  RESERVED: "bg-blue-100 text-blue-800 border-blue-300",
  MAINTENANCE: "bg-orange-100 text-orange-800 border-orange-300",
  UNAVAILABLE: "bg-red-100 text-red-800 border-red-300",
};

export const statusIcons: Record<VehicleStatus, typeof CheckCircle2> = {
  AVAILABLE: CheckCircle2,
  RESERVED: Calendar,
  MAINTENANCE: Wrench,
  UNAVAILABLE: XCircle,
};

export const categoryLabels: Record<VehicleCategory, string> = {
  ECONOMY: "Économique",
  COMPACT: "Compact",
  MID_SIZE: "Moyenne",
  FULL_SIZE: "Grande",
  SUV: "SUV",
  LUXURY: "Luxe",
  VAN: "Utilitaire",
};

export const fuelTypeLabels: Record<FuelType, string> = {
  PETROL: "Essence",
  DIESEL: "Diesel",
  ELECTRIC: "Électrique",
  HYBRID: "Hybride",
};

export const transmissionLabels: Record<TransmissionType, string> = {
  MANUAL: "Manuelle",
  AUTOMATIC: "Automatique",
};

