import { memo } from "react";
import Link from "next/link";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AvailabilityHeaderProps {
  totalVehicles: number;
}

export const AvailabilityHeader = memo(function AvailabilityHeader({
  totalVehicles,
}: AvailabilityHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Disponibilité des véhicules</h1>
        <p className="text-gray-600 mt-1">
          Sélectionnez un véhicule pour voir son calendrier de disponibilité ({totalVehicles} véhicules)
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/admin/vehicles">
          <Car className="mr-2 h-4 w-4" />
          Voir tous les véhicules
        </Link>
      </Button>
    </div>
  );
});

