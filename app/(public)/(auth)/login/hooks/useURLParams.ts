import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function useURLParams() {
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const errorParam = searchParams.get("error");
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (verified === "true") {
      setShowSuccess(true);
      // Masquer le message après 5 secondes
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
    
    // Gérer les erreurs passées via les paramètres d'URL
    if (errorParam) {
      // Message générique pour éviter la fuite d'information
      setUrlError("Identifiants incorrects");
    }
  }, [verified, errorParam]);

  return {
    showSuccess,
    urlError,
  };
}

