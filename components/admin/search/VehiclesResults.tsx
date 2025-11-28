import { memo } from "react";
import Link from "next/link";
import { Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  pricePerDay: number;
  status: string;
  location: {
    name: string;
    city: string;
  } | null;
}

const vehicleStatusLabels: Record<string, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  MAINTENANCE: "En maintenance",
  UNAVAILABLE: "Indisponible",
};

const vehicleStatusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  AVAILABLE: "default",
  RESERVED: "secondary",
  MAINTENANCE: "outline",
  UNAVAILABLE: "destructive",
};

interface VehiclesResultsProps {
  vehicles: Vehicle[];
}

export const VehiclesResults = memo(function VehiclesResults({
  vehicles,
}: VehiclesResultsProps) {
  if (vehicles.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          <CardTitle>Véhicules ({vehicles.length})</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <Link
              key={vehicle.id}
              href={`/admin/vehicles/${vehicle.id}`}
              className="block p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium">
                    {vehicle.brand} {vehicle.model} ({vehicle.year})
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {vehicle.licensePlate}
                    {vehicle.location && ` • ${vehicle.location.city}`}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={vehicleStatusVariants[vehicle.status] || "default"}>
                    {vehicleStatusLabels[vehicle.status] || vehicle.status}
                  </Badge>
                  <div className="text-sm font-medium">
                    {vehicle.pricePerDay.toFixed(2)} €/jour
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

