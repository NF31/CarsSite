export interface CloudinaryAssetInfo {
  publicId: string;
  format: string;
}

export function extractCloudinaryAssetInfo(value: string | null | undefined): CloudinaryAssetInfo | null {
  if (!value) {
    return null;
  }

  let raw = value.trim();

  if (raw.length === 0) {
    return null;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const parsed = new URL(raw);
      // Gérer les URLs privées avec /private/
      // Format: /raw/private/s--[signature]--/v[version]/[path]
      const privateMatch = parsed.pathname.match(/\/raw\/private\/s--[^\/]+--\/v\d+\/(.+?)(?:\?|$)/);
      if (privateMatch && privateMatch[1]) {
        raw = privateMatch[1];
      } else {
        // URLs publiques standard
        const match = parsed.pathname.match(/\/(?:image|video|raw)\/upload\/(?:v\d+\/)?(.+)/);
        if (!match || !match[1]) {
          return null;
        }
        raw = match[1];
      }
    } catch {
      return null;
    }
  }

  // Extraire le format (extension) si présent
  const lastDot = raw.lastIndexOf(".");
  let format = "pdf";
  let publicIdWithoutFormat = raw;

  if (lastDot !== -1) {
    const potentialFormat = raw.slice(lastDot + 1).toLowerCase();
    // Vérifier si c'est une extension valide
    if (["pdf", "jpg", "jpeg", "png", "gif", "webp"].includes(potentialFormat)) {
      format = potentialFormat;
      publicIdWithoutFormat = raw.slice(0, lastDot);
    }
  }

  // Le public_id doit conserver le dossier complet (ex: "vehicles/{vehicleId}/invoices/{userId}/invoice-XXX")
  return {
    publicId: publicIdWithoutFormat,
    format,
  };
}


