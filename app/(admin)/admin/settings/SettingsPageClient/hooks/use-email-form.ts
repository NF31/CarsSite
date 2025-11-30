"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { updateEmailSettingsAction } from "@/actions/admin/settings";
import type { EmailFormData, FieldErrors, MessageState } from "../types";

interface UseEmailFormProps {
  initialData: {
    smtpFromName?: string | null;
    smtpFromEmail?: string | null;
    notifications: {
      bookingConfirmation?: boolean | null;
      bookingReminder?: boolean | null;
      paymentConfirmation?: boolean | null;
      cancellationNotification?: boolean | null;
    };
  };
}

export function useEmailForm({ initialData }: UseEmailFormProps) {
  const initialForm = useMemo(
    () => ({
      smtpFromName: initialData.smtpFromName ?? "",
      smtpFromEmail: initialData.smtpFromEmail ?? "",
      notifications: {
        bookingConfirmation: initialData.notifications.bookingConfirmation ?? true,
        bookingReminder: initialData.notifications.bookingReminder ?? true,
        paymentConfirmation: initialData.notifications.paymentConfirmation ?? true,
        cancellationNotification: initialData.notifications.cancellationNotification ?? true,
      },
    }),
    [initialData]
  );

  const [form, setForm] = useState<EmailFormData>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<MessageState | null>(null);
  const [isUpdating, startUpdate] = useTransition();

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const reset = useCallback(() => {
    setForm(initialForm);
    setErrors({});
    setMessage(null);
  }, [initialForm]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      startUpdate(async () => {
        setErrors({});
        setMessage(null);

        const payload = {
          smtpFromName: form.smtpFromName.trim(),
          smtpFromEmail: form.smtpFromEmail.trim(),
          bookingConfirmation: form.notifications.bookingConfirmation,
          bookingReminder: form.notifications.bookingReminder,
          paymentConfirmation: form.notifications.paymentConfirmation,
          cancellationNotification: form.notifications.cancellationNotification,
        };

        const result = await updateEmailSettingsAction(payload);

        if (!result.success) {
          setMessage({
            type: "error",
            text: result.error ?? "Impossible de mettre à jour les paramètres d'email.",
          });
          if (result.fieldErrors) {
            setErrors(result.fieldErrors);
          }
          return;
        }

        setMessage({
          type: "success",
          text: result.message ?? "Paramètres d'email mis à jour.",
        });
      });
    },
    [form, startUpdate]
  );

  return {
    form,
    setForm,
    errors,
    setErrors,
    message,
    setMessage,
    isUpdating,
    reset,
    handleSubmit,
  };
}

