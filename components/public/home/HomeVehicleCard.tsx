"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Users, Gauge } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { m as motion } from "framer-motion";

interface HomeVehicleCardProps {
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    category: string;
    pricePerDay: number;
    images: string[];
    seats: number;
    transmission: string;
    fuelType: string;
    location: {
      id: string;
      name: string;
      city: string;
      address?: string;
    };
    rating: number;
    reviewCount: number;
    bookingCount: number;
  };
}

const categoryLabels: Record<string, string> = {
  ECONOMY: "Économique",
  COMPACT: "Compact",
  SUV: "SUV",
  LUXURY: "Luxe",
};

const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuelle",
  AUTOMATIC: "Automatique",
};

const fuelTypeLabels: Record<string, string> = {
  PETROL: "Essence",
  DIESEL: "Diesel",
  ELECTRIC: "Électrique",
  HYBRID: "Hybride",
};

export function HomeVehicleCard({ vehicle }: HomeVehicleCardProps) {
  const mainImage = vehicle.images[0] || "/placeholder-car.jpg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="group h-full flex flex-col overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-xl">
        <CardHeader className="p-0 relative">
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src={mainImage}
              alt={`${vehicle.brand} ${vehicle.model}`}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-background/90">
                {categoryLabels[vehicle.category] || vehicle.category}
              </Badge>
            </div>
            {vehicle.rating > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/90 px-2 py-1 rounded-md">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-bold">{vehicle.rating}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-4">
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{vehicle.year}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{vehicle.seats} places</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Gauge className="w-4 h-4" />
              <span>{transmissionLabels[vehicle.transmission]}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {fuelTypeLabels[vehicle.fuelType]}
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <MapPin className="w-4 h-4" />
            <span>{vehicle.location.city}</span>
          </div>

          {vehicle.reviewCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {vehicle.reviewCount} avis • {vehicle.bookingCount} réservations
            </p>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-primary">
              {vehicle.pricePerDay.toFixed(0)}€
            </p>
            <p className="text-xs text-muted-foreground">par jour</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href={`/vehicles/${vehicle.id}`}>Voir détails</Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

