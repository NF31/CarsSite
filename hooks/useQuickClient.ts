import { useState, useTransition, useCallback } from "react";
import { createQuickClientAction } from "@/actions/admin/bookings";
import type { BookingUserOption } from "@/actions/admin/bookings";
import type { QuickClientInput } from "@/lib/validations/client";

interface UseQuickClientProps {
  onClientCreated: (client: BookingUserOption) => void;
}

export function useQuickClient({ onClientCreated }: UseQuickClientProps) {
  const [isCreatingClient, startCreateClient] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const createClient = useCallback(
    async (values: QuickClientInput): Promise<BookingUserOption | null> => {
      setServerError(null);

      const result = await createQuickClientAction({
        name: values.name,
        email: values.email,
        phone: values.phone ?? undefined,
        sendInvitation: values.sendInvitation ?? false,
      });

      if (!result.success) {
        setServerError(result.error ?? "Erreur lors de la création du client");
        return null;
      }

      onClientCreated(result.data);
      return result.data;
    },
    [onClientCreated]
  );

  return {
    createClient,
    isCreatingClient,
    serverError,
    setServerError,
  };
}

