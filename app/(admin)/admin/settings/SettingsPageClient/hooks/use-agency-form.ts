"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { updateAgencySettingsAction } from "@/actions/admin/settings";
import type { AgencyFormData, FieldErrors, MessageState } from "../types";

interface UseAgencyFormProps {
  initialData: {
    name?: string | null;
    logoUrl?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    openingHours?: string | null;
  };
}

export function useAgencyForm({ initialData }: UseAgencyFormProps) {
  const initialForm = useMemo(
    () => ({
      name: initialData.name ?? "",
      logoUrl: initialData.logoUrl ?? "",
      address: initialData.address ?? "",
      phone: initialData.phone ?? "",
      email: initialData.email ?? "",
      openingHours: initialData.openingHours ?? "",
    }),
    [initialData]
  );

  const [form, setForm] = useState<AgencyFormData>(initialForm);
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

        const result = await updateAgencySettingsAction({
          name: form.name.trim(),
          logoUrl: form.logoUrl.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          openingHours: form.openingHours.trim(),
        });

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

