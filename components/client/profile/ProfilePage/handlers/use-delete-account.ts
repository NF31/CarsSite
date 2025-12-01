import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deleteAccountSchema } from "@/lib/validations/profile";
import { deleteAccountAction } from "@/actions/profile";
import type { z } from "zod";

export function useDeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const form = useForm<z.infer<typeof deleteAccountSchema>>({
    resolver: zodResolver(deleteAccountSchema),
  });

  const onSubmit = async (data: z.infer<typeof deleteAccountSchema>) => {
    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await deleteAccountAction(data);

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de la demande de suppression");
      }

      setSuccess(
        result.message ||
          "Un email de confirmation a été envoyé. Veuillez cliquer sur le lien dans l'email pour confirmer la suppression."
      );
      form.reset();

      setTimeout(() => {
        setSuccess(null);
      }, 10000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la demande de suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    form,
    onSubmit,
    isDeleting,
    error,
    success,
    showDeletePassword,
    setShowDeletePassword,
  };
}

