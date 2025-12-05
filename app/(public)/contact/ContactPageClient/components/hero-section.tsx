import { Sparkles } from "lucide-react";
import { motion } from "@/components/ui/motion";

export function HeroSection() {
  return (
    <section className="relative min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 overflow-hidden w-full">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12 sm:py-16 md:py-20 lg:py-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto w-full"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>Contactez notre équipe</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 text-foreground px-2">
            Nous sommes là pour vous aider
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 font-medium px-4">
            Une question ? Un besoin particulier ? Notre équipe est disponible pour répondre à toutes vos demandes.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

