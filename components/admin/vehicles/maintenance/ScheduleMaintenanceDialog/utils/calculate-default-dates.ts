import { format } from "date-fns";

/**
 * Calcule les dates par défaut pour une nouvelle maintenance
 */
export function calculateDefaultDates() {
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000);
  defaultStart.setMinutes(0, 0, 0);
  const defaultEnd = new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);
  
  return {
    startDate: format(defaultStart, "yyyy-MM-dd"),
    startTime: format(defaultStart, "HH:mm"),
    endDate: format(defaultEnd, "yyyy-MM-dd"),
    endTime: format(defaultEnd, "HH:mm"),
  };
}

