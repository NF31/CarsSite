"use client";

import type { UseFormReturn } from "react-hook-form";
import { CheckCircle2, XCircle } from "lucide-react";
import type { CreateVehicleInput } from "@/lib/validations/vehicle";

export function getFieldValidation(
  form: UseFormReturn<CreateVehicleInput>,
  fieldName: keyof CreateVehicleInput
): { className: string; icon: React.ReactElement | null } {
  const { formState: { errors, touchedFields }, watch } = form;
  const isTouched = touchedFields[fieldName];
  const hasError = errors[fieldName];
  const hasValue = watch(fieldName);

  if (!isTouched && !hasValue) {
    return { className: "", icon: null };
  }

  if (hasError) {
    return {
      className: "border-red-500 focus-visible:ring-red-500",
      icon: <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />,
    };
  }

  if (isTouched && !hasError && hasValue) {
    return {
      className: "border-green-500 focus-visible:ring-green-500",
      icon: <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />,
    };
  }

  return { className: "", icon: null };
}

export function getSelectValidation(
  form: UseFormReturn<CreateVehicleInput>,
  fieldName: keyof CreateVehicleInput
): { className: string; icon: React.ReactElement | null } {
  const { formState: { errors }, watch } = form;
  const hasError = errors[fieldName];
  const fieldValue = watch(fieldName);
  const hasValue = fieldValue !== undefined && fieldValue !== null && fieldValue !== "";

  if (hasError) {
    return {
      className: "border-red-500 focus:ring-red-500",
      icon: <XCircle className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500 pointer-events-none" />,
    };
  }

  if (!hasError && hasValue) {
    return {
      className: "border-green-500 focus:ring-green-500",
      icon: <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 pointer-events-none" />,
    };
  }

  return { className: "", icon: null };
}

