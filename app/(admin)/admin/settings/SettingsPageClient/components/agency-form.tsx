"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, RefreshCcw, Save } from "lucide-react";
import { useAgencyForm } from "../hooks/use-agency-form";
import { MessageAlert } from "./message-alert";
import { FormField } from "./form-field";
import type { SettingsPageClientProps } from "../types";

interface AgencyFormProps {
  initialData: SettingsPageClientProps["initialData"]["agency"];
}

/**
 * Formulaire des informations de l'agence
 */
export function AgencyForm({ initialData }: AgencyFormProps) {
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
  } = useAgencyForm({ initialData });

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
    <Card className="xl:col-span-2">
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">
              Informations de l&apos;agence
            </span>
          </div>
          <CardTitle className="text-2xl">Identité et coordonnées</CardTitle>
          <CardDescription>
            Ces informations sont utilisées dans l&apos;interface client, les factures et les
            communications automatiques.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={reset} disabled={isUpdating}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <MessageAlert message={message} onClose={() => setMessage(null)} />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              id="agency-name"
              label="Nom de l'agence"
              value={form.name}
              onChange={handleFieldChange}
              errors={errors}
              fieldName="name"
              placeholder="CarRental Paris"
            />

            <FormField
              id="agency-logo"
              label="Logo (URL)"
              value={form.logoUrl}
              onChange={handleFieldChange}
              errors={errors}
              fieldName="logoUrl"
              placeholder="https://..."
              type="url"
            />

            <FormField
              id="agency-address"
              label="Adresse complète"
              value={form.address}
              onChange={handleFieldChange}
              errors={errors}
              fieldName="address"
              placeholder="123 Avenue de la Liberté, 75000 Paris"
              textarea
              rows={3}
              className="md:col-span-2"
            />

            <FormField
              id="agency-phone"
              label="Téléphone"
              value={form.phone}
              onChange={handleFieldChange}
              errors={errors}
              fieldName="phone"
              placeholder="+33 1 23 45 67 89"
            />

            <FormField
              id="agency-email"
              label="Email"
              value={form.email}
              onChange={handleFieldChange}
              errors={errors}
              fieldName="email"
              placeholder="contact@carrental.com"
              type="email"
            />

            <FormField
              id="agency-hours"
              label="Horaires d'ouverture"
              value={form.openingHours}
              onChange={handleFieldChange}
              errors={errors}
              fieldName="openingHours"
              placeholder="Lun - Sam : 08h00 - 19h00"
              textarea
              rows={2}
              className="md:col-span-2"
            />
          </div>

          <div className="flex justify-end gap-2">
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

