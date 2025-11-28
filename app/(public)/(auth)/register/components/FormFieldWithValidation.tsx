import { memo } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
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

interface FormFieldWithValidationProps {
  form: UseFormReturn<RegisterInput>;
  name: "name" | "email" | "phone";
  label: string;
  placeholder: string;
  type?: "text" | "email" | "tel";
  fieldState: FieldState;
  required?: boolean;
}

export const FormFieldWithValidation = memo(function FormFieldWithValidation({
  form,
  name,
  label,
  placeholder,
  type = "text",
  fieldState,
  required = false,
}: FormFieldWithValidationProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type={type}
                placeholder={placeholder}
                className={cn(
                  "pr-8 sm:pr-10 h-10 sm:h-11 text-sm sm:text-base transition-all duration-200",
                  fieldState === "valid" &&
                    "border-green-500 focus:border-green-500 focus:ring-green-500",
                  fieldState === "error" &&
                    "border-red-500 focus:border-red-500 focus:ring-red-500",
                  fieldState === "default" &&
                    "border-gray-300 focus:border-primary focus:ring-primary"
                )}
                {...field}
              />
              {fieldState === "valid" && (
                <CheckCircle2 className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              )}
              {fieldState === "error" && (
                <XCircle className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              )}
            </div>
          </FormControl>
          <FormMessage className="text-sm text-red-500" />
        </FormItem>
      )}
    />
  );
});

