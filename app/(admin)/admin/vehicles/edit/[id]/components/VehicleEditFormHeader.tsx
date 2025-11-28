import { memo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VehicleEditFormHeaderProps {
  brand: string;
  model: string;
  licensePlate: string;
}

export const VehicleEditFormHeader = memo(function VehicleEditFormHeader({
  brand,
  model,
  licensePlate,
}: VehicleEditFormHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" asChild>
        <Link href="/admin/vehicles">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Retour</span>
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold">Modifier un véhicule</h1>
        <p className="text-muted-foreground">
          Modifiez les informations du véhicule {brand} {model} ({licensePlate})
        </p>
      </div>
    </div>
  );
});

