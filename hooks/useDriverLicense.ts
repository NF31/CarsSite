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

      // Télécharger le PDF avec le nom du fichier original (comme dans le profil)
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
        // Fallback : ouvrir dans un nouvel onglet
        window.open(result.data.url, "_blank", "noopener,noreferrer");
      }
    });
  };

  return {
    licenseError,
    isPending,
    handleViewDriverLicense,
  };
}

