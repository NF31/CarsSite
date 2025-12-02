/**
 * Combine une date et une heure en un objet Date
 */
export function buildDateTime(dateString: string, timeString: string): Date | null {
  try {
    const [hours, minutes] = timeString.split(":").map(Number);
    
    const date = new Date(dateString);
    date.setHours(
      !isNaN(hours) ? hours : 0,
      !isNaN(minutes) ? minutes : 0,
      0,
      0
    );
    
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch {
    return null;
  }
}

