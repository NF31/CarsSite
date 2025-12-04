import { memo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Vehicle } from "../hooks";

// Lazy load AvailabilityCalendar (FullCalendar est lourd)
const AvailabilityCalendar = dynamic(
  () => import("@/components/admin/vehicles/AvailabilityCalendar").then((mod) => ({ default: mod.AvailabilityCalendar })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement du calendrier...</p>
        </div>
      </div>
    ),
  }
);

interface VehicleAvailabilityViewProps {
  vehicle: Vehicle;
  onBack: () => void;
}

export const VehicleAvailabilityView = memo(function VehicleAvailabilityView({
  vehicle,
  onBack,
}: VehicleAvailabilityViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Disponibilité - {vehicle.brand} {vehicle.model}
          </h1>
          <p className="text-gray-600 mt-1">
            Plaque: {vehicle.licensePlate} • {vehicle.location.city}
          </p>
        </div>
      </div>

      <AvailabilityCalendar vehicleId={vehicle.id} />
    </div>
  );
});

