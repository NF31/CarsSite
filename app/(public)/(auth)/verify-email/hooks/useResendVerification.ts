import { useState } from "react";
import { resendVerificationAction } from "@/actions/auth/resend-verification";
import { type VerifyEmailStatus } from "./useURLParams";

export function useResendVerification() {
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<VerifyEmailStatus>(null);
  const [message, setMessage] = useState<string>("");

  async function resendVerification(email: string) {
    setIsResending(true);
    setError(null);
    try {
      const result = await resendVerificationAction(email);

      if (result.success) {
        setStatus("waiting");
        setMessage(result.message || "Email de vérification renvoyé");
      } else {
        if (result.status === 429) {
          // Rate limit dépassé
          setError(result.message || result.error || "Trop de tentatives. Veuillez réessayer plus tard.");
        } else {
          setError(result.message || result.error || "Erreur lors de l'envoi");
        }
      }
    } catch (error) {
      setError("Une erreur est survenue");
    } finally {
      setIsResending(false);
    }
  }

  return {
    isResending,
    error,
    status,
    message,
    setStatus,
    setMessage,
    resendVerification,
  };
}

