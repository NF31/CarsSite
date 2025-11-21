import { HomeCategories } from "@/components/public/home/HomeCategories";
import { HomeAdvantages } from "@/components/public/home/HomeAdvantages";
import { HomePopularVehicles } from "@/components/public/home/HomePopularVehicles";
import { HomeMapSection } from "@/components/public/home/HomeMapSection";
import { HomeHero } from "@/components/public/home/HomeHero";
import { HomeSectionTitle } from "@/components/public/home/HomeSectionTitle";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section avec widget de recherche */}
      <HomeHero />

      {/* Section Catégories */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        <HomeSectionTitle
          title="Choisissez votre catégorie"
          description="Des véhicules pour tous les besoins et tous les budgets"
        />
        <HomeCategories />
      </section>

      {/* Section Avantages */}
      <section className="bg-muted/30 py-12 sm:py-16 md:py-20 lg:py-24 w-full">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HomeSectionTitle
            title="Pourquoi choisir CarRental ?"
            description="Des avantages qui font la différence"
          />
          <HomeAdvantages />
        </div>
      </section>

      {/* Section Véhicules Populaires */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        <HomeSectionTitle
          title="Nos véhicules disponibles"
          description="Découvrez notre sélection de véhicules récents et bien entretenus"
        />
        <HomePopularVehicles />
      </section>

      {/* Section Google Maps pour les trajets */}
      <section className="bg-muted/30 py-12 sm:py-16 md:py-20 lg:py-24 w-full">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HomeSectionTitle
            title="Trouvez nos agences"
            description="Localisez nos points de location et planifiez votre trajet"
          />
          <HomeMapSection />
        </div>
      </section>
    </div>
  );
}
