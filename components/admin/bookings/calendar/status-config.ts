import type { BookingCalendarEvent } from "@/actions/admin/bookings";

export const STATUS_CONFIG: Record<
  BookingCalendarEvent["status"],
  {
    label: string;
    description: string;
    className: string;
    badgeClass: string;
    legendClass: string;
    headerClass: string;
    borderColor: string;
    backgroundColor: string;
    textColor: string;
  }
> = {
  PENDING: {
    label: "En attente",
    description: "Réservation en cours de validation",
    className: "status-pending",
    badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
    legendClass: "from-amber-50 via-amber-100 to-amber-200 border-amber-200 text-amber-900",
    headerClass: "bg-gradient-to-br from-amber-50 via-amber-100 to-white text-amber-900",
    borderColor: "#d97706",
    backgroundColor: "#f59e0b",
    textColor: "#ffffff",
  },
  CONFIRMED: {
    label: "Confirmée",
    description: "Réservation validée prêt à démarrer",
    className: "status-confirmed",
    badgeClass: "bg-blue-100 text-blue-800 border border-blue-200",
    legendClass: "from-blue-50 via-blue-100 to-blue-200 border-blue-200 text-blue-900",
    headerClass: "bg-gradient-to-br from-blue-50 via-blue-100 to-white text-blue-900",
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
    textColor: "#1d4ed8",
  },
  IN_PROGRESS: {
    label: "En cours",
    description: "Trajet actuellement en cours",
    className: "status-in-progress",
    badgeClass: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    legendClass: "from-indigo-50 via-indigo-100 to-indigo-200 border-indigo-200 text-indigo-900",
    headerClass: "bg-gradient-to-br from-indigo-50 via-indigo-100 to-white text-indigo-900",
    borderColor: "#1d4ed8",
    backgroundColor: "#3b82f6",
    textColor: "#ffffff",
  },
  COMPLETED: {
    label: "Terminée",
    description: "Trajet clôturé et facturé",
    className: "status-completed",
    badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    legendClass: "from-emerald-50 via-emerald-100 to-emerald-200 border-emerald-200 text-emerald-900",
    headerClass: "bg-gradient-to-br from-emerald-50 via-emerald-100 to-white text-emerald-900",
    borderColor: "#059669",
    backgroundColor: "#34d399",
    textColor: "#ffffff",
  },
  CANCELLED: {
    label: "Annulée",
    description: "Réservation annulée (client ou admin)",
    className: "status-cancelled",
    badgeClass: "bg-rose-100 text-rose-800 border border-rose-200",
    legendClass: "from-rose-50 via-rose-100 to-rose-200 border-rose-200 text-rose-900",
    headerClass: "bg-gradient-to-br from-rose-50 via-rose-100 to-white text-rose-900",
    borderColor: "#dc2626",
    backgroundColor: "#ef4444",
    textColor: "#ffffff",
  },
};

export const LEGEND_ORDER: BookingCalendarEvent["status"][] = [
  "CONFIRMED",
  "IN_PROGRESS",
  "PENDING",
  "COMPLETED",
  "CANCELLED",
];

