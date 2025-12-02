/**
 * Formate les horaires d'ouverture pour l'affichage
 */
export function formatOpeningHours(openingHours: string): string[] {
  const lines = openingHours
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return ["Horaires non renseignés"];
  }

  return lines;
}

