import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function capitalize(value: string) {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return capitalize(format(date, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr }));
}

