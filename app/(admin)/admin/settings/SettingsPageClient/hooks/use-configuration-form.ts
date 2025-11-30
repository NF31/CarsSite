"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { updateConfigurationSettingsAction } from "@/actions/admin/settings";
import { parseNumberInput } from "../utils/helpers";
import type { ConfigurationFormData, FieldErrors, MessageState } from "../types";

interface UseConfigurationFormProps {
  initialData: {
    currency?: string | null;
    language?: string | null;
    timezone?: string | null;
    cancellationPolicy?: string | null;
    taxRate?: number | null;
    deposit?: number | null;
    serviceFee?: number | null;
  };
}

export function useConfigurationForm({ initialData }: UseConfigurationFormProps) {
  const initialForm = useMemo(
    () => ({
      currency: initialData.currency ?? "",
      language: initialData.language ?? "",
      timezone: initialData.timezone ?? "",
      cancellationPolicy: initialData.cancellationPolicy ?? "",
      taxRate: String(initialData.taxRate ?? ""),
      deposit: String(initialData.deposit ?? ""),
      serviceFee: String(initialData.serviceFee ?? ""),
    }),
    [initialData]
  );

  const [form, setForm] = useState<ConfigurationFormData>(initialForm);
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
          currency: form.currency.trim(),
          language: form.language.trim(),
          timezone: form.timezone.trim(),
          cancellationPolicy: form.cancellationPolicy.trim(),
          taxRate: parseNumberInput(form.taxRate),
          deposit: parseNumberInput(form.deposit),
          serviceFee: parseNumberInput(form.serviceFee),
        };

        const result = await updateConfigurationSettingsAction(payload);

        if (!result.success) {
          setMessage({
            type: "error",
            text: result.error ?? "Impossible de mettre à jour la configuration.",
          });
          if (result.fieldErrors) {
            setErrors(result.fieldErrors);
          }
          return;
        }

        setMessage({
          type: "success",
          text: result.message ?? "Configuration mise à jour.",
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

