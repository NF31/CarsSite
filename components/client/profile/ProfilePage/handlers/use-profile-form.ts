import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema } from "@/lib/validations/profile";
import { updateProfileAction } from "@/actions/profile";
import type { z } from "zod";
import type { UserProfile } from "../types";

export function useProfileForm(
  user: UserProfile | null,
  setUser: (user: UserProfile) => void
) {
  const { update } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPhoneValid, setShowPhoneValid] = useState(false);

  const form = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    mode: "onChange",
  });

  // Initialiser le formulaire avec les données utilisateur
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        phone: user.phone || "",
        image: user.image || "",
      });
    }
  }, [user, form]);

  const onSubmit = async (data: z.infer<typeof updateProfileSchema>) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateProfileAction(data);

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de la mise à jour");
      }

      if (result.user) {
        setUser(result.user as UserProfile);
      }
      setSuccess(result.message || "Profil mis à jour avec succès");
      await update(); // Mettre à jour la session
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour du profil");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    form,
    onSubmit,
    isSaving,
    error,
    success,
    setSuccess,
    showPhoneValid,
    setShowPhoneValid,
  };
}

