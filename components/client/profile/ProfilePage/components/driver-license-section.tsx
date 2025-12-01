"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Upload, AlertCircle } from "lucide-react";
import type { UserProfile, DriverLicenseUploadInfo } from "../types";

type DriverLicenseSectionProps = {
  user: UserProfile;
  driverLicenseUploadInfo: DriverLicenseUploadInfo;
  isDriverLicenseUploadBlocked: boolean;
  isLicensePending: boolean;
  licenseError: string | null;
  maxReplacements: number;
  onViewLicense: () => void;
  onOpenDialog: () => void;
};

export function DriverLicenseSection({
  user,
  driverLicenseUploadInfo,
  isDriverLicenseUploadBlocked,
  isLicensePending,
  licenseError,
  maxReplacements,
  onViewLicense,
  onOpenDialog,
}: DriverLicenseSectionProps) {
  return (
    <div className="space-y-2">
      <Label>Permis de conduire</Label>
      <div className="flex gap-2">
        {user.driverLicense ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onViewLicense}
              disabled={!user.driverLicense || isLicensePending}
            >
              {isLicensePending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              Voir le permis
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onOpenDialog}
              disabled={isDriverLicenseUploadBlocked}
            >
              <Upload className="mr-2 h-4 w-4" />
              Remplacer le permis
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={onOpenDialog}>
            <Upload className="mr-2 h-4 w-4" />
            Ajouter votre permis
          </Button>
        )}
      </div>
      {user.driverLicense && driverLicenseUploadInfo.remaining < maxReplacements && (
        <p className="text-xs text-muted-foreground">
          Remplacements restants : {driverLicenseUploadInfo.remaining} / {maxReplacements}
        </p>
      )}
      {isDriverLicenseUploadBlocked && driverLicenseUploadInfo.nextAllowedAt && (
        <p className="text-xs text-amber-600">
          Limite atteinte. Prochain remplacement possible le{" "}
          {new Date(driverLicenseUploadInfo.nextAllowedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
      {licenseError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{licenseError}</span>
        </div>
      )}
    </div>
  );
}

