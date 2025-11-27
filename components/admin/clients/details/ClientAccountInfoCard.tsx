"use client";

import { memo } from "react";
import { AlertCircle, BadgeCheck, Shield, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { clientDateTimeFormatter } from "@/components/admin/clients/client-helpers";
import type { ClientDetail } from "@/actions/admin/clients";

interface ClientAccountInfoCardProps {
  client: ClientDetail;
  statusBadge: React.ReactNode;
  isPending: boolean;
  licenseError: string | null;
  onViewLicense: () => void;
}

export const ClientAccountInfoCard = memo(function ClientAccountInfoCard({
  client,
  statusBadge,
  isPending,
  licenseError,
  onViewLicense,
}: ClientAccountInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Informations du compte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">Nom complet</p>
            <p className="font-semibold text-gray-900">{client.name}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">Adresse email</p>
            <p className="font-semibold text-gray-900 break-all">{client.email}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">Téléphone</p>
            <p className="font-semibold text-gray-900 break-all">
              {client.phone ?? "Non renseigné"}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">Statut du compte</p>
            {statusBadge}
          </div>
        </div>
        <Separator />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {client.hasDriverLicense ? <BadgeCheck className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Permis de conduire</p>
              <p className="text-sm text-muted-foreground">
                {client.hasDriverLicense
                  ? client.driverLicenseLastUploadedAt
                    ? `Dernier envoi le ${clientDateTimeFormatter.format(new Date(client.driverLicenseLastUploadedAt))}`
                    : "Document disponible"
                  : "Aucun permis enregistré"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onViewLicense}
            disabled={!client.hasDriverLicense || isPending}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
            Voir le permis
          </Button>
        </div>
        {licenseError && (
          <p className="text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {licenseError}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

