"use client";

import { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DriverLicenseUpload } from "../DriverLicenseUpload";
import type { BookingUserOption } from "@/actions/admin/bookings";

interface DriverLicenseUploadInfo {
  normalizedCount: number;
  remaining: number;
  nextAllowedAt: Date | null;
  lastWithinWindow: Date | null;
}

interface DriverLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: BookingUserOption | null;
  driverLicenseUploadInfo: DriverLicenseUploadInfo | null;
  maxReplacements: number;
  cooldownDays: number;
  onUploaded: (data: {
    url: string;
    publicId: string;
    uploadCount: number;
    lastUploadedAt: string;
  }) => void;
}

export const DriverLicenseDialog = memo(function DriverLicenseDialog({
  open,
  onOpenChange,
  selectedUser,
  driverLicenseUploadInfo,
  maxReplacements,
  cooldownDays,
  onUploaded,
}: DriverLicenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Permis de conduire du client</DialogTitle>
          <DialogDescription>
            Téléversez un PDF sécurisé du permis de conduire. Le document est stocké dans un dossier privé.
          </DialogDescription>
        </DialogHeader>
        {selectedUser ? (
          <DriverLicenseUpload
            userId={selectedUser.id}
            userName={selectedUser.name}
            existingUrl={selectedUser.driverLicenseUrl}
            uploadCount={driverLicenseUploadInfo?.normalizedCount ?? 0}
            lastUploadedAt={
              driverLicenseUploadInfo?.lastWithinWindow
                ? driverLicenseUploadInfo.lastWithinWindow.toISOString()
                : null
            }
            maxReplacements={maxReplacements}
            cooldownDays={cooldownDays}
            onUploaded={onUploaded}
            onDismiss={() => onOpenChange(false)}
          />
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
            Sélectionnez un client avant d&apos;ajouter un permis de conduire.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

