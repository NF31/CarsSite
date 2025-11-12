"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { m as motion } from "framer-motion";

// Composant pour Google Maps (à intégrer avec votre clé API)
function GoogleMapEmbed() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">
          Clé API Google Maps non configurée
        </p>
      </div>
    );
  }

  // Coordonnées par défaut (Paris)
  const defaultLat = 48.8566;
  const defaultLng = 2.3522;
  const zoom = 12;

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border-2">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=Paris,France&zoom=${zoom}&center=${defaultLat},${defaultLng}`}
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
    <div className="space-y-8">
      {/* Carte Google Maps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <GoogleMapEmbed />
      </motion.div>

      {/* Liste des agences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {locations.map((location) => (
          <Card
            key={location.id}
            className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg"
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

