import { memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VehicleDetailsHeaderProps {
  vehicleId: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  onDeleteClick: () => void;
}

export const VehicleDetailsHeader = memo(function VehicleDetailsHeader({
  vehicleId,
  brand,
  model,
  year,
  licensePlate,
  onDeleteClick,
}: VehicleDetailsHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {brand} {model}
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
            {year} • {licensePlate}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => {
            router.push(`/admin/vehicles/availability?vehicleId=${vehicleId}`);
          }}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Disponibilité
        </Button>
        <Link href={`/admin/vehicles/edit/${vehicleId}`} className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        </Link>
        <Button
          variant="destructive"
          className="w-full sm:w-auto"
          onClick={onDeleteClick}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </Button>
      </div>
    </div>
  );
});

