/**
 * Formate une date ISO en format datetime-local pour les inputs HTML
 * @param input - Date au format ISO string
 * @returns Date formatée au format YYYY-MM-DDTHH:mm ou chaîne vide si invalide
 */
export function formatDateTimeLocal(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  date.setSeconds(0, 0);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

