import { useState, useCallback } from "react";
import { verifyEmailAction } from "@/actions/auth/verify-email";
import { type VerifyEmailStatus } from "./useURLParams";

export function useVerifyEmail() {
  const [status, setStatus] = useState<VerifyEmailStatus>(null);
  const [message, setMessage] = useState<string>("");

  const verifyEmail = useCallback(async (token: string) => {
    setStatus("loading");
    try {
      const result = await verifyEmailAction(token);

      if (!result.success) {
        setStatus("error");
        setMessage(result.message || result.error || "Erreur lors de la vérification");
        return;
      }

      setStatus("success");
      setMessage(result.message || "Email vérifié avec succès ! Vous pouvez maintenant vous connecter.");
    } catch (error) {
      setStatus("error");
      setMessage("Une erreur est survenue. Veuillez réessayer.");
    }
  }, []);

  return {
    status,
    message,
    setStatus,
    setMessage,
    verifyEmail,
  };
}

