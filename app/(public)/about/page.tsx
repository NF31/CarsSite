import dynamic from "next/dynamic";

// Lazy load AboutPageClient (contient animations framer-motion)
const AboutPageClient = dynamic(
  () => import("./AboutPageClient").then((mod) => ({ default: mod.AboutPageClient })),
  {
    ssr: true, // On garde SSR pour le SEO
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    ),
  }
);

export default function AboutPage() {
  return <AboutPageClient />;
}

