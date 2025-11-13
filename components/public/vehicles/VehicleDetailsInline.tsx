"use client";

import { useState, useEffect } from "react";
import { getPublicVehicleByIdAction } from "@/actions/public/vehicles/get-by-id";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Star,
  Users,
  Gauge,
  Fuel,
  Palette,
  Shield,
  CheckCircle2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  GaugeCircle,
  Play,
  Pause,
} from "lucide-react";
import Link from "next/link";
import { m as motion, AnimatePresence } from "framer-motion";

interface VehicleDetailsInlineProps {
  vehicleId: string | null;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  pickup?: string;
  returnLocation?: string;
  onClose: () => void;
}

const categoryLabels: Record<string, string> = {
  ECONOMY: "Économique",
  COMPACT: "Compact",
  MID_SIZE: "Moyenne",
  FULL_SIZE: "Grande",
  SUV: "SUV",
  LUXURY: "Luxe",
  VAN: "Utilitaire",
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

export function VehicleDetailsInline({
  vehicleId,
  startDate,
  endDate,
  startTime,
  endTime,
  pickup,
  returnLocation,
  onClose,
}: VehicleDetailsInlineProps) {
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!vehicleId) {
      setVehicle(null);
      return;
    }

    setLoading(true);
    setError(null);

    getPublicVehicleByIdAction(vehicleId)
      .then((result) => {
        if (result.success && result.data) {
          setVehicle(result.data);
        } else {
          setError(result.error || "Erreur lors du chargement");
        }
      })
      .catch((err) => {
        setError("Erreur lors du chargement");
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [vehicleId]);

  // Réinitialiser l'index quand le véhicule change
  useEffect(() => {
    setCurrentImageIndex(0);
    setIsAutoPlaying(true);
  }, [vehicleId]);

  // Défilement automatique des images
  useEffect(() => {
    if (!vehicle || !vehicle.images || vehicle.images.length <= 1) {
      return;
    }

    if (!isAutoPlaying) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % vehicle.images.length);
    }, 3000); // Change d'image toutes les 3 secondes

    return () => clearInterval(interval);
  }, [vehicle, isAutoPlaying]);

  if (!vehicleId) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-lg">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{error || "Véhicule introuvable"}</p>
        </div>
      </div>
    );
  }

  const mainImage = vehicle.images[0] || "/placeholder-car.jpg";
  const images = vehicle.images || [];

  // Calculer le montant total si les dates sont fournies
  let totalAmount: number | null = null;
  let numberOfDays: number | null = null;

  if (startDate && endDate) {
    const startDateStr = startDate;
    const endDateStr = endDate;
    const startTimeStr = startTime || "10:00";
    const endTimeStr = endTime || "10:00";

    const [startHours, startMinutes] = startTimeStr.split(":").map(Number);
    const [endHours, endMinutes] = endTimeStr.split(":").map(Number);

    const start = new Date(
      `${startDateStr}T${String(startHours || 10).padStart(2, "0")}:${String(startMinutes || 0).padStart(2, "0")}:00`
    );
    const end = new Date(
      `${endDateStr}T${String(endHours || 10).padStart(2, "0")}:${String(endMinutes || 0).padStart(2, "0")}:00`
    );

    const diffMs = end.getTime() - start.getTime();
    const msPerDay = 1000 * 60 * 60 * 24;
    const exactDays = diffMs / msPerDay;
    numberOfDays = Math.max(exactDays, 1);
    totalAmount = numberOfDays * vehicle.pricePerDay;
  }

  const nextImage = () => {
    setIsAutoPlaying(false); // Arrêter le défilement automatique quand on clique manuellement
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setIsAutoPlaying(false); // Arrêter le défilement automatique quand on clique manuellement
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setIsAutoPlaying(false); // Arrêter le défilement automatique quand on clique manuellement
    setCurrentImageIndex(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying((prev) => !prev);
  };

  return (
    <motion.div
      key={vehicleId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white rounded-lg border-2 border-primary/20 p-4 sm:p-6 shadow-xl lg:sticky lg:top-4"
    >
        <div className="flex items-start justify-between mb-4">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl sm:text-2xl font-bold"
          >
            Détails du véhicule
          </motion.h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Carrousel d'images avec Framer Motion */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="space-y-4"
          >
            {/* Image principale avec carrousel */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={images[currentImageIndex] || mainImage}
                    alt={`${vehicle.brand} ${vehicle.model} - Image ${currentImageIndex + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Boutons navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    aria-label="Image précédente"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    aria-label="Image suivante"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Indicateurs de position */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                  <button
                    onClick={toggleAutoPlay}
                    className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-opacity duration-300"
                    aria-label={isAutoPlaying ? "Arrêter le défilement automatique" : "Démarrer le défilement automatique"}
                    title={isAutoPlaying ? "Arrêter" : "Démarrer"}
                  >
                    {isAutoPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex gap-2">
                    {images.map((_: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentImageIndex
                            ? "w-8 bg-white"
                            : "w-2 bg-white/50 hover:bg-white/75"
                        }`}
                        aria-label={`Aller à l'image ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Miniatures */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((image: string, index: number) => (
                  <motion.button
                    key={index}
                    onClick={() => goToImage(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative aspect-video w-full overflow-hidden rounded-lg border-2 transition-all ${
                      index === currentImageIndex
                        ? "border-primary"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${vehicle.brand} ${vehicle.model} - Vue ${index + 1}`}
                      fill
                      sizes="(max-width: 1024px) 25vw, 12.5vw"
                      className="object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

        {/* Informations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black mb-2">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-base sm:text-lg text-muted-foreground">
                  {vehicle.year} • {categoryLabels[vehicle.category] || vehicle.category}
                </p>
              </div>
              {vehicle.rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-1"
                >
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-bold">{vehicle.rating}</span>
                  {vehicle.reviewCount > 0 && (
                    <span className="text-sm text-muted-foreground">
                      ({vehicle.reviewCount} avis)
                    </span>
                  )}
                </motion.div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-2 mb-6"
            >
              <Badge variant="secondary">
                {categoryLabels[vehicle.category] || vehicle.category}
              </Badge>
              <Badge variant="outline">
                {transmissionLabels[vehicle.transmission] || vehicle.transmission}
              </Badge>
              <Badge variant="outline">
                {fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}
              </Badge>
            </motion.div>
          </motion.div>

          {/* Prix */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardContent className="p-6">
              {totalAmount !== null && numberOfDays !== null ? (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-primary">
                      {totalAmount.toFixed(2)}€
                    </span>
                    <span className="text-sm text-muted-foreground">
                      pour{" "}
                      {numberOfDays % 1 === 0
                        ? numberOfDays.toFixed(0)
                        : numberOfDays.toFixed(2)}{" "}
                      jour{numberOfDays > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.pricePerDay.toFixed(0)}€ par jour
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-primary">
                      {vehicle.pricePerDay.toFixed(0)}€
                    </span>
                    <span className="text-sm text-muted-foreground">par jour</span>
                  </div>
                  {vehicle.pricePerWeek && (
                    <p className="text-sm text-muted-foreground">
                      {vehicle.pricePerWeek.toFixed(0)}€ par semaine
                    </p>
                  )}
                  {vehicle.pricePerMonth && (
                    <p className="text-sm text-muted-foreground">
                      {vehicle.pricePerMonth.toFixed(0)}€ par mois
                    </p>
                  )}
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Caution : {vehicle.deposit.toFixed(0)}€</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Caractéristiques */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Caractéristiques</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Places</p>
                    <p className="font-semibold">{vehicle.seats}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Transmission</p>
                    <p className="font-semibold">
                      {transmissionLabels[vehicle.transmission] || vehicle.transmission}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Carburant</p>
                    <p className="font-semibold">
                      {fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Couleur</p>
                    <p className="font-semibold">{vehicle.color}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GaugeCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Kilométrage</p>
                    <p className="font-semibold">
                      {vehicle.mileage?.toLocaleString("fr-FR") || "0"} km
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Localisation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card>
              <CardContent className="p-6">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">{vehicle.location.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.location.city}
                    {vehicle.location.address && ` • ${vehicle.location.address}`}
                  </p>
                </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Équipements */}
          {vehicle.features && vehicle.features.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card>
                <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Équipements</h3>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Description */}
          {vehicle.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Card>
                <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {vehicle.description}
                </p>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Bouton réserver */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button size="lg" className="w-full" asChild>
            <Link
              href={`/bookings/new?vehicleId=${vehicle.id}${
                startDate ? `&startDate=${startDate}` : ""
              }${endDate ? `&endDate=${endDate}` : ""}${
                startTime ? `&startTime=${startTime}` : ""
              }${endTime ? `&endTime=${endTime}` : ""}${
                pickup ? `&pickup=${encodeURIComponent(pickup)}` : ""
              }${
                returnLocation
                  ? `&returnLocation=${encodeURIComponent(returnLocation)}`
                  : ""
              }`}
            >
              Réserver maintenant
            </Link>
          </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

