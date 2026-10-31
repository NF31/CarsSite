import { memo } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CreateServiceInput } from "@/lib/validations/service";
import type { VehicleCategory } from "@/lib/types/vehicle-category";

const categoryOptions: { value: VehicleCategory; label: string }[] = [
  { value: "ECONOMY", label: "Économique" },
  { value: "COMPACT", label: "Compacte" },
  { value: "MID_SIZE", label: "Moyenne" },
  { value: "FULL_SIZE", label: "Grande" },
  { value: "SUV", label: "SUV" },
  { value: "LUXURY", label: "Luxe" },
  { value: "VAN", label: "Utilitaire" },
];

interface ServiceAvailabilityCardProps {
  form: UseFormReturn<CreateServiceInput>;
  allCategories: boolean;
  setAllCategories: (value: boolean) => void;
  selectedCategories: VehicleCategory[];
  isPending: boolean;
}

export const ServiceAvailabilityCard = memo(function ServiceAvailabilityCard({
  form,
  allCategories,
  setAllCategories,
  selectedCategories,
  isPending,
}: ServiceAvailabilityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Disponibilité</CardTitle>
        <CardDescription>
          Sélectionnez les catégories de véhicules éligibles pour ce service.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Toutes les catégories</p>
            <p className="text-xs text-muted-foreground">
              Si actif, le service sera proposé pour l&apos;intégralité de la flotte.
            </p>
          </div>
          <Switch
            checked={allCategories}
            onCheckedChange={setAllCategories}
            disabled={isPending}
          />
        </div>

        <div
          className={cn(
            "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
            allCategories && "opacity-60 pointer-events-none"
          )}
        >
          {categoryOptions.map((option) => (
            <FormField
              key={option.value}
              control={form.control}
              name="availableForCategories"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border px-3 py-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes(option.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...(field.value ?? []), option.value]);
                        } else {
                          field.onChange(
                            (field.value ?? []).filter((value) => value !== option.value)
                          );
                        }
                      }}
                      disabled={isPending || allCategories}
                    />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium leading-none">
                      {option.label}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
        {!allCategories && (
          <p className="text-xs text-muted-foreground">
            {selectedCategories.length === 0
              ? "Sélectionnez au moins une catégorie ou activez \"Toutes les catégories\"."
              : `${selectedCategories.length} catégorie(s) sélectionnée(s).`}
          </p>
        )}
        {form.formState.errors.availableForCategories && (
          <p className="text-xs text-red-500">
            {form.formState.errors.availableForCategories.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

