import { memo, useState } from "react";
import { CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { type RegisterInput } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import { type FieldState } from "../hooks";

interface PasswordFieldProps {
  form: UseFormReturn<RegisterInput>;
  fieldState: FieldState;
}

export const PasswordField = memo(function PasswordField({
  form,
  fieldState,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormField
      control={form.control}
      name="password"
      render={({ field }) => {
        const passwordValue = field.value || "";
        const hasMinLength = passwordValue.length >= 8;
        const hasUpperCase = /[A-Z]/.test(passwordValue);
        const hasNumber = /[0-9]/.test(passwordValue);

        return (
          <FormItem>
            <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">
              Mot de passe <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn(
                    "pr-16 sm:pr-20 h-10 sm:h-11 text-sm sm:text-base transition-all duration-200",
                    fieldState === "valid" &&
                      "border-green-500 focus:border-green-500 focus:ring-green-500",
                    fieldState === "error" &&
                      "border-red-500 focus:border-red-500 focus:ring-red-500",
                    fieldState === "default" &&
                      "border-gray-300 focus:border-primary focus:ring-primary"
                  )}
                  {...field}
                />
                <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
                  {fieldState === "valid" && (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  )}
                  {fieldState === "error" && (
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-auto w-auto p-0.5 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </FormControl>
            <div className="space-y-1.5 sm:space-y-2 mt-2">
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                <div className={cn("flex items-center gap-1.5 sm:gap-2", hasMinLength ? "text-green-600" : "text-gray-500")}>
                  {hasMinLength ? (
                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm">Au moins 8 caractères</span>
                </div>
                <div className={cn("flex items-center gap-1.5 sm:gap-2", hasUpperCase ? "text-green-600" : "text-gray-500")}>
                  {hasUpperCase ? (
                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm">Au moins une majuscule</span>
                </div>
                <div className={cn("flex items-center gap-1.5 sm:gap-2", hasNumber ? "text-green-600" : "text-gray-500")}>
                  {hasNumber ? (
                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm">Au moins un chiffre</span>
                </div>
              </div>
            </div>
            <FormMessage className="text-sm text-red-500" />
          </FormItem>
        );
      }}
    />
  );
});

