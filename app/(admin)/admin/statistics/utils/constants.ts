import { BookingStatus } from "@/lib/types/booking-status";
import type { VehicleCategory } from "@/lib/types/vehicle-category";

export const statusLabels: Record<
  BookingStatus,
  { label: string; description: string; badgeVariant: "default" | "secondary" | "outline" }
> = {
  PENDING: { label: "En attente", description: "Réservations à confirmer", badgeVariant: "secondary" },
  CONFIRMED: { label: "Confirmées", description: "Réservations validées", badgeVariant: "default" },
  IN_PROGRESS: { label: "En cours", description: "Véhicules en utilisation", badgeVariant: "default" },
  COMPLETED: { label: "Terminées", description: "Réservations clôturées", badgeVariant: "outline" },
  CANCELLED: { label: "Annulées", description: "Réservations annulées", badgeVariant: "outline" },
};

export type CategoryKey = VehicleCategory | "UNKNOWN";

export const vehicleCategoryLabels: Record<CategoryKey, string> = {
  ECONOMY: "Économique",
  COMPACT: "Compacte",
  MID_SIZE: "Intermédiaire",
  FULL_SIZE: "Grande",
  SUV: "SUV",
  LUXURY: "Luxe",
  VAN: "Utilitaire",
  UNKNOWN: "Non renseigné",
};

export const weekdayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export const revenueStatuses: BookingStatus[] = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"];

