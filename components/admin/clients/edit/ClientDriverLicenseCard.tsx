"use client";

import { memo } from "react";
import { AlertCircle, BadgeCheck, Loader2, Shield, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clientDateTimeFormatter } from "@/components/admin/clients/client-helpers";
import type { ClientDetail } from "@/actions/admin/clients";

const DRIVER_LICENSE_MAX_REPLACEMENTS = 3;
const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

interface DriverLicenseUploadInfo {
  normalizedCount: number;
  remaining: number;
  nextAllowedAt: Date | null;
  lastWithinWindow: Date | null;
}

interface ClientDriverLicenseCardProps {
  clientData: ClientDetail;
  driverLicenseUploadInfo: DriverLicenseUploadInfo;
  isLicensePending: boolean;
  licenseError: string | null;
  isDriverLicenseUploadBlocked: boolean;
  onViewLicense: () => void;
  onOpenUploadDialog: () => void;
}

export const ClientDriverLicenseCard = memo(function ClientDriverLicenseCard({
  clientData,
  driverLicenseUploadInfo,
  isLicensePending,
  licenseError,
  isDriverLicenseUploadBlocked,
  onOpenUploadDialog,
  onViewLicense,
}: ClientDriverLicenseCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Permis de conduire
        </CardTitle>
        <CardDescription>
          Informations sur le permis de conduire du client.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {clientData.hasDriverLicense ? <BadgeCheck className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Permis de conduire</p>
              <p className="text-sm text-muted-foreground">
                {clientData.hasDriverLicense
                  ? clientData.driverLicenseLastUploadedAt
                    ? `Dernier envoi le ${clientDateTimeFormatter.format(new Date(clientData.driverLicenseLastUploadedAt))}`
                    : "Document disponible"
                  : "Aucun permis enregistré"}
              </p>
              {clientData.hasDriverLicense && clientData.driverLicenseFileName && (
                <p className="text-xs text-muted-foreground mt-1">
                  Fichier : <span className="font-medium text-gray-900">{clientData.driverLicenseFileName}</span>
                </p>
              )}
              {clientData.hasDriverLicense && (
                <p className="text-xs text-muted-foreground mt-1">
                  Remplacements restants :{" "}
                  <span className="font-medium text-gray-900">{driverLicenseUploadInfo.remaining}</span>{" "}
                  / {DRIVER_LICENSE_MAX_REPLACEMENTS}
                  {driverLicenseUploadInfo.nextAllowedAt && (
                    <>
                      {" "}
                      • Prochain remplacement possible le{" "}
                      <span className="font-medium text-gray-900">
                        {DATE_FORMATTER.format(driverLicenseUploadInfo.nextAllowedAt)}
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {clientData.hasDriverLicense && (
              <Button
                type="button"
                variant="outline"
                onClick={onViewLicense}
                disabled={!clientData.hasDriverLicense || isLicensePending}
              >
                {isLicensePending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                Voir le permis
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenUploadDialog();
              }}
              disabled={isDriverLicenseUploadBlocked}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              {clientData.hasDriverLicense ? "Remplacer le permis" : "Ajouter le permis"}
            </Button>
          </div>
        </div>
        {licenseError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{licenseError}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

