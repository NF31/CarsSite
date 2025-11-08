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
      const match = parsed.pathname.match(/\/(?:image|video|raw)\/upload\/(?:v\d+\/)?(.+)/);
      if (!match || !match[1]) {
        return null;
      }
      raw = match[1];
    } catch {
      return null;
    }
  }

  const lastSlash = raw.lastIndexOf("/");
  const lastSegment = lastSlash >= 0 ? raw.slice(lastSlash + 1) : raw;
  const lastDot = lastSegment.lastIndexOf(".");

  if (lastDot === -1) {
    return {
      publicId: raw,
      format: "pdf",
    };
  }

  const format = lastSegment.slice(lastDot + 1).toLowerCase();
  const publicId = raw.slice(0, raw.length - (lastSegment.length - lastDot));

  return {
    publicId,
    format: format || "pdf",
  };
}


