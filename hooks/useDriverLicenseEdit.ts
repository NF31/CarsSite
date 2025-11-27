import { useState, useTransition, useMemo } from "react";
import { getDriverLicenseUrlAction } from "@/actions/admin/bookings";
import type { ClientDetail } from "@/actions/admin/clients";

const DRIVER_LICENSE_MAX_REPLACEMENTS = 3;
const DRIVER_LICENSE_COOLDOWN_DAYS = 21;

export interface DriverLicenseUploadInfo {
  normalizedCount: number;
  remaining: number;
  nextAllowedAt: Date | null;
  lastWithinWindow: Date | null;
}

export function useDriverLicenseEdit(clientData: ClientDetail) {
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [isLicensePending, startLicenseTransition] = useTransition();

  const driverLicenseUploadInfo = useMemo<DriverLicenseUploadInfo>(() => {
    if (!clientData.hasDriverLicense) {
      return {
        normalizedCount: 0,
        remaining: DRIVER_LICENSE_MAX_REPLACEMENTS,
        nextAllowedAt: null,
        lastWithinWindow: null,
      };
    }

    const rawCount = clientData.driverLicenseUploadCount ?? 0;
    const lastUploadedAt = clientData.driverLicenseLastUploadedAt
      ? new Date(clientData.driverLicenseLastUploadedAt)
      : null;
    const now = new Date();
    const cooldownMs = DRIVER_LICENSE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

    let normalizedCount = rawCount;
    let lastWithinWindow = lastUploadedAt;

    if (lastUploadedAt && now.getTime() - lastUploadedAt.getTime() > cooldownMs) {
      normalizedCount = 0;
      lastWithinWindow = null;
    }

    const remaining = Math.max(DRIVER_LICENSE_MAX_REPLACEMENTS - normalizedCount, 0);
    const nextAllowedAt =
      remaining === 0 && lastWithinWindow
        ? new Date(lastWithinWindow.getTime() + cooldownMs)
        : null;

    return {
      normalizedCount,
      remaining,
      nextAllowedAt,
      lastWithinWindow,
    };
  }, [clientData.hasDriverLicense, clientData.driverLicenseUploadCount, clientData.driverLicenseLastUploadedAt]);

  const isDriverLicenseUploadBlocked = Boolean(
    clientData.hasDriverLicense &&
    driverLicenseUploadInfo &&
    driverLicenseUploadInfo.remaining === 0 &&
    driverLicenseUploadInfo.nextAllowedAt
  );

  const handleViewDriverLicense = () => {
    if (!clientData.hasDriverLicense) {
      return;
    }
    startLicenseTransition(async () => {
      setLicenseError(null);
      const result = await getDriverLicenseUrlAction({
        userId: clientData.id,
      });

      if (!result.success || !result.data) {
        setLicenseError(result.error ?? "Impossible de récupérer le permis pour ce client.");
        return;
      }

      try {
        const response = await fetch(result.data.url);
        if (!response.ok) throw new Error("Erreur lors du téléchargement");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.fileName || "permis.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch {
        window.open(result.data.url, "_blank", "noopener,noreferrer");
      }
    });
  };

  return {
    licenseError,
    isLicensePending,
    driverLicenseUploadInfo,
    isDriverLicenseUploadBlocked,
    handleViewDriverLicense,
  };
}

