import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { motion } from "@/components/ui/motion";

interface MapSectionProps {
  embedUrl: string;
  searchUrl: string;
  address: {
    street: string;
    city: string;
  };
}

export function MapSection({ embedUrl, searchUrl, address }: MapSectionProps) {
  return (
    <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20 w-full">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        <Card className="border-2 shadow-xl overflow-hidden w-full">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="rounded-xl bg-primary/20 p-2 sm:p-3 flex-shrink-0">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl mb-1 break-words">Notre localisation</CardTitle>
                <CardDescription className="text-sm sm:text-base break-words">
                  Retrouvez-nous dans notre agence parisienne
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-video w-full overflow-hidden bg-slate-100">
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Localisation CarRental - ${address.street}, ${address.city}`}
                className="w-full h-full"
              />
            </div>
            <div className="p-4 sm:p-6 text-center bg-muted/30">
              <address className="not-italic text-base sm:text-lg font-semibold text-foreground mb-2 break-words">
                {address.street}
                <br />
                {address.city}
              </address>
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary hover:underline transition-all group"
              >
                Voir sur Google Maps
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}

