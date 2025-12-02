import { Car } from "lucide-react";
import type { BookingListItem } from "../types";

interface BookingVehicleInfoProps {
  vehicle: BookingListItem["vehicle"];
  variant?: "mobile" | "desktop";
}

export function BookingVehicleInfo({ vehicle, variant = "mobile" }: BookingVehicleInfoProps) {
  if (variant === "desktop") {
    return (
      <div className="align-top">
        <div className="font-medium text-gray-900">
          {vehicle.brand} {vehicle.model}
        </div>
        <div className="text-xs text-muted-foreground break-words">
          {vehicle.licensePlate} • {vehicle.category}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <Car className="h-4 w-4 text-muted-foreground mt-1" />
      <div>
        <p className="font-semibold">
          {vehicle.brand} {vehicle.model}
        </p>
        <p className="text-xs text-muted-foreground">
          {vehicle.licensePlate} • {vehicle.category}
        </p>
      </div>
    </div>
  );
}

