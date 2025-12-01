import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "@/lib/validations/profile";
import { changePasswordAction } from "@/actions/profile/password";
import type { z } from "zod";

export function usePasswordForm() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: z.infer<typeof changePasswordSchema>) => {
    setIsChangingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await changePasswordAction(data);

      if (!result.success) {
        throw new Error(result.error || "Erreur lors du changement de mot de passe");
      }

      setSuccess(result.message || "Mot de passe modifié avec succès");
      form.reset();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du changement de mot de passe");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return {
    form,
    onSubmit,
    isChangingPassword,
    error,
    success,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
  };
}

