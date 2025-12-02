import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminAgencySettings } from "@/types/admin-settings";
import { normalizeAgencyData } from "../utils";

type FieldErrors = Record<string, string[]>;

interface UseAgencyFormReturn {
  form: ReturnType<typeof normalizeAgencyData>;
  errors: FieldErrors;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof normalizeAgencyData>>>;
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  getError: (field: keyof AdminAgencySettings) => string | undefined;
  updateField: (field: keyof AdminAgencySettings, value: string) => void;
  resetForm: () => void;
}

/**
 * Hook pour gérer l'état du formulaire d'agence
 */
export function useAgencyForm(
  initialAgency: AdminAgencySettings
): UseAgencyFormReturn {
  const normalizedInitial = useMemo(
    () => normalizeAgencyData(initialAgency),
    [initialAgency]
  );

  const [form, setForm] = useState(normalizedInitial);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    setForm(normalizedInitial);
    setErrors({});
  }, [normalizedInitial]);

  const getError = useCallback(
    (field: keyof AdminAgencySettings) => errors[field]?.[0],
    [errors]
  );

  const updateField = useCallback((field: keyof AdminAgencySettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [errors]);

  const resetForm = useCallback(() => {
    setForm(normalizedInitial);
    setErrors({});
  }, [normalizedInitial]);

  return {
    form,
    errors,
    setForm,
    setErrors,
    getError,
    updateField,
    resetForm,
  };
}

