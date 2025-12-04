"use client";

import { memo } from "react";
import { useFormContext } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookingStatus } from "@/lib/types/booking-status";
import { VehicleStatus } from "@/lib/types/vehicle-status";
import type { BookingFormValues } from "@/hooks/useBookingForm";
import type { BookingVehicleOption } from "@/actions/admin/bookings";

const statusLabels: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: "En attente",
  [BookingStatus.CONFIRMED]: "Confirmée",
  [BookingStatus.IN_PROGRESS]: "En cours",
  [BookingStatus.COMPLETED]: "Terminée",
  [BookingStatus.CANCELLED]: "Annulée",
};

interface VehicleStatusCardProps {
  vehicles: BookingVehicleOption[];
  selectedVehicle: BookingVehicleOption | null;
  isEditMode: boolean;
  formatter: Intl.NumberFormat;
}

export const VehicleStatusCard = memo(function VehicleStatusCard({
  vehicles,
  selectedVehicle,
  isEditMode,
  formatter,
}: VehicleStatusCardProps) {
  const form = useFormContext<BookingFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Véhicule et statut</CardTitle>
        <CardDescription>
          Sélectionnez un véhicule disponible et définissez le statut initial de la réservation.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <FormField
          control={form.control}
          name="vehicleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Véhicule</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full min-h-[48px]">
                  <SelectValue placeholder="Sélectionnez un véhicule">
                    {selectedVehicle ? (
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-medium text-gray-900">
                          {selectedVehicle.label}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {formatter.format(selectedVehicle.pricePerDay)} / jour • Dépôt recommandé{" "}
                          {formatter.format(selectedVehicle.deposit)}
                        </span>
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-900">{vehicle.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatter.format(vehicle.pricePerDay)} / jour • Dépôt recommandé{" "}
                          {formatter.format(vehicle.deposit)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {vehicle.location
                            ? `${vehicle.location.name} • ${vehicle.location.city}`
                            : "Agence non renseignée"}
                        </span>
                        <span className="text-xs">
                          <Badge
                            variant={
                              vehicle.status === VehicleStatus.AVAILABLE ? "default" : "secondary"
                            }
                          >
                            {vehicle.status === VehicleStatus.AVAILABLE
                              ? "Disponible"
                              : vehicle.status === VehicleStatus.RESERVED
                              ? "Réservé"
                              : vehicle.status === VehicleStatus.MAINTENANCE
                              ? "Maintenance"
                              : "Indisponible"}
                          </Badge>
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEditMode ? "Statut de la réservation" : "Statut initial"}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isEditMode}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisissez un statut" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(BookingStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditMode ? (
                <p className="text-xs text-muted-foreground">
                  Les modifications effectuées depuis l&apos;admin confirment automatiquement la réservation.
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
});

