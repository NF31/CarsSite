import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/actions/auth/forgot-password";

export function useForgotPasswordSubmit() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await forgotPasswordAction(data);

      if (!result.success) {
        const errorResult = result as {
          success: false;
          error?: string;
          message?: string;
          status?: number;
          resetAt?: Date;
        };
        
        if (errorResult.status === 429) {
          setError(
            errorResult.resetAt
              ? `Trop de tentatives. Veuillez réessayer après ${new Date(errorResult.resetAt).toLocaleTimeString("fr-FR")}`
              : errorResult.message || "Trop de tentatives. Veuillez réessayer plus tard."
          );
        } else {
          setError(errorResult.message || errorResult.error || "Une erreur est survenue");
        }
        return;
      }

      if (result.success) {
        setSuccess(true);
        form.reset();
      }
    } catch {
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
    onSubmit,
  };
}

