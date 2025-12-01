"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Gauge, Users, Fuel, Calendar, Image as ImageIcon } from "lucide-react";
import { statusLabels, statusColors, categoryLabels, fuelTypeLabels, transmissionLabels } from "../constants";
import { VehicleActionsMenu } from "./vehicle-actions-menu";
import type { Vehicle } from "../types";

type VehicleTableRowFullProps = {
  vehicle: Vehicle;
  index: number;
  startIndex: number;
  onDeleteClick: (vehicle: Vehicle) => void;
};

export function VehicleTableRowFull({ vehicle, index, startIndex, onDeleteClick }: VehicleTableRowFullProps) {
  return (
    <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
      <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap text-center">
        <span className="inline-flex items-center justify-center w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 text-xs xl:text-sm font-bold shadow-sm border border-gray-300">
          {startIndex + index + 1}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="relative h-16 w-24 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
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
      </td>
      <td className="px-6 py-4">
        <div>
          <div className="font-semibold text-gray-900 text-base">
            {vehicle.brand} {vehicle.model}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {vehicle.year} • {vehicle.licensePlate}
          </div>
          <div className="mt-1">
            <Badge variant="outline" className="text-xs">
              {categoryLabels[vehicle.category]}
            </Badge>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span className="text-gray-700">{vehicle.mileage.toLocaleString()} km</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-gray-700">{vehicle.seats} places</span>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            <span className="text-gray-700">{fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}</span>
          </div>
          <div className="text-gray-700">{transmissionLabels[vehicle.transmission] || vehicle.transmission}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge className={statusColors[vehicle.status]}>{statusLabels[vehicle.status]}</Badge>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-primary">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(vehicle.pricePerDay)}
            <span className="text-xs text-muted-foreground font-normal">/jour</span>
          </div>
          {vehicle.pricePerWeek && (
            <div className="text-xs text-muted-foreground">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(vehicle.pricePerWeek)}
              /semaine
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Caution:{" "}
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(vehicle.deposit)}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm">
          <div className="font-medium text-gray-900">{vehicle.location.city}</div>
          <div className="text-muted-foreground text-xs">{vehicle.location.name}</div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-gray-700">{vehicle._count.bookings} réservations</span>
          </div>
          <div className="text-muted-foreground text-xs">{vehicle._count.reviews} avis</div>
        </div>
      </td>
      <td className="px-6 py-4 text-right whitespace-nowrap">
        <VehicleActionsMenu vehicle={vehicle} onDeleteClick={onDeleteClick} size="lg" />
      </td>
    </tr>
  );
}

