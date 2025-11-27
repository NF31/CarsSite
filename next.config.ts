import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  // Configuration pour augmenter la limite de taille du body pour les Server Actions
  // Note: serverActions.bodySizeLimit est disponible dans Next.js 16 mais peut ne pas être dans les types
  serverActions: {
    bodySizeLimit: "10mb", // Limite de 10 MB pour l'upload de permis de conduire (PDF)
  },
} as NextConfig & {
  serverActions?: {
    bodySizeLimit?: string;
  };
};

export default nextConfig;
