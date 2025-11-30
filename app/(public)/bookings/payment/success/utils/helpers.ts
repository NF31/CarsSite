/**
 * Utilitaires pour la page de succès de paiement
 */

/**
 * Extrait l'heure d'une date au format HH:mm
 */
export function extractTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Détermine le message de salutation (Bonjour/Bonsoir)
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  return hour >= 18 ? "Bonsoir" : "Bonjour";
}

