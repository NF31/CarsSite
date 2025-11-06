"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { forgotPasswordAction } from "@/actions/auth/forgot-password";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await forgotPasswordAction({ email });

      if (!result.success) {
        if (result.status === 429) {
          setError(
            result.resetAt
              ? `Trop de tentatives. Veuillez réessayer après ${new Date(result.resetAt).toLocaleTimeString("fr-FR")}`
              : result.error || "Trop de tentatives. Veuillez réessayer plus tard."
          );
        } else {
          setError(result.message || result.error || "Une erreur est survenue");
        }
        return;
      }

      if (result.success) {
        setSuccess(true);
        setEmail("");
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-4 sm:py-8 md:py-12 px-4 sm:px-6">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center pb-4 sm:pb-6 px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="rounded-full bg-primary/10 p-2 sm:p-3">
              <Car className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
            Mot de passe oublié
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-md flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Email envoyé !</p>
                  <p className="break-words">
                    Si cet email existe dans notre système, vous recevrez un lien de réinitialisation dans quelques instants.
                  </p>
                  <p className="mt-2 text-xs">
                    Vérifiez votre boîte de réception et vos spams.
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à la connexion
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700">
                  Adresse email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
                  <span className="flex-1 break-words">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 sm:py-4 md:py-6 text-sm sm:text-base transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Envoi en cours...</span>
                    <span className="sm:hidden">En cours...</span>
                  </span>
                ) : (
                  "Envoyer le lien de réinitialisation"
                )}
              </Button>
            </form>
          )}

          <div className="mt-4 sm:mt-6 text-center">
            <div className="text-xs sm:text-sm">
              <span className="text-muted-foreground">Vous vous souvenez de votre mot de passe ? </span>
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

