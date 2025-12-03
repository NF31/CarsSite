"use client";

import { memo } from "react";
import Link from "next/link";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BookingFormValues } from "@/hooks/useBookingForm";

interface AvailabilityStatus {
  status: "idle" | "checking" | "available" | "booking_conflict" | "maintenance_conflict" | "error";
  message?: string;
}

interface DatesPeriodCardProps {
  minDateTimeValue: string;
  watchVehicleId: string;
  availability: AvailabilityStatus;
  isCheckingAvailability: boolean;
}

export const DatesPeriodCard = memo(function DatesPeriodCard({
  minDateTimeValue,
  watchVehicleId,
  availability,
  isCheckingAvailability,
}: DatesPeriodCardProps) {
  const form = useFormContext<BookingFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dates et période</CardTitle>
        <CardDescription>Définissez la durée de la location.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Début de la location</FormLabel>
              <Input
                type="datetime-local"
                value={field.value}
                onChange={field.onChange}
                min={minDateTimeValue}
                disabled={!watchVehicleId}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fin de la location</FormLabel>
              <Input
                type="datetime-local"
                value={field.value}
                onChange={field.onChange}
                min={minDateTimeValue}
                disabled={!watchVehicleId}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
      <CardFooter>
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            className={cn(
              "w-full rounded-lg border px-4 py-3 text-sm",
              availability.status === "available"
                ? "border-green-200 bg-green-50 text-green-800"
                : availability.status === "booking_conflict" ||
                    availability.status === "maintenance_conflict"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : availability.status === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-border bg-muted/40 text-muted-foreground"
            )}
          >
            {availability.status === "checking" || isCheckingAvailability
              ? "Vérification des disponibilités en cours..."
              : availability.status === "available"
              ? "Le véhicule est disponible pour les dates sélectionnées."
              : availability.status === "booking_conflict" ||
                  availability.status === "maintenance_conflict"
              ? availability.message
              : availability.status === "error"
              ? availability.message
              : "Sélectionnez un véhicule et des dates pour vérifier la disponibilité."}
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!watchVehicleId}
            asChild
          >
            <Link
              href={
                watchVehicleId
                  ? `/admin/vehicles/availability?vehicle=${watchVehicleId}`
                  : "/admin/vehicles/availability"
              }
              target="_blank"
              rel="noreferrer"
            >
              Consulter le planning du véhicule
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
});

