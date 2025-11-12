import { HomeCategories } from "@/components/public/home/HomeCategories";
import { HomeAdvantages } from "@/components/public/home/HomeAdvantages";
import { HomePopularVehicles } from "@/components/public/home/HomePopularVehicles";
import { HomeTestimonials } from "@/components/public/home/HomeTestimonials";
import { HomeMapSection } from "@/components/public/home/HomeMapSection";
import { HomeHero } from "@/components/public/home/HomeHero";
import { HomeSectionTitle } from "@/components/public/home/HomeSectionTitle";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section avec widget de recherche */}
      <HomeHero />

      {/* Section Catégories */}
      <section className="container py-16 md:py-24">
        <HomeSectionTitle
          title="Choisissez votre catégorie"
          description="Des véhicules pour tous les besoins et tous les budgets"
        />
        <HomeCategories />
      </section>

      {/* Section Avantages */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <HomeSectionTitle
            title="Pourquoi choisir CarRental ?"
            description="Des avantages qui font la différence"
          />
          <HomeAdvantages />
        </div>
      </section>

      {/* Section Véhicules Populaires */}
      <section className="container py-16 md:py-24">
        <HomeSectionTitle
          title="Nos véhicules les plus populaires"
          description="Découvrez notre sélection de véhicules les plus appréciés"
        />
        <HomePopularVehicles />
      </section>

      {/* Section Google Maps pour les trajets */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <HomeSectionTitle
            title="Trouvez nos agences"
            description="Localisez nos points de location et planifiez votre trajet"
          />
          <HomeMapSection />
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="container py-16 md:py-24">
        <HomeSectionTitle
          title="Ce que disent nos clients"
          description="Des milliers de clients satisfaits nous font confiance"
        />
        <HomeTestimonials />
      </section>
    </div>
  );
}
