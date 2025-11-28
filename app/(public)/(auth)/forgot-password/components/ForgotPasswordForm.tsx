import { memo } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ErrorBanner } from "./ErrorBanner";
import { type ForgotPasswordInput } from "@/lib/validations/auth";

interface ForgotPasswordFormProps {
  form: UseFormReturn<ForgotPasswordInput>;
  onSubmit: (data: ForgotPasswordInput) => void;
  isLoading: boolean;
  error: string | null;
}

export const ForgotPasswordForm = memo(function ForgotPasswordForm({
  form,
  onSubmit,
  isLoading,
  error,
}: ForgotPasswordFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">
                Adresse email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="jean@example.com"
                  disabled={isLoading}
                  className="h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 border-gray-300 focus:border-primary focus:ring-primary"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && <ErrorBanner error={error} />}

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 sm:py-4 md:py-6 text-sm sm:text-base transition-all duration-200"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="hidden sm:inline">Envoi en cours...</span>
              <span className="sm:hidden">En cours...</span>
            </span>
          ) : (
            "Envoyer le lien de réinitialisation"
          )}
        </Button>
      </form>
    </Form>
  );
});

