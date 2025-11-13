"use client";

import { useState } from "react";
import { HomeVehicleCard } from "@/components/public/home/HomeVehicleCard";
import { VehicleDetailsInline } from "@/components/public/vehicles/VehicleDetailsInline";
import { VehiclesFilters } from "@/components/public/vehicles/VehiclesFilters";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AnimatePresence, m as motion } from "framer-motion";

interface Vehicle {
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
    address: string;
  };
  rating: number;
  reviewCount: number;
  bookingCount: number;
}

interface VehiclesPageClientProps {
  vehicles: Vehicle[];
  total: number;
  totalPages: number;
  page: number;
  category?: string;
  pickup?: string;
  pickupPlaceId?: string;
  returnLocation?: string;
  returnPlaceId?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  transmission?: string;
  minSeats?: number;
  maxPrice?: number;
  fuelType?: string;
  sortBy?: string;
}

export function VehiclesPageClient({
  vehicles,
  total,
  totalPages,
  page,
  category,
  pickup,
  pickupPlaceId,
  returnLocation,
  returnPlaceId,
  startDate,
  endDate,
  startTime,
  endTime,
  transmission,
  minSeats,
  maxPrice,
  fuelType,
  sortBy,
}: VehiclesPageClientProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const handleVehicleClick = (vehicleId: string) => {
    if (selectedVehicleId === vehicleId) {
      // Si on clique sur le même véhicule, fermer les détails
      setSelectedVehicleId(null);
    } else {
      // Sinon, afficher les détails du nouveau véhicule
      setSelectedVehicleId(vehicleId);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filtres mobile */}
      <div className="lg:hidden">
        <VehiclesFilters mobile />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr]">
        {/* Filtres desktop */}
        <div className="hidden lg:block">
          <VehiclesFilters />
        </div>

        {/* Grille de véhicules et détails */}
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => handleVehicleClick(vehicle.id)}
                className={`cursor-pointer transition-all ${
                  selectedVehicleId === vehicle.id
                    ? "ring-2 ring-primary rounded-lg"
                    : "hover:scale-[1.02]"
                }`}
              >
                <HomeVehicleCard
                  vehicle={vehicle}
                  startDate={startDate}
                  endDate={endDate}
                  startTime={startTime}
                  endTime={endTime}
                  isSelected={selectedVehicleId === vehicle.id}
                />
              </div>
            ))}
          </div>

          {/* Détails inline du véhicule sélectionné */}
          <AnimatePresence mode="wait">
            {selectedVehicleId && (
              <motion.div
                key={selectedVehicleId}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="mb-8 overflow-hidden"
              >
                <VehicleDetailsInline
                  vehicleId={selectedVehicleId}
                  startDate={startDate}
                  endDate={endDate}
                  startTime={startTime}
                  endTime={endTime}
                  pickup={pickup}
                  returnLocation={returnLocation}
                  onClose={() => setSelectedVehicleId(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2 pt-4 sm:pt-6">
              {page > 1 && (
                <Button asChild variant="outline" className="w-full sm:w-auto px-4 text-sm">
                  <Link
                    href={`/vehicles?${new URLSearchParams({
                      ...(category && { category }),
                      ...(pickup && { pickup }),
                      ...(pickupPlaceId && { pickupPlaceId }),
                      ...(returnLocation && { returnLocation }),
                      ...(returnPlaceId && { returnPlaceId }),
                      ...(startDate && { startDate }),
                      ...(endDate && { endDate }),
                      ...(startTime && { startTime }),
                      ...(endTime && { endTime }),
                      ...(transmission && { transmission }),
                      ...(minSeats && { minSeats: String(minSeats) }),
                      ...(maxPrice && { maxPrice: String(maxPrice) }),
                      ...(fuelType && { fuelType }),
                      ...(sortBy && { sortBy }),
                      page: String(page - 1),
                    }).toString()}`}
                  >
                    Précédent
                  </Link>
                </Button>
              )}
              <span className="text-xs sm:text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </span>
              {page < totalPages && (
                <Button asChild variant="outline" className="w-full sm:w-auto px-4 text-sm">
                  <Link
                    href={`/vehicles?${new URLSearchParams({
                      ...(category && { category }),
                      ...(pickup && { pickup }),
                      ...(pickupPlaceId && { pickupPlaceId }),
                      ...(returnLocation && { returnLocation }),
                      ...(returnPlaceId && { returnPlaceId }),
                      ...(startDate && { startDate }),
                      ...(endDate && { endDate }),
                      ...(startTime && { startTime }),
                      ...(endTime && { endTime }),
                      ...(transmission && { transmission }),
                      ...(minSeats && { minSeats: String(minSeats) }),
                      ...(maxPrice && { maxPrice: String(maxPrice) }),
                      ...(fuelType && { fuelType }),
                      ...(sortBy && { sortBy }),
                      page: String(page + 1),
                    }).toString()}`}
                  >
                    Suivant
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

