import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEFAULT_SUCCESS_MESSAGES: Record<string, string> = {
  "service-created": "Service créé avec succès.",
  "service-updated": "Service mis à jour avec succès.",
  "service-disabled": "Service désactivé avec succès.",
  "service-activated": "Service activé avec succès.",
};

const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  "invalid-service": "Le service demandé est introuvable ou invalide.",
  "toggle-failed": "Impossible de modifier le statut du service.",
};

interface UseURLParamsProps {
  successMessages?: Record<string, string>;
  errorMessages?: Record<string, string>;
}

export function useURLParams({
  successMessages = DEFAULT_SUCCESS_MESSAGES,
  errorMessages = DEFAULT_ERROR_MESSAGES,
}: UseURLParamsProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const successParam = searchParams.get("success");
  const errorParam = searchParams.get("error");
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    if (!successParam) {
      return;
    }

    const message = successMessages[successParam];

    if (!message) {
      return;
    }

    // Utiliser un callback pour éviter les setState synchrones dans l'effet
    const timeoutId = window.setTimeout(() => {
      setSuccessBanner(message);
      setShowSuccess(true);
    }, 0);

    const newSearchParams = new URLSearchParams(searchParamsString);
    newSearchParams.delete("success");
    const newUrl = newSearchParams.toString()
      ? `${window.location.pathname}?${newSearchParams.toString()}`
      : window.location.pathname;
    router.replace(newUrl);

    const autoHideTimeout = window.setTimeout(() => {
      setShowSuccess(false);
      setSuccessBanner(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearTimeout(autoHideTimeout);
    };
  }, [successParam, router, searchParamsString, successMessages]);

  useEffect(() => {
    if (!errorParam) {
      return;
    }

    const message = errorMessages[errorParam];

    if (!message) {
      return;
    }

    // Utiliser un callback pour éviter les setState synchrones dans l'effet
    const timeoutId = window.setTimeout(() => {
      setErrorBanner(message);
      setShowError(true);
    }, 0);

    const newSearchParams = new URLSearchParams(searchParamsString);
    newSearchParams.delete("error");
    const newUrl = newSearchParams.toString()
      ? `${window.location.pathname}?${newSearchParams.toString()}`
      : window.location.pathname;
    router.replace(newUrl);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [errorParam, router, searchParamsString, errorMessages]);

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setSuccessBanner(null);
  };

  const handleCloseError = () => {
    setShowError(false);
    setErrorBanner(null);
  };

  return {
    showSuccess,
    successBanner,
    showError,
    errorBanner,
    handleCloseSuccess,
    handleCloseError,
  };
}

