import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export type VerifyEmailStatus = "loading" | "success" | "error" | "waiting" | null;

export function useURLParams() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const sent = searchParams.get("sent");
  const errorParam = searchParams.get("error");
  const dev = searchParams.get("dev");

  const [status, setStatus] = useState<VerifyEmailStatus>(null);
  const [message, setMessage] = useState<string>("");
  const [devToken, setDevToken] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      if (dev === "true") {
        // Mode dev : afficher le token et permettre la vérification
        setDevToken(token);
        setStatus("waiting");
        setMessage("En mode développement, utilisez le bouton ci-dessous pour vérifier votre email.");
      } else {
        // Token normal : statut initialisé, la vérification sera déclenchée par le hook de vérification
        setStatus("loading");
      }
    } else if (sent === "true") {
      setStatus("waiting");
      setMessage("Un email de vérification a été envoyé à votre adresse. Veuillez cliquer sur le lien dans l'email.");
    } else if (errorParam === "true") {
      setStatus("error");
      setMessage("L'email de vérification n'a pas pu être envoyé. Veuillez utiliser le bouton ci-dessous pour renvoyer l'email.");
    } else {
      setStatus("error");
      setMessage("Token de vérification manquant");
    }
  }, [token, sent, errorParam, dev]);

  return {
    token,
    email,
    status,
    message,
    devToken,
    setStatus,
    setMessage,
  };
}

