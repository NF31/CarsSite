"use client";

import { m } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Gauge, Fuel, Palette, GaugeCircle } from "lucide-react";
import { transmissionLabels, fuelTypeLabels } from "../constants";
import type { Vehicle } from "../types";

type CharacteristicsCardProps = {
  vehicle: Vehicle;
};

export function CharacteristicsCard({ vehicle }: CharacteristicsCardProps) {
  return (
    <m.div
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
    </m.div>
  );
}

