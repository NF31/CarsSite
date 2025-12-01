import { useState, useTransition } from "react";
import { getMyDriverLicenseUrlAction } from "@/actions/profile";

export function useDriverLicense() {
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [isLicensePending, startLicenseTransition] = useTransition();
  const [isLicenseDialogOpen, setIsLicenseDialogOpen] = useState(false);

  const handleViewDriverLicense = (userHasLicense: boolean) => {
    if (!userHasLicense || isLicensePending) {
      return;
    }
    startLicenseTransition(async () => {
      setLicenseError(null);
      const result = await getMyDriverLicenseUrlAction();

      if (!result.success || !result.data) {
        setLicenseError(result.error ?? "Impossible de récupérer le permis.");
        return;
      }

      // Télécharger le PDF avec le nom du fichier original
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
    isLicensePending,
    isLicenseDialogOpen,
    setIsLicenseDialogOpen,
    handleViewDriverLicense,
  };
}

