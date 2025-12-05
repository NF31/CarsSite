"use client";

import { HomeSearchWidget } from "./HomeSearchWidget";
import { motion } from "@/components/ui/motion";

export function HomeHero() {
  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0" />
      
      <div className="container px-4 sm:px-6 lg:px-8 relative z-10 py-12 sm:py-16 md:py-20 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 sm:mb-6 text-foreground px-2">
            Trouvez votre véhicule idéal
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto font-medium px-4">
            Réservez facilement votre voiture en ligne. Large choix de véhicules,
            tarifs transparents, réservation en 4 étapes simples.
          </p>
        </motion.div>

        {/* Widget de recherche */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="px-2 sm:px-0"
        >
          <HomeSearchWidget />
        </motion.div>
      </div>
    </section>
  );
}


