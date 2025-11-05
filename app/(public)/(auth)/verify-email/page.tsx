"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const sent = searchParams.get("sent");
  const errorParam = searchParams.get("error");
  const dev = searchParams.get("dev");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "waiting" | null>(
    null
  );
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      if (dev === "true") {
        // Mode dev : afficher le token et permettre la vérification
        setDevToken(token);
        setStatus("waiting");
        setMessage("En mode développement, utilisez le bouton ci-dessous pour vérifier votre email.");
      } else {
        // Token normal : vérifier directement
        verifyEmail(token);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sent, errorParam, dev]);

  async function verifyEmail(token: string) {
    setStatus("loading");
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(result.message || "Erreur lors de la vérification");
        return;
      }

      setStatus("success");
      setMessage(result.message || "Email vérifié avec succès ! Vous pouvez maintenant vous connecter.");

      // NE PAS rediriger automatiquement - laisser l'utilisateur cliquer sur le bouton
    } catch (error) {
      setStatus("error");
      setMessage("Une erreur est survenue. Veuillez réessayer.");
    }
  }

  async function resendVerification() {
    setIsResending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: searchParams.get("email") || "",
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus("waiting");
        setMessage(result.message || "Email de vérification renvoyé");
      } else {
        if (response.status === 429) {
          // Rate limit dépassé
          setError(result.message || "Trop de tentatives. Veuillez réessayer plus tard.");
        } else {
          setError(result.message || "Erreur lors de l'envoi");
        }
      }
    } catch (error) {
      setError("Une erreur est survenue");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          {status === "loading" && (
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
          )}
          {status === "success" && (
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          )}
          {status === "error" && (
            <div className="flex justify-center mb-4">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
          )}
          {!status && (
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
          )}

          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Vérification en cours..."}
            {status === "success" && "Email vérifié !"}
            {status === "error" && "Erreur de vérification"}
            {!status && "Vérification d'email"}
          </CardTitle>
          <CardDescription>{message || "Vérification de votre email..."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                {message || "Email vérifié avec succès !"}
              </p>
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white">
                <Link href="/login?verified=true">Se connecter maintenant</Link>
              </Button>
            </div>
          )}

          {status === "waiting" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {message}
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md flex items-center gap-2">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {devToken && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    Mode développement - Lien de vérification :
                  </p>
                  <p className="text-xs text-yellow-700 mb-3 break-all">
                    {`${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/verify-email?token=${devToken}`}
                  </p>
                  <Button
                    onClick={() => verifyEmail(devToken)}
                    className="w-full"
                  >
                    Vérifier maintenant
                  </Button>
                </div>
              )}
              {email && (
                <Button
                  onClick={resendVerification}
                  disabled={isResending}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Renvoyer l'email de vérification
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {message || "Le lien de vérification est invalide ou a expiré."}
              </p>
              {email && (
                <Button
                  onClick={resendVerification}
                  disabled={isResending}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Renvoyer l'email de vérification
                    </>
                  )}
                </Button>
              )}
              <Button asChild variant="ghost" className="w-full">
                <Link href="/register">Créer un nouveau compte</Link>
              </Button>
            </div>
          )}

          {status === "loading" && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Veuillez patienter pendant la vérification...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

