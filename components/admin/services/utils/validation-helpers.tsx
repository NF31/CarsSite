"use client";

import type { UseFormReturn } from "react-hook-form";
import { CheckCircle2, XCircle } from "lucide-react";
import type { CreateServiceInput } from "@/lib/validations/service";

export function getFieldValidation(
  form: UseFormReturn<CreateServiceInput>,
  fieldName: keyof CreateServiceInput
): { className: string; icon: React.ReactElement | null } {
  const {
    formState: { errors, touchedFields },
    watch,
  } = form;
  const isTouched = touchedFields[fieldName];
  const hasError = errors[fieldName];
  const hasValue = watch(fieldName);

  if (!isTouched && (hasValue === undefined || hasValue === "")) {
    return { className: "", icon: null };
  }

  if (hasError) {
    return {
      className: "border-red-500 focus-visible:ring-red-500",
      icon: (
        <XCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
      ),
    };
  }

  if (isTouched && !hasError && hasValue !== undefined && hasValue !== "") {
    return {
      className: "border-green-500 focus-visible:ring-green-500",
      icon: (
        <CheckCircle2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
      ),
    };
  }

  return { className: "", icon: null };
}

export function getSelectValidation(
  form: UseFormReturn<CreateServiceInput>,
  fieldName: keyof CreateServiceInput
): { className: string; icon: React.ReactElement | null } {
  const {
    formState: { errors, touchedFields },
    watch,
  } = form;
  const hasError = errors[fieldName];
  const isTouched = touchedFields[fieldName];
  const value = watch(fieldName);
  const hasValue = value !== undefined && value !== null && value !== "";

  if (hasError) {
    return {
      className: "border-red-500 focus:ring-red-500",
      icon: (
        <XCircle className="pointer-events-none absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
      ),
    };
  }

  if (isTouched && hasValue && !hasError) {
    return {
      className: "border-green-500 focus:ring-green-500",
      icon: (
        <CheckCircle2 className="pointer-events-none absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
      ),
    };
  }

  return { className: "", icon: null };
}

