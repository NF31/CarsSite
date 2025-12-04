"use client";

import type { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateVehicleInput } from "@/lib/validations/vehicle";
import type { TransmissionType, FuelType } from "@prisma/client";
import type { VehicleCategory } from "@/lib/types/vehicle-category";

interface CharacteristicsSectionProps {
  form: UseFormReturn<CreateVehicleInput>;
  getFieldValidation: (fieldName: keyof CreateVehicleInput) => { className: string; icon: React.ReactElement | null };
  getSelectValidation: (fieldName: keyof CreateVehicleInput) => { className: string; icon: React.ReactElement | null };
  categoryOptions: { value: VehicleCategory; label: string }[];
  transmissionOptions: { value: TransmissionType; label: string }[];
  fuelTypeOptions: { value: FuelType; label: string }[];
}

export function CharacteristicsSection({
  form,
  getFieldValidation,
  getSelectValidation,
  categoryOptions,
  transmissionOptions,
  fuelTypeOptions,
}: CharacteristicsSectionProps) {
  const { register, formState: { errors }, setValue, trigger, watch } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Caractéristiques</CardTitle>
        <CardDescription>Caractéristiques techniques du véhicule</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie *</Label>
            <div className="relative">
              <Select
                value={watch("category")}
                onValueChange={(value) => {
                  setValue("category", value as VehicleCategory, { shouldValidate: true, shouldDirty: true });
                  trigger("category");
                }}
              >
                <SelectTrigger id="category" className={getSelectValidation("category").className}>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getSelectValidation("category").icon}
            </div>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seats">Nombre de places *</Label>
            <div className="relative">
              <Input
                id="seats"
                type="number"
                placeholder="5"
                {...register("seats", { 
                  valueAsNumber: true,
                  required: "Le nombre de places est requis",
                  min: { value: 2, message: "Minimum 2 places" },
                  max: { value: 9, message: "Maximum 9 places" }
                })}
                className={getFieldValidation("seats").className}
              />
              {getFieldValidation("seats").icon}
            </div>
            {errors.seats && (
              <p className="text-sm text-red-500">{errors.seats.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transmission">Transmission *</Label>
            <div className="relative">
              <Select
                value={watch("transmission")}
                onValueChange={(value) => {
                  setValue("transmission", value as TransmissionType, { shouldValidate: true, shouldDirty: true });
                  trigger("transmission");
                }}
              >
                <SelectTrigger id="transmission" className={getSelectValidation("transmission").className}>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {transmissionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getSelectValidation("transmission").icon}
            </div>
            {errors.transmission && (
              <p className="text-sm text-red-500">{errors.transmission.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuelType">Carburant *</Label>
            <div className="relative">
              <Select
                value={watch("fuelType")}
                onValueChange={(value) => {
                  setValue("fuelType", value as FuelType, { shouldValidate: true, shouldDirty: true });
                  trigger("fuelType");
                }}
              >
                <SelectTrigger id="fuelType" className={getSelectValidation("fuelType").className}>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getSelectValidation("fuelType").icon}
            </div>
            {errors.fuelType && (
              <p className="text-sm text-red-500">{errors.fuelType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Couleur *</Label>
            <div className="relative">
              <Input
                id="color"
                placeholder="Blanc"
                {...register("color", { required: "La couleur est requise" })}
                className={getFieldValidation("color").className}
              />
              {getFieldValidation("color").icon}
            </div>
            {errors.color && (
              <p className="text-sm text-red-500">{errors.color.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

