"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { m as motion } from "framer-motion";

// Composant pour Google Maps (embed standard comme sur la page contact)
function GoogleMapEmbed() {
  return (
    <div className="aspect-video w-full overflow-hidden bg-slate-100">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937596!2d2.2922926156746234!3d48.85837007928746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sTour%20Eiffel!5e0!3m2!1sfr!2sfr!4v1234567890"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Localisation CarRental - 123 Avenue de la République, 75011 Paris"
        className="w-full h-full"
      />
    </div>
  );
}

const locations = [
  {
    id: 1,
    name: "Agence Paris Centre",
    address: "123 Avenue des Champs-Élysées, 75008 Paris",
    phone: "+33 1 23 45 67 89",
    email: "paris@carrental.fr",
    hours: "Lun-Dim: 8h-20h",
  },
  {
    id: 2,
    name: "Agence Lyon",
    address: "45 Rue de la République, 69002 Lyon",
    phone: "+33 4 12 34 56 78",
    email: "lyon@carrental.fr",
    hours: "Lun-Dim: 8h-20h",
  },
  {
    id: 3,
    name: "Agence Marseille",
    address: "78 La Canebière, 13001 Marseille",
    phone: "+33 4 91 23 45 67",
    email: "marseille@carrental.fr",
    hours: "Lun-Dim: 8h-20h",
  },
];

export function HomeMapSection() {
  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      {/* Carte Google Maps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
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
            <GoogleMapEmbed />
            <div className="p-4 sm:p-6 text-center bg-muted/30">
              <address className="not-italic text-base sm:text-lg font-semibold text-foreground mb-2 break-words">
                123 Avenue de la République
                <br />
                75011 Paris, France
              </address>
              <a
                href="https://www.google.com/maps/search/?api=1&query=123+Avenue+de+la+République+75011+Paris"
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

      {/* Liste des agences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full"
      >
        {locations.map((location) => (
          <Card
            key={location.id}
            className="border-2 border-transparent hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-xl h-full w-full"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {location.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                {location.address}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {location.phone}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {location.email}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {location.hours}
              </p>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  );
}

