"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FieldErrors } from "../types";
import { getFirstError } from "../utils/helpers";

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string, field: string) => void;
  errors: FieldErrors;
  fieldName: string;
  placeholder?: string;
  type?: "text" | "email" | "url";
  textarea?: boolean;
  rows?: number;
  className?: string;
}

/**
 * Composant de champ de formulaire réutilisable
 */
export function FormField({
  id,
  label,
  value,
  onChange,
  errors,
  fieldName,
  placeholder,
  type = "text",
  textarea = false,
  rows = 3,
  className = "",
}: FormFieldProps) {
  const error = getFirstError(errors, fieldName);

  const handleChange = (newValue: string) => {
    onChange(newValue, fieldName);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      {textarea ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

