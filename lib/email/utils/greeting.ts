/**
 * Génère une salutation selon l'heure actuelle
 * @returns "Bonjour" si avant 18h, "Bonsoir" sinon
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  return hour >= 18 ? "Bonsoir" : "Bonjour";
}

