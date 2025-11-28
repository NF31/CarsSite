import { memo, useState } from "react";
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
import { type LoginInput } from "@/lib/validations/auth";
import { ErrorBanner } from "./ErrorBanner";
import { PasswordInput } from "./PasswordInput";
import { RememberMeCheckbox } from "./RememberMeCheckbox";

interface LoginFormProps {
  form: UseFormReturn<LoginInput>;
  onSubmit: (data: LoginInput) => void;
  rememberMe: boolean;
  onRememberMeChange: (checked: boolean) => void;
  isLoading: boolean;
  error: string | null;
  urlError: string | null;
}

export const LoginForm = memo(function LoginForm({
  form,
  onSubmit,
  rememberMe,
  onRememberMeChange,
  isLoading,
  error,
  urlError,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="jean@example.com"
                  className="h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 border-gray-300 focus:border-primary focus:ring-primary"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">
                Mot de passe
              </FormLabel>
              <PasswordInput
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <RememberMeCheckbox
          checked={rememberMe}
          onCheckedChange={onRememberMeChange}
        />

        {(error || urlError) && <ErrorBanner error={error || urlError || ""} />}

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 sm:py-4 md:py-6 text-sm sm:text-base transition-all duration-200"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="hidden sm:inline">Connexion en cours...</span>
              <span className="sm:hidden">En cours...</span>
            </span>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>
    </Form>
  );
});

