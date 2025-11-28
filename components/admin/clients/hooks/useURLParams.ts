import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface UseURLParamsProps {
  successMessages?: Record<string, string>;
  errorMessages?: Record<string, string>;
}

const DEFAULT_SUCCESS_MESSAGES: Record<string, string> = {
  "client-updated": "Client mis à jour avec succès.",
};

const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  "client-invalid": "Client introuvable ou invalide.",
  "client-unavailable": "Impossible d'afficher ce client.",
  "client-update-error": "Impossible de mettre à jour ce client.",
};

export function useURLParams({
  successMessages = DEFAULT_SUCCESS_MESSAGES,
  errorMessages = DEFAULT_ERROR_MESSAGES,
}: UseURLParamsProps = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
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

    setSuccessBanner(message);
    setShowSuccess(true);

    const newSearchParams = new URLSearchParams(searchParamsString);
    newSearchParams.delete("success");
    const newUrl = newSearchParams.toString()
      ? `${window.location.pathname}?${newSearchParams.toString()}`
      : window.location.pathname;
    router.replace(newUrl);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", newUrl);
    }

    const timeout = window.setTimeout(() => {
      setShowSuccess(false);
      setSuccessBanner(null);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [successParam, router, searchParamsString, successMessages]);

  useEffect(() => {
    if (!errorParam) {
      return;
    }

    const message = errorMessages[errorParam];

    if (!message) {
      return;
    }

    setErrorBanner(message);
    setShowError(true);

    const newSearchParams = new URLSearchParams(searchParamsString);
    newSearchParams.delete("error");
    newSearchParams.delete("id");
    const newUrl = newSearchParams.toString()
      ? `${window.location.pathname}?${newSearchParams.toString()}`
      : window.location.pathname;
    router.replace(newUrl);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", newUrl);
    }
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

