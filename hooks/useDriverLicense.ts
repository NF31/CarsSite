import { useState, useTransition } from "react";
import { getDriverLicenseUrlAction } from "@/actions/admin/bookings";

export function useDriverLicense() {
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleViewDriverLicense = (userId: string) => {
    startTransition(async () => {
      setLicenseError(null);
      const result = await getDriverLicenseUrlAction({
        userId,
      });

      if (!result.success || !result.data) {
        setLicenseError(result.error ?? "Impossible de récupérer le permis pour ce client.");
        return;
      }

      window.open(result.data.url, "_blank", "noopener,noreferrer");
    });
  };

  return {
    licenseError,
    isPending,
    handleViewDriverLicense,
  };
}

