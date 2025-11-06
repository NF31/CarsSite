"use client";

import type { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";
import type { CreateVehicleInput } from "@/lib/validations/vehicle";

interface FeaturesSectionProps {
  form: UseFormReturn<CreateVehicleInput>;
  availableFeatures: string[];
}

export function FeaturesSection({
  form,
  availableFeatures,
}: FeaturesSectionProps) {
  const { watch, setValue, trigger } = form;
  const selectedFeatures = watch("features") || [];

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = selectedFeatures;
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f) => f !== feature)
      : [...currentFeatures, feature];
    setValue("features", newFeatures, { shouldValidate: true, shouldDirty: true });
    trigger("features");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Équipements</CardTitle>
        <CardDescription>Sélectionnez les équipements disponibles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableFeatures.map((feature) => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={`feature-${feature}`}
                  checked={selectedFeatures.includes(feature)}
                  onCheckedChange={() => handleFeatureToggle(feature)}
                />
                <Label
                  htmlFor={`feature-${feature}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {feature}
                </Label>
              </div>
            ))}
          </div>
          {selectedFeatures.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{selectedFeatures.length} équipement{selectedFeatures.length > 1 ? "s" : ""} sélectionné{selectedFeatures.length > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

