"use client";

import type { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2 } from "lucide-react";
import type { CreateVehicleInput } from "@/lib/validations/vehicle";

interface DescriptionSectionProps {
  form: UseFormReturn<CreateVehicleInput>;
  getFieldValidation: (fieldName: keyof CreateVehicleInput) => { className: string; icon: React.ReactElement | null };
}

export function DescriptionSection({
  form,
  getFieldValidation,
}: DescriptionSectionProps) {
  const { register, formState: { errors }, watch } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Description</CardTitle>
        <CardDescription>Description optionnelle du véhicule</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="relative">
            <Textarea
              id="description"
              placeholder="Décrivez le véhicule..."
              rows={4}
              {...register("description")}
              className={getFieldValidation("description").className}
            />
            {getFieldValidation("description").icon}
          </div>
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
          {watch("description") && !errors.description && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Description valide ({watch("description")?.length || 0}/1000 caractères)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

