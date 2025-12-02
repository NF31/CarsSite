/**
 * Génère les initiales à partir du nom de l'agence
 */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "AG";
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

