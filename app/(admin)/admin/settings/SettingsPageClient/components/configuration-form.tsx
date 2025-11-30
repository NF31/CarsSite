"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Cog, RefreshCcw, Save } from "lucide-react";
import { useConfigurationForm } from "../hooks/use-configuration-form";
import { MessageAlert } from "./message-alert";
import { FormField } from "./form-field";
import type { SettingsPageClientProps } from "../types";

interface ConfigurationFormProps {
  initialData: SettingsPageClientProps["initialData"]["configuration"];
}

/**
 * Formulaire de configuration générale
 */
export function ConfigurationForm({ initialData }: ConfigurationFormProps) {
  const {
    form,
    setForm,
    errors,
    setErrors,
    message,
    setMessage,
    isUpdating,
    reset,
    handleSubmit,
  } = useConfigurationForm({ initialData });

  const handleFieldChange = (value: string, field: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Cog className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">Configuration</span>
        </div>
        <CardTitle>Paramètres généraux</CardTitle>
        <CardDescription>
          Définissez les paramètres appliqués aux réservations, paiements et communications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <MessageAlert message={message} onClose={() => setMessage(null)} />

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                id="config-currency"
                label="Devise"
                value={form.currency}
                onChange={handleFieldChange}
                errors={errors}
                fieldName="currency"
                placeholder="EUR"
              />

              <FormField
                id="config-language"
                label="Langue"
                value={form.language}
                onChange={handleFieldChange}
                errors={errors}
                fieldName="language"
                placeholder="fr"
              />

              <FormField
                id="config-timezone"
                label="Fuseau horaire"
                value={form.timezone}
                onChange={handleFieldChange}
                errors={errors}
                fieldName="timezone"
                placeholder="Europe/Paris"
              />
            </div>

            <FormField
              id="config-cancellation"
              label="Politique d'annulation"
              value={form.cancellationPolicy}
              onChange={handleFieldChange}
              errors={errors}
              fieldName="cancellationPolicy"
              placeholder="Annulation gratuite jusqu'à 48h avant le départ..."
              textarea
              rows={3}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                id="config-tax"
                label="TVA (%)"
                value={form.taxRate}
                onChange={handleFieldChange}
                errors={errors}
                fieldName="taxRate"
                placeholder="20"
              />

              <FormField
                id="config-deposit"
                label="Dépôt de garantie"
                value={form.deposit}
                onChange={handleFieldChange}
                errors={errors}
                fieldName="deposit"
                placeholder="500"
              />

              <FormField
                id="config-service-fee"
                label="Frais de service"
                value={form.serviceFee}
                onChange={handleFieldChange}
                errors={errors}
                fieldName="serviceFee"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={reset} disabled={isUpdating}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
            <Button type="submit" disabled={isUpdating}>
              <Save className="mr-2 h-4 w-4" />
              {isUpdating ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

