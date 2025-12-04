import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Gauge,
  Users,
  Fuel,
  Palette,
  MapPin,
} from "lucide-react";
import {
  statusLabels,
  statusColors,
  statusIcons,
  categoryLabels,
  fuelTypeLabels,
  transmissionLabels,
} from "../utils";
import type { VehicleCategory, FuelType, TransmissionType } from "@prisma/client";
import type { VehicleStatus } from "@/lib/types/vehicle-status";
import { AlertCircle } from "lucide-react";

interface VehicleGeneralInfoProps {
  status: string;
  category: string;
  mileage: number;
  seats: number;
  fuelType: string;
  transmission: string;
  color: string;
  location: {
    name: string;
    city: string;
  };
}

export const VehicleGeneralInfo = memo(function VehicleGeneralInfo({
  status,
  category,
  mileage,
  seats,
  fuelType,
  transmission,
  color,
  location,
}: VehicleGeneralInfoProps) {
  const StatusIcon = statusIcons[status as VehicleStatus] || AlertCircle;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Informations générales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <StatusIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <Badge className={statusColors[status as VehicleStatus]}>
                {statusLabels[status as VehicleStatus]}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Catégorie</p>
              <p className="font-semibold">
                {categoryLabels[category as VehicleCategory]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gauge className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kilométrage</p>
              <p className="font-semibold">{mileage.toLocaleString()} km</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Places</p>
              <p className="font-semibold">{seats} places</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Fuel className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Carburant</p>
              <p className="font-semibold">
                {fuelTypeLabels[fuelType as FuelType] || fuelType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transmission</p>
              <p className="font-semibold">
                {transmissionLabels[transmission as TransmissionType] || transmission}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Couleur</p>
              <p className="font-semibold">{color}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Localisation</p>
              <p className="font-semibold">{location.city}</p>
              <p className="text-sm text-muted-foreground">{location.name}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

