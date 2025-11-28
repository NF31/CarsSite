import { memo } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getFieldValidation,
  getSelectValidation,
} from "@/components/admin/services/utils/validation-helpers";
import type { CreateServiceInput } from "@/lib/validations/service";
import type { ServicePricingType } from "@prisma/client";

const pricingOptions: { value: ServicePricingType; label: string; helper: string }[] = [
  { value: "PER_DAY", label: "Par jour", helper: "Facturé pour chaque jour de location" },
  { value: "FIXED", label: "Montant fixe", helper: "Montant unique appliqué à la réservation" },
  { value: "PERCENTAGE", label: "Pourcentage", helper: "Pourcentage du prix de la réservation" },
];

interface ServicePricingCardProps {
  form: UseFormReturn<CreateServiceInput>;
  pricingType: ServicePricingType;
  isPending: boolean;
}

export const ServicePricingCard = memo(function ServicePricingCard({
  form,
  pricingType,
  isPending,
}: ServicePricingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tarification</CardTitle>
        <CardDescription>
          Définissez le modèle de tarification appliqué lors de la réservation.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="pricingType"
          render={({ field }) => {
            const validation = getSelectValidation(form, "pricingType");
            return (
              <FormItem>
                <FormLabel>Type de tarification</FormLabel>
                <div className="relative">
                  <Select
                    value={field.value}
                    onValueChange={(value: ServicePricingType) => field.onChange(value)}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className={cn(validation.className)}>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pricingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validation.icon}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pricingOptions.find((option) => option.value === pricingType)?.helper}
                </p>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => {
            const validation = getFieldValidation(form, "price");
            return (
              <FormItem>
                <FormLabel>
                  {pricingType === "PERCENTAGE" ? "Pourcentage" : "Montant"}
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type="number"
                      step={pricingType === "PERCENTAGE" ? "1" : "0.5"}
                      min={pricingType === "PERCENTAGE" ? 1 : 0.5}
                      max={pricingType === "PERCENTAGE" ? 100 : undefined}
                      {...field}
                      value={Number.isNaN(field.value) ? "" : field.value}
                      onChange={(event) => field.onChange(event.target.valueAsNumber)}
                      disabled={isPending}
                      className={cn(validation.className)}
                    />
                  </FormControl>
                  {validation.icon}
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </CardContent>
    </Card>
  );
});

