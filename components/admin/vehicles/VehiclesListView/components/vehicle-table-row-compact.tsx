"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Gauge, Users, Fuel, Calendar, Image as ImageIcon } from "lucide-react";
import { statusLabels, statusColors, categoryLabels, fuelTypeLabels } from "../constants";
import { VehicleActionsMenu } from "./vehicle-actions-menu";
import type { Vehicle } from "../types";

type VehicleTableRowCompactProps = {
  vehicle: Vehicle;
  index: number;
  startIndex: number;
  onDeleteClick: (vehicle: Vehicle) => void;
};

export function VehicleTableRowCompact({
  vehicle,
  index,
  startIndex,
  onDeleteClick,
}: VehicleTableRowCompactProps) {
  return (
    <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
      <td className="px-2 lg:px-3 py-3 whitespace-nowrap text-center">
        <span className="inline-flex items-center justify-center w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 text-[10px] lg:text-xs font-semibold shadow-sm border border-gray-300">
          {startIndex + index + 1}
        </span>
      </td>
      <td className="px-2 lg:px-3 py-3 whitespace-nowrap">
        <div className="relative h-12 w-16 lg:h-14 lg:w-20 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
          {vehicle.images && vehicle.images.length > 0 ? (
            <Image
              src={vehicle.images[0]}
              alt={`${vehicle.brand} ${vehicle.model}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
      </td>
      <td className="px-2 lg:px-3 py-3">
        <div>
          <div className="font-semibold text-gray-900 text-xs lg:text-sm truncate">
            {vehicle.brand} {vehicle.model}
          </div>
          <div className="text-[10px] lg:text-xs text-muted-foreground mt-0.5 truncate">
            {vehicle.year} • {vehicle.licensePlate}
          </div>
          <div className="mt-1 hidden lg:block">
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {categoryLabels[vehicle.category]}
            </Badge>
          </div>
        </div>
      </td>
      <td className="px-2 lg:px-3 py-3 hidden lg:table-cell">
        <div className="space-y-0.5 text-[10px] lg:text-xs">
          <div className="flex items-center gap-1">
            <Gauge className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-muted-foreground" />
            <span className="text-gray-700">{vehicle.mileage.toLocaleString()} km</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-muted-foreground" />
            <span className="text-gray-700">{vehicle.seats} places</span>
          </div>
          <div className="flex items-center gap-1">
            <Fuel className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-muted-foreground" />
            <span className="text-gray-700 truncate">{fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}</span>
          </div>
        </div>
      </td>
      <td className="px-2 lg:px-3 py-3 whitespace-nowrap">
        <Badge className={`${statusColors[vehicle.status]} text-[10px] lg:text-xs px-1.5 lg:px-2 py-0.5`}>
          {statusLabels[vehicle.status]}
        </Badge>
      </td>
      <td className="px-2 lg:px-3 py-3">
        <div className="space-y-0.5">
          <div className="text-[10px] lg:text-xs font-semibold text-primary">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(vehicle.pricePerDay)}
            <span className="text-[8px] lg:text-[10px] text-muted-foreground font-normal">/j</span>
          </div>
          <div className="text-[8px] lg:text-[10px] text-muted-foreground hidden lg:block">
            Caution:{" "}
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(vehicle.deposit)}
          </div>
        </div>
      </td>
      <td className="px-2 lg:px-3 py-3 hidden lg:table-cell">
        <div className="text-[10px] lg:text-xs">
          <div className="font-medium text-gray-900 truncate">{vehicle.location.city}</div>
        </div>
      </td>
      <td className="px-2 lg:px-3 py-3 hidden lg:table-cell">
        <div className="text-[10px] lg:text-xs">
          <div className="flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-muted-foreground" />
            <span className="text-gray-700">{vehicle._count.bookings}</span>
          </div>
        </div>
      </td>
      <td className="px-2 lg:px-3 py-3 text-right whitespace-nowrap">
        <VehicleActionsMenu vehicle={vehicle} onDeleteClick={onDeleteClick} size="sm" />
      </td>
    </tr>
  );
}

