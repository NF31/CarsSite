import { useState, useEffect, useRef } from "react";
import type { Vehicle } from "../types";

export function useImageCarousel(vehicle: Vehicle | null, vehicleId: string | null) {
  const prevVehicleIdRef = useRef<string | null>(vehicleId);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Réinitialiser l'index quand le véhicule change
  useEffect(() => {
    if (prevVehicleIdRef.current !== vehicleId) {
      prevVehicleIdRef.current = vehicleId;
      // Utiliser setTimeout pour rendre l'appel asynchrone et éviter les cascading renders
      const timeoutId = setTimeout(() => {
        setCurrentImageIndex(0);
        setIsAutoPlaying(true);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
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

  const nextImage = () => {
    if (!vehicle?.images) return;
    setIsAutoPlaying(false);
    setCurrentImageIndex((prev) => (prev + 1) % vehicle.images.length);
  };

  const prevImage = () => {
    if (!vehicle?.images) return;
    setIsAutoPlaying(false);
    setCurrentImageIndex((prev) => (prev - 1 + vehicle.images.length) % vehicle.images.length);
  };

  const goToImage = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentImageIndex(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying((prev) => !prev);
  };

  return {
    currentImageIndex,
    isAutoPlaying,
    nextImage,
    prevImage,
    goToImage,
    toggleAutoPlay,
  };
}

