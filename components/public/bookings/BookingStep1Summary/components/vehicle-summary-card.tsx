import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import Image from "next/image";
import type { Vehicle } from "../types";
import { PLACEHOLDER_IMAGE } from "../constants";

interface VehicleSummaryCardProps {
  vehicle: Vehicle;
}

export function VehicleSummaryCard({ vehicle }: VehicleSummaryCardProps) {
  const mainImage = vehicle.images[0] || PLACEHOLDER_IMAGE;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative w-full md:w-64 h-48 rounded-lg overflow-hidden">
            <Image
              src={mainImage}
              alt={`${vehicle.brand} ${vehicle.model}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 256px"
            />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-2xl font-bold">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-muted-foreground">
                {vehicle.year} • {vehicle.seats} places • {vehicle.transmission} • {vehicle.fuelType}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {vehicle.location.name}, {vehicle.location.city}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {vehicle.pricePerDay.toFixed(2)}€
                </p>
                <p className="text-xs text-muted-foreground">par jour</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

