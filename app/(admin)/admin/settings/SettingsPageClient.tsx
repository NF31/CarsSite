"use client";

import { ShieldCheck } from "lucide-react";
import { AgencyForm } from "./SettingsPageClient/components/agency-form";
import { ConfigurationForm } from "./SettingsPageClient/components/configuration-form";
import { EmailForm } from "./SettingsPageClient/components/email-form";
import type { SettingsPageClientProps } from "./SettingsPageClient/types";

export function SettingsPageClient({ initialData }: SettingsPageClientProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Paramètres</h1>
            <p className="text-sm text-muted-foreground">
              Gérez la configuration globale de l&apos;agence, vos préférences et vos notifications
              automatiques.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AgencyForm initialData={initialData.agency} />
        <ConfigurationForm initialData={initialData.configuration} />
        <EmailForm initialData={initialData.emails} />
      </div>
    </div>
  );
}
