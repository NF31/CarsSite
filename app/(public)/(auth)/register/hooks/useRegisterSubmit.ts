import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/actions/auth/register";

export function useRegisterSubmit() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const successResult = result as {
        success: true;
        emailSent?: boolean;
        devToken?: string;
      };
      
      if (!successResult.emailSent && successResult.devToken) {
        router.push(`/verify-email?token=${successResult.devToken}&email=${encodeURIComponent(data.email)}&dev=true`);
      } else if (successResult.emailSent) {
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

  return {
    form,
    isLoading,
    error,
    isFormValid,
    onSubmit,
  };
}

