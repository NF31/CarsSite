"use client";

import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Vehicle } from "../types";

type ImageCarouselProps = {
  vehicle: Vehicle;
  currentImageIndex: number;
  isAutoPlaying: boolean;
  onNext: () => void;
  onPrev: () => void;
  onGoToImage: (index: number) => void;
  onToggleAutoPlay: () => void;
};

export function ImageCarousel({
  vehicle,
  currentImageIndex,
  isAutoPlaying,
  onNext,
  onPrev,
  onGoToImage,
  onToggleAutoPlay,
}: ImageCarouselProps) {
  const images = vehicle.images || [];
  const mainImage = images[0] || "/placeholder-car.jpg";

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="space-y-4"
    >
      {/* Image principale avec carrousel */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl group">
        <AnimatePresence mode="wait">
          <m.div
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
          </m.div>
        </AnimatePresence>

        {/* Boutons navigation */}
        {images.length > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-label="Image suivante"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Indicateurs de position */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleAutoPlay}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-opacity duration-300"
              aria-label={isAutoPlaying ? "Arrêter le défilement automatique" : "Démarrer le défilement automatique"}
              title={isAutoPlaying ? "Arrêter" : "Démarrer"}
            >
              {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex gap-2">
              {images.map((_: string, index: number) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  onClick={() => onGoToImage(index)}
                  className={`h-2 rounded-full transition-all duration-300 p-0 min-w-0 ${
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
            <m.div
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative aspect-video w-full"
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => onGoToImage(index)}
                className={`relative h-full w-full overflow-hidden rounded-lg border-2 p-0 transition-all ${
                  index === currentImageIndex
                    ? "border-primary"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
                aria-label={`Afficher l'image ${index + 1} de ${vehicle.brand} ${vehicle.model}`}
              >
                <Image
                  src={image}
                  alt={`${vehicle.brand} ${vehicle.model} - Vue ${index + 1}`}
                  fill
                  sizes="(max-width: 1024px) 25vw, 12.5vw"
                  className="object-cover"
                />
              </Button>
            </m.div>
          ))}
        </div>
      )}
    </m.div>
  );
}

