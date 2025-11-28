import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { resetPasswordAction } from "@/actions/auth/reset-password";

export function useResetPasswordSubmit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

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
      setError(null);
    } else {
      setTokenValid(false);
      setError("Token manquant. Veuillez utiliser le lien reçu par email.");
    }
  }, [token, form]);

  async function onSubmit(data: ResetPasswordInput) {
    const formToken = data.token || token;
    if (!formToken) {
      setError("Token manquant. Veuillez utiliser le lien reçu par email.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await resetPasswordAction({
        token: formToken,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (!result.success) {
        setError(result.message || result.error || "Une erreur est survenue");
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

  return {
    form,
    isLoading,
    error,
    success,
    tokenValid,
    token,
    onSubmit,
  };
}

