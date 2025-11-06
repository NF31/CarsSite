export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ValidationResult {
  // Validation du type de fichier
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Le fichier "${file.name}" n'est pas un format d'image valide. Formats acceptés: JPG, PNG, GIF, WebP`,
    };
  }

  // Vérifier l'extension
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `L'extension du fichier "${file.name}" n'est pas autorisée.`,
    };
  }

  // Validation de la taille (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return {
      valid: false,
      error: `Le fichier "${file.name}" est trop volumineux (max 10MB).`,
    };
  }

  return { valid: true };
}

export function validateImageCount(
  currentCount: number,
  filesToAdd: number,
  maxImages: number
): ValidationResult {
  const remainingSlots = maxImages - currentCount;
  if (filesToAdd > remainingSlots) {
    return {
      valid: false,
      error: `Vous ne pouvez ajouter que ${remainingSlots} image${remainingSlots > 1 ? "s" : ""} supplémentaire${remainingSlots > 1 ? "s" : ""}.`,
    };
  }

  return { valid: true };
}

