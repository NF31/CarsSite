import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { type ResetPasswordInput } from "@/lib/validations/auth";

export type FieldState = "default" | "valid" | "error";

export type PasswordFieldStates = {
  password: FieldState;
  confirmPassword: FieldState;
};

export function useFieldStates(form: UseFormReturn<ResetPasswordInput>) {
  const [fieldStates, setFieldStates] = useState<PasswordFieldStates>({
    password: "default",
    confirmPassword: "default",
  });

  // Validation visuelle en temps réel basée sur Zod
  useEffect(() => {
    const subscription = form.watch(() => {
      const errors = form.formState.errors;
      const touchedFields = form.formState.touchedFields;
      const values = form.getValues();

      setFieldStates({
        password:
          touchedFields.password && values.password
            ? errors.password
              ? "error"
              : "valid"
            : "default",
        confirmPassword:
          touchedFields.confirmPassword && values.confirmPassword
            ? errors.confirmPassword
              ? "error"
              : "valid"
            : "default",
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return fieldStates;
}
