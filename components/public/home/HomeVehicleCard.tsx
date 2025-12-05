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
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isSelected?: boolean;
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

export function HomeVehicleCard({ vehicle, startDate, endDate, startTime, endTime, isSelected = false }: HomeVehicleCardProps) {
  const mainImage = vehicle.images[0] || "/placeholder-car.jpg";
  
  // Calculer le montant total si les dates sont fournies
  let totalAmount: number | null = null;
  let numberOfDays: number | null = null;
  
  if (startDate && endDate) {
    // Créer les dates avec les heures précises
    // Utiliser le format ISO pour éviter les problèmes de fuseau horaire
    const startDateStr = startDate; // Format: "YYYY-MM-DD"
    const endDateStr = endDate; // Format: "YYYY-MM-DD"
    
    // Parser les heures (format: "HH:MM")
    const startTimeStr = startTime || "10:00";
    const endTimeStr = endTime || "10:00";
    
    // Créer les dates complètes avec heures en utilisant le fuseau horaire local
    const [startHours, startMinutes] = startTimeStr.split(":").map(Number);
    const [endHours, endMinutes] = endTimeStr.split(":").map(Number);
    
    // Créer les objets Date avec date et heure précises
    const start = new Date(`${startDateStr}T${String(startHours || 10).padStart(2, "0")}:${String(startMinutes || 0).padStart(2, "0")}:00`);
    const end = new Date(`${endDateStr}T${String(endHours || 10).padStart(2, "0")}:${String(endMinutes || 0).padStart(2, "0")}:00`);
    
    // Calculer la différence en millisecondes
    const diffMs = end.getTime() - start.getTime();
    
    // Convertir en jours avec prorata (facturation précise basée sur les heures)
    // Exemple : 2 jours + 3 heures = 2.125 jours facturés
    const msPerDay = 1000 * 60 * 60 * 24;
    const exactDays = diffMs / msPerDay;
    numberOfDays = Math.max(exactDays, 1); // Minimum 1 jour (arrondi à 2 décimales pour l'affichage)
    
    // Calculer le montant total avec prorata
    totalAmount = numberOfDays * vehicle.pricePerDay;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="group h-full flex flex-col overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-xl">
        <CardHeader className="p-0 relative">
          <div className="relative w-full h-40 sm:h-48 overflow-hidden">
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

        <CardContent className="flex-1 p-3 sm:p-4">
          <div className="text-lg sm:text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-1">
            {vehicle.brand} {vehicle.model}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{vehicle.year}</p>

          <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{vehicle.seats} places</span>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <Gauge className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{transmissionLabels[vehicle.transmission]}</span>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {fuelTypeLabels[vehicle.fuelType]}
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{vehicle.location.city}</span>
          </div>

          {vehicle.reviewCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {vehicle.reviewCount} avis • {vehicle.bookingCount} réservations
            </p>
          )}
        </CardContent>

        <CardFooter className="p-3 sm:p-4 pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="w-full sm:w-auto">
            {totalAmount !== null && numberOfDays !== null ? (
              <>
                <p className="text-xl sm:text-2xl font-black text-primary">
                  {totalAmount.toFixed(2)}€
                </p>
                <p className="text-xs text-muted-foreground">
                  {numberOfDays >= 1 && numberOfDays < 1.01 ? (
                    <>pour {numberOfDays.toFixed(0)} jour</>
                  ) : numberOfDays % 1 === 0 ? (
                    <>pour {numberOfDays.toFixed(0)} jour{numberOfDays > 1 ? "s" : ""}</>
                  ) : (
                    <>pour {numberOfDays.toFixed(2)} jour{numberOfDays > 1 ? "s" : ""}</>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ({vehicle.pricePerDay.toFixed(0)}€/jour)
                </p>
              </>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-black text-primary">
                  {vehicle.pricePerDay.toFixed(0)}€
                </p>
                <p className="text-xs text-muted-foreground">par jour</p>
              </>
            )}
          </div>
          <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-sm">
            {isSelected ? "Voir moins" : "Voir détails"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

