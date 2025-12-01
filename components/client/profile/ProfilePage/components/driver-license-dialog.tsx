"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientDriverLicenseUpload } from "@/components/client/ClientDriverLicenseUpload";
import type { UserProfile, DriverLicenseUploadInfo } from "../types";

type DriverLicenseDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  driverLicenseUploadInfo: DriverLicenseUploadInfo;
  maxReplacements: number;
  cooldownDays: number;
  onUploaded: () => Promise<void>;
};

export function DriverLicenseDialog({
  isOpen,
  onOpenChange,
  user,
  driverLicenseUploadInfo,
  maxReplacements,
  cooldownDays,
  onUploaded,
}: DriverLicenseDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {user.driverLicense ? "Remplacer le permis de conduire" : "Ajouter votre permis de conduire"}
          </DialogTitle>
          <DialogDescription>
            Téléversez un PDF sécurisé de votre permis de conduire. Le document est stocké dans un
            dossier privé.
          </DialogDescription>
        </DialogHeader>
        <ClientDriverLicenseUpload
          userName={user.name}
          existingUrl={user.driverLicense}
          uploadCount={driverLicenseUploadInfo.normalizedCount}
          lastUploadedAt={
            driverLicenseUploadInfo.lastWithinWindow
              ? driverLicenseUploadInfo.lastWithinWindow.toISOString()
              : null
          }
          maxReplacements={maxReplacements}
          cooldownDays={cooldownDays}
          onUploaded={onUploaded}
          onDismiss={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

