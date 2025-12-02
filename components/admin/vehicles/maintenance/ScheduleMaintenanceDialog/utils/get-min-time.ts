import { format } from "date-fns";

/**
 * Calcule l'heure minimum pour le champ time
 */
export function getMinTime(
  mode: "create" | "edit",
  startDate: string,
  todayIso: string,
  now: Date
): string | undefined {
  if (mode === "create" && startDate === todayIso) {
    return format(new Date(now.getTime() + 15 * 60 * 1000), "HH:mm");
  }
  return undefined;
}

