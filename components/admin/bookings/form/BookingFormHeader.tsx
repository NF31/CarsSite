"use client";

import { memo } from "react";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookingFormHeaderProps {
  isEditMode: boolean;
  bookingReference?: string;
}

export const BookingFormHeader = memo(function BookingFormHeader({
  isEditMode,
  bookingReference,
}: BookingFormHeaderProps) {
  return (
    <header className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        {isEditMode ? "Réservations • Édition" : "Réservations • Création manuelle"}
      </div>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? "Modifier la réservation" : "Nouvelle réservation"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? "Ajustez les informations de la réservation avant le départ du véhicule."
              : "Sélectionnez un client, un véhicule et définissez les conditions de location. Vous pouvez ajuster les tarifs si nécessaire."}
          </p>
        </div>
        {isEditMode && bookingReference ? (
          <Badge variant="outline" className="h-auto rounded-full px-3 py-1 text-sm">
            Référence {bookingReference}
          </Badge>
        ) : null}
      </div>
    </header>
  );
});

