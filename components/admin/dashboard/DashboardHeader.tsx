import { memo } from "react";
import { Calendar, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardHeaderProps {
  userName: string | null | undefined;
}

export const DashboardHeader = memo(function DashboardHeader({
  userName,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-1">
          Bienvenue, {userName ?? "Admin"} - Vue d&apos;ensemble de votre activité
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/admin/bookings/new">
            <Calendar className="mr-2 h-4 w-4" />
            Nouvelle réservation
          </Link>
        </Button>
        <Button asChild>
          <Link href="/admin/vehicles/add">
            <Car className="mr-2 h-4 w-4" />
            Ajouter un véhicule
          </Link>
        </Button>
      </div>
    </div>
  );
});

