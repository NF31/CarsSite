import { sanitizeText } from "./text-sanitizer";

export function formatDate(date: Date): string {
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  // Nettoyer le texte pour supprimer les caractères Unicode non supportés
  return sanitizeText(formatted);
}

export function formatCurrency(amount: number): string {
  // Utiliser une locale qui n'introduit pas d'espaces insécables
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    // Forcer un espace normal comme séparateur de milliers
    useGrouping: true,
  }).format(amount);
  // Nettoyer le texte pour supprimer les caractères Unicode non supportés (0x202f)
  return sanitizeText(formatted);
}

