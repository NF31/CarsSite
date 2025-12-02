import { useCallback, useState, useTransition } from "react";
import { updateAgencySettingsAction } from "@/actions/admin/settings";
import type { AdminAgencySettings } from "@/types/admin-settings";

type Message = { type: "success" | "error"; text: string } | null;
type FieldErrors = Record<string, string[]>;

interface UseAgencySettingsSubmitReturn {
  isPending: boolean;
  message: Message;
  setMessage: React.Dispatch<React.SetStateAction<Message>>;
  handleSubmit: (form: ReturnType<typeof import("../utils").normalizeAgencyData>) => (event: React.FormEvent<HTMLFormElement>) => void;
}

/**
 * Hook pour gérer la soumission du formulaire de paramètres d'agence
 */
export function useAgencySettingsSubmit(
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>
): UseAgencySettingsSubmitReturn {
  const [message, setMessage] = useState<Message>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = useCallback(
    (form: ReturnType<typeof import("../utils").normalizeAgencyData>) =>
      (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        startTransition(async () => {
          setErrors({});
          setMessage(null);

          const payload = {
            name: form.name.trim(),
            logoUrl: form.logoUrl.trim(),
            address: form.address.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            openingHours: form.openingHours.trim(),
          };

          const result = await updateAgencySettingsAction(payload);

          if (!result.success) {
            setMessage({
              type: "error",
              text: result.error ?? "Impossible de mettre à jour les informations de l'agence.",
            });
            if (result.fieldErrors) {
              setErrors(result.fieldErrors);
            }
            return;
          }

          setMessage({
            type: "success",
            text: result.message ?? "Informations de l'agence mises à jour.",
          });
        });
      },
    [setErrors]
  );

  return {
    isPending,
    message,
    setMessage,
    handleSubmit,
  };
}

