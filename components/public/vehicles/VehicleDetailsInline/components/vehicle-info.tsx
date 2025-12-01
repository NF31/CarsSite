"use client";

import { m } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { categoryLabels, transmissionLabels, fuelTypeLabels } from "../constants";
import type { Vehicle } from "../types";

type VehicleInfoProps = {
  vehicle: Vehicle;
};

export function VehicleInfo({ vehicle }: VehicleInfoProps) {
  return (
    <m.div
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
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-1"
          >
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="text-lg font-bold">{vehicle.rating}</span>
            {vehicle.reviewCount > 0 && (
              <span className="text-sm text-muted-foreground">({vehicle.reviewCount} avis)</span>
            )}
          </m.div>
        )}
      </div>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        <Badge variant="secondary">{categoryLabels[vehicle.category] || vehicle.category}</Badge>
        <Badge variant="outline">
          {transmissionLabels[vehicle.transmission] || vehicle.transmission}
        </Badge>
        <Badge variant="outline">{fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}</Badge>
      </m.div>
    </m.div>
  );
}

