"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Car, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/auth/login";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (verified === "true") {
      setShowSuccess(true);
      // Masquer le message après 5 secondes
      setTimeout(() => setShowSuccess(false), 5000);
    }
    
    // Gérer les erreurs passées via les paramètres d'URL
    const errorParam = searchParams.get("error");
    if (errorParam) {
      // Message générique pour éviter la fuite d'information
      setError("Identifiants incorrects");
    }
  }, [verified, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Utiliser la Server Action pour le rate limiting et verrouillage
      const result = await loginAction({
        email,
        password,
        rememberMe,
      });

      if (!result.success) {
        // Gérer les erreurs de rate limiting
        if (result.status === 429) {
          setError(result.error || "Trop de tentatives. Veuillez réessayer dans quelques instants.");
        } else if (result.status === 423) {
          // Compte verrouillé
          setError(result.error || "Compte temporairement verrouillé. Veuillez réessayer plus tard.");
        } else {
          // Message d'erreur générique pour éviter la fuite d'information
          setError(result.error || "Identifiants incorrects");
        }
        return;
      }

      // Si la connexion réussit, attendre un peu pour que la session soit mise à jour
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Récupérer le rôle depuis la session pour rediriger correctement
      const sessionResponse = await fetch("/api/auth/session");
      const session = await sessionResponse.json();
      const role = session?.user?.role;
      
      if (role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
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
            Connexion
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600">
            Connectez-vous à votre compte pour continuer
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          {showSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-md flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
              <span className="flex-1 break-words">Votre email a été vérifié avec succès ! Vous pouvez maintenant vous connecter.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="jean@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-700">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 sm:pr-12 h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 border-gray-300 focus:border-primary focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-0.5"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="h-4 w-4 sm:h-5 sm:w-5"
              />
              <Label
                htmlFor="rememberMe"
                className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Se souvenir de moi
              </Label>
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
                  <span className="hidden sm:inline">Connexion en cours...</span>
                  <span className="sm:hidden">En cours...</span>
                </span>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 text-center">
            <div className="text-xs sm:text-sm">
              <Link
                href="/forgot-password"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="text-xs sm:text-sm">
              <span className="text-muted-foreground">
                Vous n'avez pas de compte ?{" "}
              </span>
              <Link
                href="/register"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                S'inscrire
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


