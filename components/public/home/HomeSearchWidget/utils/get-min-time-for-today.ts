/**
 * Calcule l'heure minimale pour aujourd'hui (heure actuelle, sans délai supplémentaire)
 */
export function getMinTimeForToday(): string {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  // Utiliser l'heure actuelle (pas de délai supplémentaire)
  return `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
}

