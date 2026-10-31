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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/admin/services/utils/validation-helpers";
import type { CreateServiceInput } from "@/lib/validations/service";

interface ServiceGeneralInfoCardProps {
  form: UseFormReturn<CreateServiceInput>;
  isEditMode: boolean;
  isActive: boolean;
  setIsActive: (value: boolean) => void;
  isPending: boolean;
}

export const ServiceGeneralInfoCard = memo(function ServiceGeneralInfoCard({
  form,
  isEditMode,
  isActive,
  setIsActive,
  isPending,
}: ServiceGeneralInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations générales</CardTitle>
        <CardDescription>
          Décrivez le service et précisez comment il sera affiché dans l&apos;interface de
          réservation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditMode && (
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Service actif</p>
              <p className="text-xs text-muted-foreground">
                Désactivez le service pour le retirer du processus de réservation.
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isPending}
            />
          </div>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => {
            const validation = getFieldValidation(form, "name");
            return (
              <FormItem>
                <FormLabel>Nom du service</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="Ex: Assurance premium"
                      {...field}
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => {
            const validation = getFieldValidation(form, "description");
            return (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Textarea
                      placeholder="Détaillez les bénéfices du service, la couverture incluse, etc."
                      rows={4}
                      {...field}
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

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => {
            const validation = getFieldValidation(form, "icon");
            return (
              <FormItem>
                <FormLabel>Icône (optionnel)</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="Nom de l'icône Lucide (ex: shield-check)"
                      {...field}
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

