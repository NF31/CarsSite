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
  // Note: Dans Next.js 16, cette option peut être configurée via experimental.serverActions
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Limite de 10 MB pour l'upload de permis de conduire (PDF)
    },
  },
};

export default nextConfig;
