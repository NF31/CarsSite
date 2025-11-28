import { memo } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
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

interface RGPDCheckboxProps {
  form: UseFormReturn<RegisterInput>;
  fieldState: FieldState;
}

export const RGPDCheckbox = memo(function RGPDCheckbox({
  form,
  fieldState,
}: RGPDCheckboxProps) {
  return (
    <FormField
      control={form.control}
      name="acceptRGPD"
      render={({ field }) => (
        <FormItem className="w-full">
          <div className={cn(
            "flex flex-row items-start gap-2 sm:gap-3 rounded-md border p-3 sm:p-4 transition-colors",
            fieldState === "error" && "border-red-500 bg-red-50/50"
          )}>
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className={cn(
                  "mt-0.5 sm:mt-0 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0",
                  fieldState === "error" && "border-red-500"
                )}
              />
            </FormControl>
            <div className="flex-1 min-w-0">
              <FormLabel className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer leading-snug sm:leading-relaxed block">
                J&apos;accepte le traitement de mes données personnelles conformément à la{" "}
                <Link
                  href="/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium break-words"
                  onClick={(e) => e.stopPropagation()}
                >
                  Politique de Confidentialité
                </Link>
                {" "}(RGPD)
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              {fieldState === "error" && (
                <p className="text-xs sm:text-sm text-red-500 mt-1.5 sm:mt-2">
                  Vous devez consentir au traitement de vos données personnelles
                </p>
              )}
              <FormMessage className="text-xs sm:text-sm text-red-500 mt-1" />
            </div>
          </div>
        </FormItem>
      )}
    />
  );
});

