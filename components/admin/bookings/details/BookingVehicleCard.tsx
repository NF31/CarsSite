"use client";

import { memo } from "react";
import Link from "next/link";
import { Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { bookingCurrencyFormatter } from "@/components/admin/bookings/booking-helpers";
import { VehicleStatus } from "@prisma/client";
import type { BookingDetail } from "@/actions/admin/bookings";

const vehicleStatusLabels: Record<VehicleStatus, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  MAINTENANCE: "En maintenance",
  UNAVAILABLE: "Indisponible",
};

const vehicleStatusColors: Record<VehicleStatus, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  RESERVED: "bg-blue-50 text-blue-700 border-blue-200",
  MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-200",
  UNAVAILABLE: "bg-red-50 text-red-700 border-red-200",
};

interface BookingVehicleCardProps {
  booking: BookingDetail;
}

export const BookingVehicleCard = memo(function BookingVehicleCard({ booking }: BookingVehicleCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="h-5 w-5 text-muted-foreground" />
          Véhicule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-1">
          <p className="text-base font-semibold text-gray-900">
            {booking.vehicle.brand} {booking.vehicle.model}
          </p>
          <p className="text-muted-foreground">Immatriculation {booking.vehicle.licensePlate}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[11px]",
              vehicleStatusColors[booking.vehicle.status] ?? "bg-gray-100 text-gray-600 border-gray-200"
            )}
          >
            {vehicleStatusLabels[booking.vehicle.status] ?? booking.vehicle.status}
          </Badge>
          {booking.vehicle.location && (
            <Badge variant="outline" className="text-[11px]">
              {booking.vehicle.location.city} • {booking.vehicle.location.name}
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-2 xl:flex-row">
          <Link href={`/admin/vehicles/${booking.vehicle.id}`} className="w-full min-w-0">
            <Button variant="outline" size="sm" className="w-full whitespace-normal text-center">
              Voir le véhicule
            </Button>
          </Link>
          <Link
            href={`/admin/vehicles/availability?vehicleId=${booking.vehicle.id}`}
            className="w-full min-w-0"
          >
            <Button variant="ghost" size="sm" className="w-full whitespace-normal text-center">
              Consulter les disponibilités
            </Button>
          </Link>
        </div>
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/80 p-3 text-xs text-muted-foreground">
          Caution recommandée :{" "}
          <span className="font-semibold text-gray-900">
            {bookingCurrencyFormatter.format(booking.vehicle.deposit)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

