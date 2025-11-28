import { memo } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Car } from "lucide-react";
import type { Vehicle } from "../hooks";

interface VehicleAvailabilityCardProps {
  vehicle: Vehicle;
  onSelect: (vehicle: Vehicle) => void;
}

export const VehicleAvailabilityCard = memo(function VehicleAvailabilityCard({
  vehicle,
  onSelect,
}: VehicleAvailabilityCardProps) {
  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect(vehicle)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gray-100">
          {vehicle.images && vehicle.images.length > 0 ? (
            <Image
              src={vehicle.images[0]}
              alt={`${vehicle.brand} ${vehicle.model}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Car className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {vehicle.licensePlate} • {vehicle.location.city}
          </p>
          <Button className="w-full mt-4" variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Voir disponibilité
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

