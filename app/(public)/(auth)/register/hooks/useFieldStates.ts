import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { type RegisterInput } from "@/lib/validations/auth";

export type FieldState = "default" | "valid" | "error";

export type FieldStates = {
  name: FieldState;
  email: FieldState;
  password: FieldState;
  phone: FieldState;
  acceptRGPD: FieldState;
};

export function useFieldStates(form: UseFormReturn<RegisterInput>) {
  const [fieldStates, setFieldStates] = useState<FieldStates>({
    name: "default",
    email: "default",
    password: "default",
    phone: "default",
    acceptRGPD: "default",
  });

  // Validation visuelle en temps réel basée sur Zod
  useEffect(() => {
    const subscription = form.watch(() => {
      // Utiliser les erreurs de Zod directement
      const errors = form.formState.errors;
      const touchedFields = form.formState.touchedFields;
      const values = form.getValues();

      setFieldStates({
        name:
          touchedFields.name && values.name
            ? errors.name
              ? "error"
              : "valid"
            : "default",
        email:
          touchedFields.email && values.email
            ? errors.email
              ? "error"
              : "valid"
            : "default",
        password:
          touchedFields.password && values.password
            ? errors.password
              ? "error"
              : "valid"
            : "default",
        phone:
          touchedFields.phone && values.phone
            ? errors.phone
              ? "error"
              : "valid"
            : "default",
        acceptRGPD:
          touchedFields.acceptRGPD
            ? errors.acceptRGPD
              ? "error"
              : values.acceptRGPD
                ? "valid"
                : "default"
            : "default",
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return fieldStates;
}

