import { memo } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { type RegisterInput } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import { type FieldStates } from "../hooks";
import { FormFieldWithValidation } from "./FormFieldWithValidation";
import { PasswordField } from "./PasswordField";
import { RGPDCheckbox } from "./RGPDCheckbox";
import { ErrorBanner } from "./ErrorBanner";

interface RegisterFormProps {
  form: UseFormReturn<RegisterInput>;
  onSubmit: (data: RegisterInput) => void;
  isLoading: boolean;
  error: string | null;
  isFormValid: boolean;
  fieldStates: FieldStates;
}

export const RegisterForm = memo(function RegisterForm({
  form,
  onSubmit,
  isLoading,
  error,
  isFormValid,
  fieldStates,
}: RegisterFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
        <FormFieldWithValidation
          form={form}
          name="name"
          label="Nom complet"
          placeholder="Jean Dupont"
          type="text"
          fieldState={fieldStates.name}
          required
        />

        <FormFieldWithValidation
          form={form}
          name="email"
          label="Email"
          placeholder="jean@example.com"
          type="email"
          fieldState={fieldStates.email}
          required
        />

        <FormFieldWithValidation
          form={form}
          name="phone"
          label="Téléphone"
          placeholder="+33 6 12 34 56 78"
          type="tel"
          fieldState={fieldStates.phone}
        />

        <PasswordField form={form} fieldState={fieldStates.password} />

        <RGPDCheckbox form={form} fieldState={fieldStates.acceptRGPD} />

        {error && <ErrorBanner error={error} />}

        <Button
          type="submit"
          className={cn(
            "w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 sm:py-4 md:py-6 text-sm sm:text-base transition-all duration-200",
            !isFormValid && "opacity-50 cursor-not-allowed"
          )}
          disabled={isLoading || !isFormValid}
          aria-label={isLoading ? "Création du compte en cours" : "Créer mon compte"}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="hidden sm:inline">Création en cours...</span>
              <span className="sm:hidden">En cours...</span>
            </span>
          ) : (
            "Créer mon compte"
          )}
        </Button>
      </form>
    </Form>
  );
});

