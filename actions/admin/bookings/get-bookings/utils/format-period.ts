import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Formate une période de réservation
 */
export function formatPeriod(start: Date, end: Date): string {
  return `${format(start, "d MMMM yyyy 'à' HH:mm", { locale: fr })} → ${format(
    end,
    "d MMMM yyyy 'à' HH:mm",
    { locale: fr }
  )}`;
}

