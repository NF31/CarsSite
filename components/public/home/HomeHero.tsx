"use client";

import { HomeSearchWidget } from "./HomeSearchWidget";
import { m as motion } from "framer-motion";

export function HomeHero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0" />
      
      <div className="container relative z-10 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 text-foreground">
            Trouvez votre véhicule idéal
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto font-medium">
            Réservez facilement votre voiture en ligne. Large choix de véhicules,
            tarifs transparents, réservation en 4 étapes simples.
          </p>
        </motion.div>

        {/* Widget de recherche */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <HomeSearchWidget />
        </motion.div>
      </div>
    </section>
  );
}

