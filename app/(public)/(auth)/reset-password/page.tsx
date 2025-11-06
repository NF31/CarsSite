"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Car, CheckCircle2, XCircle, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [fieldStates, setFieldStates] = useState<{
    password: "default" | "valid" | "error";
    confirmPassword: "default" | "valid" | "error";
  }>({
    password: "default",
    confirmPassword: "default",
  });

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange", // Validation en temps réel
    defaultValues: {
      token: token || "",
      password: "",
      confirmPassword: "",
    },
  });

  // Mettre à jour le token dans le formulaire si disponible
  useEffect(() => {
    if (token) {
      form.setValue("token", token);
      setTokenValid(true);
    } else {
      setTokenValid(false);
      setError("Token manquant. Veuillez utiliser le lien reçu par email.");
    }
  }, [token, form]);

  // Validation visuelle en temps réel basée sur Zod
  useEffect(() => {
    const subscription = form.watch(() => {
      const errors = form.formState.errors;
      const touchedFields = form.formState.touchedFields;
      const values = form.getValues();

      setFieldStates({
        password:
          touchedFields.password && values.password
            ? errors.password
              ? "error"
              : "valid"
            : "default",
        confirmPassword:
          touchedFields.confirmPassword && values.confirmPassword
            ? errors.confirmPassword
              ? "error"
              : "valid"
            : "default",
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(data: ResetPasswordInput) {
    if (!token) {
      setError("Token manquant. Veuillez utiliser le lien reçu par email.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Une erreur est survenue");
        if (result.error === "Token invalide ou expiré") {
          setTokenValid(false);
        }
        return;
      }

      if (result.success) {
        setSuccess(true);
        // Rediriger vers login après 3 secondes
        setTimeout(() => {
          router.push("/login?reset=success");
        }, 3000);
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  if (tokenValid === false) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-4 sm:py-8 md:py-12 px-4 sm:px-6">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="space-y-1 text-center pb-4 sm:pb-6 px-4 sm:px-6 pt-6 sm:pt-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="rounded-full bg-red-100 p-2 sm:p-3">
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              Lien invalide
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              Ce lien de réinitialisation est invalide ou a expiré
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-md mb-4">
              <p className="break-words">
                {error || "Le lien que vous avez utilisé est invalide ou a expiré. Veuillez demander un nouveau lien de réinitialisation."}
              </p>
            </div>
            <div className="space-y-2">
              <Button className="w-full" asChild>
                <Link href="/forgot-password">
                  Demander un nouveau lien
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à la connexion
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-4 sm:py-8 md:py-12 px-4 sm:px-6">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="space-y-1 text-center pb-4 sm:pb-6 px-4 sm:px-6 pt-6 sm:pt-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="rounded-full bg-green-100 p-2 sm:p-3">
                <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              Mot de passe réinitialisé
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              Votre mot de passe a été réinitialisé avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-md mb-4">
              <p>Vous allez être redirigé vers la page de connexion dans quelques secondes...</p>
            </div>
            <Button className="w-full" asChild>
              <Link href="/login">
                Se connecter maintenant
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
            Réinitialiser le mot de passe
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600">
            Entrez votre nouveau mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => {
                  const passwordValue = field.value || "";
                  const hasMinLength = passwordValue.length >= 8;
                  const hasUpperCase = /[A-Z]/.test(passwordValue);
                  const hasNumber = /[0-9]/.test(passwordValue);

                  return (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">
                        Nouveau mot de passe <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className={cn(
                              "pr-16 sm:pr-20 h-10 sm:h-11 text-sm sm:text-base transition-all duration-200",
                              fieldStates.password === "valid" &&
                                "border-green-500 focus:border-green-500 focus:ring-green-500",
                              fieldStates.password === "error" &&
                                "border-red-500 focus:border-red-500 focus:ring-red-500",
                              fieldStates.password === "default" &&
                                "border-gray-300 focus:border-primary focus:ring-primary"
                            )}
                            disabled={isLoading}
                            {...field}
                          />
                          <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
                            {fieldStates.password === "valid" && (
                              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                            )}
                            {fieldStates.password === "error" && (
                              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                            )}
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="text-gray-500 hover:text-gray-700 transition-colors p-0.5"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                              ) : (
                                <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </FormControl>
                      <div className="space-y-1.5 sm:space-y-2 mt-2">
                        <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                          <div className={cn("flex items-center gap-1.5 sm:gap-2", hasMinLength ? "text-green-600" : "text-gray-500")}>
                            {hasMinLength ? (
                              <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                            )}
                            <span className="text-xs sm:text-sm">Au moins 8 caractères</span>
                          </div>
                          <div className={cn("flex items-center gap-1.5 sm:gap-2", hasUpperCase ? "text-green-600" : "text-gray-500")}>
                            {hasUpperCase ? (
                              <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                            )}
                            <span className="text-xs sm:text-sm">Au moins une majuscule</span>
                          </div>
                          <div className={cn("flex items-center gap-1.5 sm:gap-2", hasNumber ? "text-green-600" : "text-gray-500")}>
                            {hasNumber ? (
                              <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                            )}
                            <span className="text-xs sm:text-sm">Au moins un chiffre</span>
                          </div>
                        </div>
                      </div>
                      <FormMessage className="text-sm text-red-500" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">
                      Confirmer le mot de passe <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className={cn(
                            "pr-16 sm:pr-20 h-10 sm:h-11 text-sm sm:text-base transition-all duration-200",
                            fieldStates.confirmPassword === "valid" &&
                              "border-green-500 focus:border-green-500 focus:ring-green-500",
                            fieldStates.confirmPassword === "error" &&
                              "border-red-500 focus:border-red-500 focus:ring-red-500",
                            fieldStates.confirmPassword === "default" &&
                              "border-gray-300 focus:border-primary focus:ring-primary"
                          )}
                          disabled={isLoading}
                          {...field}
                        />
                        <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
                          {fieldStates.confirmPassword === "valid" && (
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                          )}
                          {fieldStates.confirmPassword === "error" && (
                            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                          )}
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="text-gray-500 hover:text-gray-700 transition-colors p-0.5"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
                  <span className="flex-1 break-words">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className={cn(
                  "w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 sm:py-4 md:py-6 text-sm sm:text-base transition-all duration-200",
                  (!form.formState.isValid || !token) && "opacity-50 cursor-not-allowed"
                )}
                disabled={isLoading || !form.formState.isValid || !token}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Réinitialisation en cours...</span>
                    <span className="sm:hidden">En cours...</span>
                  </span>
                ) : (
                  "Réinitialiser le mot de passe"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-4 sm:mt-6 text-center">
            <div className="text-xs sm:text-sm">
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <ArrowLeft className="inline mr-1 h-3 w-3" />
                Retour à la connexion
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

