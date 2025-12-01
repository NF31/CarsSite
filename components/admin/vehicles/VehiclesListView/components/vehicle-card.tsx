"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Gauge, Users, Fuel, Calendar, Image as ImageIcon } from "lucide-react";
import { statusLabels, statusColors, categoryLabels, fuelTypeLabels, transmissionLabels } from "../constants";
import { VehicleActionsMenu } from "./vehicle-actions-menu";
import type { Vehicle } from "../types";

type VehicleCardProps = {
  vehicle: Vehicle;
  index: number;
  startIndex: number;
  onDeleteClick: (vehicle: Vehicle) => void;
};

export function VehicleCard({ vehicle, index, startIndex, onDeleteClick }: VehicleCardProps) {
  return (
    <div className="border rounded-lg p-3 sm:p-4 bg-white hover:shadow-lg transition-shadow">
      {/* Numéro de ligne pour mobile */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
        <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 text-[10px] sm:text-xs font-bold shadow-sm border border-gray-300">
          {startIndex + index + 1}
        </span>
        <VehicleActionsMenu vehicle={vehicle} onDeleteClick={onDeleteClick} size="md" />
      </div>
      <div className="flex gap-3 sm:gap-4">
        <div className="relative h-20 w-28 sm:h-24 sm:w-32 bg-gray-100 rounded overflow-hidden flex-shrink-0">
          {vehicle.images && vehicle.images.length > 0 ? (
            <Image
              src={vehicle.images[0]}
              alt={`${vehicle.brand} ${vehicle.model}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <div className="font-semibold text-gray-900 truncate text-sm sm:text-base">
              {vehicle.brand} {vehicle.model}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {vehicle.year} • {vehicle.licensePlate}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
            <Badge className={`${statusColors[vehicle.status]} text-xs`}>{statusLabels[vehicle.status]}</Badge>
            <Badge variant="outline" className="text-xs">
              {categoryLabels[vehicle.category]}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mb-2">
            <div className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Kilométrage:</span>
              <span className="font-medium">{vehicle.mileage.toLocaleString()} km</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Places:</span>
              <span className="font-medium">{vehicle.seats}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Carburant:</span>
              <span className="font-medium truncate">{fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Transmission:</span>
              <span className="font-medium truncate">
                {transmissionLabels[vehicle.transmission] || vehicle.transmission}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm border-t pt-2">
            <div>
              <span className="text-muted-foreground">Prix/jour:</span>{" "}
              <span className="font-semibold text-primary">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                }).format(vehicle.pricePerDay)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Localisation:</span>{" "}
              <span className="font-medium truncate">{vehicle.location.city}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Caution:</span>{" "}
              <span className="font-medium">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                }).format(vehicle.deposit)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Réservations:</span>{" "}
              <span className="font-medium">{vehicle._count.bookings}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

