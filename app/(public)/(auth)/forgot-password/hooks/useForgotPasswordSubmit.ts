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
        form.reset();
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
    onSubmit,
  };
}

