"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createServiceSchema,
  type CreateServiceInput,
} from "@/lib/validations/service";
import { createServiceAction } from "@/actions/admin/services";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServicePricingType, VehicleCategory } from "@prisma/client";
import {
  getFieldValidation,
  getSelectValidation,
} from "@/components/admin/services/utils/validation-helpers";

const pricingOptions: { value: ServicePricingType; label: string; helper: string }[] = [
  { value: "PER_DAY", label: "Par jour", helper: "Facturé pour chaque jour de location" },
  { value: "FIXED", label: "Montant fixe", helper: "Montant unique appliqué à la réservation" },
  { value: "PERCENTAGE", label: "Pourcentage", helper: "Pourcentage du prix de la réservation" },
];

const categoryOptions: { value: VehicleCategory; label: string }[] = [
  { value: "ECONOMY", label: "Économique" },
  { value: "COMPACT", label: "Compacte" },
  { value: "MID_SIZE", label: "Moyenne" },
  { value: "FULL_SIZE", label: "Grande" },
  { value: "SUV", label: "SUV" },
  { value: "LUXURY", label: "Luxe" },
  { value: "VAN", label: "Utilitaire" },
];

export function ServiceForm() {
  const router = useRouter();
  const [allCategories, setAllCategories] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateServiceInput>({
    resolver: zodResolver(createServiceSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      name: "",
      description: undefined,
      price: 10,
      pricingType: "PER_DAY",
      availableForCategories: [],
      icon: undefined,
    },
  });

  const pricingType =
    useWatch({
      control: form.control,
      name: "pricingType",
    }) ?? "PER_DAY";
  const selectedCategories =
    useWatch({
      control: form.control,
      name: "availableForCategories",
      defaultValue: [],
    }) ?? [];

  useEffect(() => {
    if (allCategories) {
      form.setValue("availableForCategories", []);
    }
  }, [allCategories, form]);

  useEffect(() => {
    if (!allCategories && selectedCategories.length === 0) {
      form.setError("availableForCategories", {
        type: "manual",
        message: "Sélectionnez au moins une catégorie ou activez toutes les catégories.",
      });
    } else {
      form.clearErrors("availableForCategories");
    }
  }, [allCategories, selectedCategories.length, form]);

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    setSuccessMessage(null);

    const payload: CreateServiceInput = {
      ...values,
      description: values.description?.trim() || undefined,
      icon: values.icon?.trim() || undefined,
      availableForCategories: allCategories ? [] : values.availableForCategories,
    };

    startTransition(async () => {
      const result = await createServiceAction(payload);

      if (result.success && result.data) {
        setSuccessMessage(`Service "${result.data.name}" créé avec succès.`);
        form.reset({
          name: "",
          description: undefined,
          price: 10,
          pricingType: "PER_DAY",
          availableForCategories: [],
          icon: undefined,
        });
        setAllCategories(true);
        setTimeout(() => {
          router.push("/admin/services");
        }, 1200);
        return;
      }

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (!messages) return;
          form.setError(field as keyof CreateServiceInput, {
            type: "server",
            message: messages[0],
          });
        });
      }

      if (result.error) {
        setServerError(result.error);
      }
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            <Link href="/admin/services" className="text-sm text-primary hover:underline">
              Retour au catalogue des services
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Créer un service</h1>
          <p className="text-sm text-muted-foreground">
            Configurez un service additionnel (assurance, options premium, équipements).
          </p>
        </div>
      </div>

      {serverError && (
        <Card className="border-red-200 bg-red-50 text-red-800">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{serverError}</p>
          </CardContent>
        </Card>
      )}

      {successMessage && (
        <Card className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <CardContent className="flex items-center gap-3 py-3">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-medium">{successMessage}</p>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Décrivez le service et précisez comment il sera affiché dans l’interface de
                réservation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          placeholder="Nom de l’icône Lucide (ex: shield-check)"
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
                    Si actif, le service sera proposé pour l’intégralité de la flotte.
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

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <Button type="button" variant="outline" asChild disabled={isPending}>
              <Link href="/admin/services">Annuler</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Création en cours..." : "Enregistrer le service"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

