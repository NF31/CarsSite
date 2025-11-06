"use client";

import type { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateVehicleInput } from "@/lib/validations/vehicle";

interface LocationSectionProps {
  form: UseFormReturn<CreateVehicleInput>;
  getSelectValidation: (fieldName: keyof CreateVehicleInput) => { className: string; icon: React.ReactElement | null };
  locationOptions: { value: string; label: string }[];
}

export function LocationSection({
  form,
  getSelectValidation,
  locationOptions,
}: LocationSectionProps) {
  const { formState: { errors }, setValue, trigger, watch } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Localisation</CardTitle>
        <CardDescription>Agence où se trouve le véhicule</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="locationId">Agence *</Label>
          <div className="relative">
            <Select
              value={watch("locationId")}
              onValueChange={(value) => {
                setValue("locationId", value, { shouldValidate: true, shouldDirty: true });
                trigger("locationId");
              }}
            >
              <SelectTrigger 
                id="locationId" 
                className={getSelectValidation("locationId").className}
              >
                <SelectValue placeholder="Sélectionner une agence" />
              </SelectTrigger>
              <SelectContent>
                {locationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getSelectValidation("locationId").icon}
          </div>
          {errors.locationId && (
            <p className="text-sm text-red-500">{errors.locationId.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

