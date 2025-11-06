"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { registerAction } from "@/actions/auth/register";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldStates, setFieldStates] = useState<{
    name: "default" | "valid" | "error";
    email: "default" | "valid" | "error";
    password: "default" | "valid" | "error";
    phone: "default" | "valid" | "error";
    acceptRGPD: "default" | "valid" | "error";
  }>({
    name: "default",
    email: "default",
    password: "default",
    phone: "default",
    acceptRGPD: "default",
  });

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange", // Validation en temps réel
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      acceptRGPD: false,
    },
  });

  // Validation visuelle en temps réel basée sur Zod
  useEffect(() => {
    const subscription = form.watch(() => {
      // Utiliser les erreurs de Zod directement
      const errors = form.formState.errors;
      const touchedFields = form.formState.touchedFields;
      const values = form.getValues();

      setFieldStates({
        name:
          touchedFields.name && values.name
            ? errors.name
              ? "error"
              : "valid"
            : "default",
        email:
          touchedFields.email && values.email
            ? errors.email
              ? "error"
              : "valid"
            : "default",
        password:
          touchedFields.password && values.password
            ? errors.password
              ? "error"
              : "valid"
            : "default",
        phone:
          touchedFields.phone && values.phone
            ? errors.phone
              ? "error"
              : "valid"
            : "default",
        acceptRGPD:
          touchedFields.acceptRGPD
            ? errors.acceptRGPD
              ? "error"
              : values.acceptRGPD
                ? "valid"
                : "default"
            : "default",
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await registerAction(data);

      if (!result.success) {
        setError(result.message || result.error || "Une erreur est survenue");
        return;
      }

      // Rediriger vers la page de vérification d'email
      // Si l'email n'a pas été envoyé mais qu'on a un token dev, l'utiliser
      if (!result.emailSent && (result as any).devToken) {
        router.push(`/verify-email?token=${(result as any).devToken}&email=${encodeURIComponent(data.email)}&dev=true`);
      } else if (result.emailSent) {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}&sent=true`);
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}&error=true`);
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  // Vérifier que le formulaire est valide ET que RGPD est coché
  const formValues = form.watch();
  const isFormValid = 
    form.formState.isValid && 
    formValues.acceptRGPD === true;

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
            Créer un compte
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600">
            Remplissez les informations ci-dessous pour créer votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">
                      Nom complet <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Jean Dupont"
                          className={cn(
                            "pr-8 sm:pr-10 h-10 sm:h-11 text-sm sm:text-base transition-all duration-200",
                            fieldStates.name === "valid" &&
                              "border-green-500 focus:border-green-500 focus:ring-green-500",
                            fieldStates.name === "error" &&
                              "border-red-500 focus:border-red-500 focus:ring-red-500",
                            fieldStates.name === "default" &&
                              "border-gray-300 focus:border-primary focus:ring-primary"
                          )}
                          {...field}
                        />
                        {fieldStates.name === "valid" && (
                          <CheckCircle2 className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        )}
                        {fieldStates.name === "error" && (
                          <XCircle className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder="jean@example.com"
                          className={cn(
                            "pr-8 sm:pr-10 h-10 sm:h-11 text-sm sm:text-base transition-all duration-200",
                            fieldStates.email === "valid" &&
                              "border-green-500 focus:border-green-500 focus:ring-green-500",
                            fieldStates.email === "error" &&
                              "border-red-500 focus:border-red-500 focus:ring-red-500",
                            fieldStates.email === "default" &&
                              "border-gray-300 focus:border-primary focus:ring-primary"
                          )}
                          {...field}
                        />
                        {fieldStates.email === "valid" && (
                          <CheckCircle2 className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        )}
                        {fieldStates.email === "error" && (
                          <XCircle className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">
                      Téléphone
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="tel"
                          placeholder="+33 6 12 34 56 78"
                          className={cn(
                            "pr-8 sm:pr-10 h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 border-gray-300 focus:border-primary focus:ring-primary"
                          )}
                          {...field}
                        />
                        {fieldStates.phone === "valid" && field.value && (
                          <CheckCircle2 className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

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
                        Mot de passe <span className="text-red-500">*</span>
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
                name="acceptRGPD"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <div className={cn(
                      "flex flex-row items-start gap-2 sm:gap-3 rounded-md border p-3 sm:p-4 transition-colors",
                      fieldStates.acceptRGPD === "error" && "border-red-500 bg-red-50/50"
                    )}>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className={cn(
                            "mt-0.5 sm:mt-0 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0",
                            fieldStates.acceptRGPD === "error" && "border-red-500"
                          )}
                        />
                      </FormControl>
                      <div className="flex-1 min-w-0">
                        <FormLabel className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer leading-snug sm:leading-relaxed block">
                          J'accepte le traitement de mes données personnelles conformément à la{" "}
                          <Link
                            href="/legal/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium break-words"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Politique de Confidentialité
                          </Link>
                          {" "}(RGPD)
                          <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        {fieldStates.acceptRGPD === "error" && (
                          <p className="text-xs sm:text-sm text-red-500 mt-1.5 sm:mt-2">
                            Vous devez consentir au traitement de vos données personnelles
                          </p>
                        )}
                        <FormMessage className="text-xs sm:text-sm text-red-500 mt-1" />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-md flex items-start gap-2">
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
                  <span className="flex-1 break-words">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className={cn(
                  "w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 sm:py-4 md:py-6 text-sm sm:text-base transition-all duration-200",
                  !isFormValid && "opacity-50 cursor-not-allowed"
                )}
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Création en cours...</span>
                    <span className="sm:hidden">En cours...</span>
                  </span>
                ) : (
                  "Créer mon compte"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
