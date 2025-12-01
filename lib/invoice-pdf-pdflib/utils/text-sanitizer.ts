/**
 * Nettoie une chaîne de caractères en remplaçant les caractères Unicode non supportés
 * par WinAnsi (notamment l'espace insécable fin 0x202f) par des caractères ASCII équivalents
 */
export function sanitizeText(text: string): string {
  if (!text) return "";
  return String(text)
    .replace(/\u202F/g, " ") // Espace insécable fin → espace normal
    .replace(/\u00A0/g, " ") // Espace insécable → espace normal
    .replace(/\u2009/g, " ") // Espace fine → espace normal
    .replace(/\u2006/g, " ") // Espace six-per-em → espace normal
    .normalize("NFKD") // Normaliser les caractères Unicode
    .replace(/[\u0300-\u036F]/g, ""); // Supprimer les diacritiques combinés
}

