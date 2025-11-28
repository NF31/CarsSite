import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AvailabilityCalendar } from "@/components/admin/vehicles/AvailabilityCalendar";
import type { Vehicle } from "../hooks";

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

