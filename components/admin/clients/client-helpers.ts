import type { ClientStatus } from "@/actions/admin/clients";
import { ShieldAlert, UserCheck, UserMinus } from "lucide-react";

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  LOCKED: "Verrouillé",
};

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-slate-100 text-slate-700 border-slate-200",
  LOCKED: "bg-amber-50 text-amber-700 border-amber-200",
};

export const CLIENT_STATUS_ICONS: Record<ClientStatus, typeof UserCheck> = {
  ACTIVE: UserCheck,
  INACTIVE: UserMinus,
  LOCKED: ShieldAlert,
};

export const clientDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export const clientDateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});


