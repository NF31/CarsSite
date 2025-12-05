import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true, // Ouvre automatiquement le navigateur
});

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
  // Optimisations de performance
  compiler: {
    // Supprimer les console.log en production
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
};

export default withBundleAnalyzer(nextConfig);
