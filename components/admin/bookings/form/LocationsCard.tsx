"use client";

import { memo } from "react";
import { useFormContext } from "react-hook-form";
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
import type { BookingFormValues } from "../BookingForm";
import type { BookingLocationOption } from "@/actions/admin/bookings";

interface LocationsCardProps {
  locations: BookingLocationOption[];
}

export const LocationsCard = memo(function LocationsCard({ locations }: LocationsCardProps) {
  const form = useFormContext<BookingFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agences de prise en charge / retour</CardTitle>
        <CardDescription>Sélectionnez les agences concernées.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <FormField
          control={form.control}
          name="pickupLocationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agence de départ</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une agence" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} • {location.city}
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
          name="returnLocationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agence de retour</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une agence" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} • {location.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
});

