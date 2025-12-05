import dynamic from "next/dynamic";
import { HomeSectionTitleWrapper } from "@/components/public/home/HomeSectionTitleWrapper";

// Lazy load composants avec animations non critiques pour améliorer les performances
const HomeCategories = dynamic(
  () => import("@/components/public/home/HomeCategories").then((mod) => ({ default: mod.HomeCategories })),
  { ssr: true }
);

const HomeAdvantages = dynamic(
  () => import("@/components/public/home/HomeAdvantages").then((mod) => ({ default: mod.HomeAdvantages })),
  { ssr: true }
);

const HomePopularVehicles = dynamic(
  () => import("@/components/public/home/HomePopularVehicles").then((mod) => ({ default: mod.HomePopularVehicles })),
  { ssr: true }
);

// Lazy load HomeHero (contient Google Maps via HomeSearchWidget)
const HomeHero = dynamic(
  () => import("@/components/public/home/HomeHero").then((mod) => ({ default: mod.HomeHero })),
  {
    ssr: true, // On garde SSR pour le SEO
    loading: () => (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    ),
  }
);

// Lazy load HomeMapSection (contient Google Maps)
const HomeMapSection = dynamic(
  () => import("@/components/public/home/HomeMapSection").then((mod) => ({ default: mod.HomeMapSection })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section avec widget de recherche */}
      <HomeHero />

      {/* Section Catégories */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        <HomeSectionTitleWrapper
          title="Choisissez votre catégorie"
          description="Des véhicules pour tous les besoins et tous les budgets"
        />
        <HomeCategories />
      </section>

      {/* Section Avantages */}
      <section className="bg-muted/30 py-12 sm:py-16 md:py-20 lg:py-24 w-full">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HomeSectionTitleWrapper
            title="Pourquoi choisir CarRental ?"
            description="Des avantages qui font la différence"
          />
          <HomeAdvantages />
        </div>
      </section>

      {/* Section Véhicules Populaires */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        <HomeSectionTitleWrapper
          title="Nos véhicules disponibles"
          description="Découvrez notre sélection de véhicules récents et bien entretenus"
        />
        <HomePopularVehicles />
      </section>

      {/* Section Google Maps pour les trajets */}
      <section className="bg-muted/30 py-12 sm:py-16 md:py-20 lg:py-24 w-full">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HomeSectionTitleWrapper
            title="Trouvez nos agences"
            description="Localisez nos points de location et planifiez votre trajet"
          />
          <HomeMapSection />
        </div>
      </section>
    </div>
  );
}
