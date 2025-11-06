"use client";

import type { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateVehicleInput } from "@/lib/validations/vehicle";

interface PricingSectionProps {
  form: UseFormReturn<CreateVehicleInput>;
  getFieldValidation: (fieldName: keyof CreateVehicleInput) => { className: string; icon: React.ReactElement | null };
}

export function PricingSection({
  form,
  getFieldValidation,
}: PricingSectionProps) {
  const { register, formState: { errors } } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tarification</CardTitle>
        <CardDescription>Définissez les prix de location</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="pricePerDay">Prix/jour (€) *</Label>
            <div className="relative">
              <Input
                id="pricePerDay"
                type="number"
                step="0.01"
                placeholder="45.00"
                {...register("pricePerDay", { 
                  valueAsNumber: true,
                  required: "Le prix par jour est requis",
                  min: { value: 0.01, message: "Le prix par jour doit être supérieur à 0" }
                })}
                className={getFieldValidation("pricePerDay").className}
              />
              {getFieldValidation("pricePerDay").icon}
            </div>
            {errors.pricePerDay && (
              <p className="text-sm text-red-500">{errors.pricePerDay.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricePerWeek">Prix/semaine (€)</Label>
            <div className="relative">
              <Input
                id="pricePerWeek"
                type="number"
                step="0.01"
                placeholder="280.00"
                {...register("pricePerWeek", { valueAsNumber: true })}
                className={getFieldValidation("pricePerWeek").className}
              />
              {getFieldValidation("pricePerWeek").icon}
            </div>
            {errors.pricePerWeek && (
              <p className="text-sm text-red-500">{errors.pricePerWeek.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricePerMonth">Prix/mois (€)</Label>
            <div className="relative">
              <Input
                id="pricePerMonth"
                type="number"
                step="0.01"
                placeholder="1200.00"
                {...register("pricePerMonth", { valueAsNumber: true })}
                className={getFieldValidation("pricePerMonth").className}
              />
              {getFieldValidation("pricePerMonth").icon}
            </div>
            {errors.pricePerMonth && (
              <p className="text-sm text-red-500">{errors.pricePerMonth.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit">Dépôt de garantie (€) *</Label>
            <div className="relative">
              <Input
                id="deposit"
                type="number"
                step="0.01"
                placeholder="500.00"
                {...register("deposit", { 
                  valueAsNumber: true,
                  required: "Le dépôt de garantie est requis",
                  min: { value: 0, message: "Le dépôt ne peut pas être négatif" }
                })}
                className={getFieldValidation("deposit").className}
              />
              {getFieldValidation("deposit").icon}
            </div>
            {errors.deposit && (
              <p className="text-sm text-red-500">{errors.deposit.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

