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

interface BasicInfoSectionProps {
  form: UseFormReturn<CreateVehicleInput>;
  getFieldValidation: (fieldName: keyof CreateVehicleInput) => { className: string; icon: React.ReactElement | null };
  getSelectValidation: (fieldName: keyof CreateVehicleInput) => { className: string; icon: React.ReactElement | null };
  yearOptions: number[];
}

export function BasicInfoSection({
  form,
  getFieldValidation,
  getSelectValidation,
  yearOptions,
}: BasicInfoSectionProps) {
  const { register, formState: { errors }, setValue, trigger } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations de Base</CardTitle>
        <CardDescription>Informations principales du véhicule</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand">Marque *</Label>
            <div className="relative">
              <Input
                id="brand"
                placeholder="Peugeot"
                {...register("brand", { required: "La marque est requise" })}
                className={getFieldValidation("brand").className}
              />
              {getFieldValidation("brand").icon}
            </div>
            {errors.brand && (
              <p className="text-sm text-red-500">{errors.brand.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modèle *</Label>
            <div className="relative">
              <Input
                id="model"
                placeholder="208"
                {...register("model", { required: "Le modèle est requis" })}
                className={getFieldValidation("model").className}
              />
              {getFieldValidation("model").icon}
            </div>
            {errors.model && (
              <p className="text-sm text-red-500">{errors.model.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Année *</Label>
            <div className="relative">
              <Select
                onValueChange={(value) => {
                  setValue("year", parseInt(value), { shouldValidate: true, shouldDirty: true });
                  trigger("year");
                }}
              >
                <SelectTrigger 
                  id="year" 
                  className={getSelectValidation("year").className}
                >
                  <SelectValue placeholder="Sélectionner une année" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getSelectValidation("year").icon}
            </div>
            {errors.year && (
              <p className="text-sm text-red-500">{errors.year.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="licensePlate">Plaque d&apos;immatriculation *</Label>
            <div className="relative">
              <Input
                id="licensePlate"
                placeholder="AB-123-CD"
                {...register("licensePlate", { required: "La plaque d'immatriculation est requise" })}
                className={getFieldValidation("licensePlate").className}
              />
              {getFieldValidation("licensePlate").icon}
            </div>
            {errors.licensePlate && (
              <p className="text-sm text-red-500">{errors.licensePlate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mileage">Kilométrage *</Label>
            <div className="relative">
              <Input
                id="mileage"
                type="number"
                placeholder="12000"
                {...register("mileage", { 
                  valueAsNumber: true,
                  required: "Le kilométrage est requis",
                  min: { value: 0, message: "Le kilométrage ne peut pas être négatif" }
                })}
                className={getFieldValidation("mileage").className}
              />
              {getFieldValidation("mileage").icon}
            </div>
            {errors.mileage && (
              <p className="text-sm text-red-500">{errors.mileage.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

