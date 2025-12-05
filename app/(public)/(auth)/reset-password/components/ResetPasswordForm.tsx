import { memo } from "react";
import Link from "next/link";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { type ResetPasswordInput } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import { type PasswordFieldStates } from "../hooks";
import { PasswordField } from "./PasswordField";
import { ErrorBanner } from "./ErrorBanner";

interface ResetPasswordFormProps {
  form: UseFormReturn<ResetPasswordInput>;
  onSubmit: (data: ResetPasswordInput) => void;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  fieldStates: PasswordFieldStates;
}

export const ResetPasswordForm = memo(function ResetPasswordForm({
  form,
  onSubmit,
  isLoading,
  error,
  token,
  fieldStates,
}: ResetPasswordFormProps) {
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
          <PasswordField
            form={form}
            name="password"
            label="Nouveau mot de passe"
            fieldState={fieldStates.password}
            isLoading={isLoading}
          />

          <PasswordField
            form={form}
            name="confirmPassword"
            label="Confirmer le mot de passe"
            fieldState={fieldStates.confirmPassword}
            isLoading={isLoading}
          />

          {error && <ErrorBanner error={error} />}

          <Button
            type="submit"
            className={cn(
              "w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 sm:py-4 md:py-6 text-sm sm:text-base transition-all duration-200",
              (!form.formState.isValid || !token) && "opacity-50 cursor-not-allowed"
            )}
            disabled={isLoading || !form.formState.isValid || !token}
            aria-label={isLoading ? "Réinitialisation du mot de passe en cours" : "Réinitialiser le mot de passe"}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Réinitialisation en cours...</span>
                <span className="sm:hidden">En cours...</span>
              </span>
            ) : (
              "Réinitialiser le mot de passe"
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-4 sm:mt-6 text-center">
        <div className="text-xs sm:text-sm">
          <Link
            href="/login"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <ArrowLeft className="inline mr-1 h-3 w-3" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </>
  );
});

