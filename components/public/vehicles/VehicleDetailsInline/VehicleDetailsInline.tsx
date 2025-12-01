"use client";

import { m } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VehicleDetailsInlineProps } from "./types";
import { useVehicleData } from "./hooks/use-vehicle-data";
import { useImageCarousel } from "./hooks/use-image-carousel";
import { calculatePrice } from "./utils/price-calculation";
import { LoadingState } from "./components/loading-state";
import { ErrorState } from "./components/error-state";
import { ImageCarousel } from "./components/image-carousel";
import { VehicleInfo } from "./components/vehicle-info";
import { PriceCard } from "./components/price-card";
import { CharacteristicsCard } from "./components/characteristics-card";
import { LocationCard } from "./components/location-card";
import { FeaturesCard } from "./components/features-card";
import { DescriptionCard } from "./components/description-card";
import { BookButton } from "./components/book-button";

export function VehicleDetailsInline(props: VehicleDetailsInlineProps) {
  const { vehicleId, startDate, endDate, startTime, endTime, onClose } = props;
  const { vehicle, loading, error } = useVehicleData(vehicleId);
  const carousel = useImageCarousel(vehicle, vehicleId);

  if (!vehicleId) {
    return null;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !vehicle) {
    return <ErrorState error={error} />;
  }

  const priceCalculation = calculatePrice(vehicle, startDate, endDate, startTime, endTime);

  return (
    <m.div
      key={vehicleId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white rounded-lg border-2 border-primary/20 p-4 sm:p-6 shadow-xl lg:sticky lg:top-4"
    >
      <div className="flex items-start justify-between mb-4">
        <m.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl sm:text-2xl font-bold"
        >
          Détails du véhicule
        </m.h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <ImageCarousel
          vehicle={vehicle}
          currentImageIndex={carousel.currentImageIndex}
          isAutoPlaying={carousel.isAutoPlaying}
          onNext={carousel.nextImage}
          onPrev={carousel.prevImage}
          onGoToImage={carousel.goToImage}
          onToggleAutoPlay={carousel.toggleAutoPlay}
        />

        <m.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="space-y-6"
        >
          <VehicleInfo vehicle={vehicle} />
          <PriceCard vehicle={vehicle} priceCalculation={priceCalculation} />
          <CharacteristicsCard vehicle={vehicle} />
          <LocationCard vehicle={vehicle} />
          <FeaturesCard vehicle={vehicle} />
          <DescriptionCard vehicle={vehicle} />
          <BookButton vehicle={vehicle} props={props} />
        </m.div>
      </div>
    </m.div>
  );
}

