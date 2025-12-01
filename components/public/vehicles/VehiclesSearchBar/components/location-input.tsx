"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import type { RefObject } from "react";

type LocationInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceIdChange: (placeId: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  required?: boolean;
  disabled?: boolean;
  showHint?: boolean;
  hintText?: string;
  className?: string;
  labelClassName?: string;
};

export function LocationInput({
  label,
  placeholder,
  value,
  onChange,
  onPlaceIdChange,
  inputRef,
  required = false,
  disabled = false,
  showHint = false,
  hintText,
  className = "",
  labelClassName = "",
}: LocationInputProps) {
  return (
    <div className={className}>
      <Label className={labelClassName}>
        {label}
        {showHint && hintText && (
          <span className="text-xs font-normal text-muted-foreground ml-1">{hintText}</span>
        )}
      </Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!e.target.value) {
              onPlaceIdChange("");
            }
          }}
          required={required}
          disabled={disabled}
          className={`h-10 pl-9 pr-3 text-sm w-full ${
            disabled
              ? "bg-gray-50 text-muted-foreground cursor-not-allowed opacity-75"
              : "bg-white"
          }`}
        />
        <input type="hidden" value={value} />
      </div>
    </div>
  );
}

