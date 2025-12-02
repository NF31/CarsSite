import { MapPin } from "lucide-react";
import type { BookingListItem } from "../types";

interface BookingLocationInfoProps {
  pickupLocation: BookingListItem["pickupLocation"];
  returnLocation: BookingListItem["returnLocation"];
  variant?: "mobile" | "desktop";
}

export function BookingLocationInfo({
  pickupLocation,
  returnLocation,
  variant = "mobile",
}: BookingLocationInfoProps) {
  if (variant === "desktop") {
    return null; // Les localisations ne sont pas affichées dans la vue desktop
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 mt-0.5" />
        <div>
          <p className="font-medium text-gray-900 text-sm">Retrait</p>
          <p>{pickupLocation.name}</p>
          <p>{pickupLocation.city}</p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 mt-0.5" />
        <div>
          <p className="font-medium text-gray-900 text-sm">Retour</p>
          <p>{returnLocation.name}</p>
          <p>{returnLocation.city}</p>
        </div>
      </div>
    </div>
  );
}

