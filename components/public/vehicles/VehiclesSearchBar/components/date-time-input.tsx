"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DateTimeInputProps = {
  label: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  minDate?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  isMobile?: boolean;
};

export function DateTimeInput({
  label,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  minDate,
  required = false,
  className = "",
  labelClassName = "",
  inputClassName = "",
  isMobile = false,
}: DateTimeInputProps) {
  const baseInputStyle = isMobile
    ? {
        fontSize: "clamp(10px, 2.5vw, 13px)",
        width: "100%",
        maxWidth: "100%",
        minWidth: "0",
        paddingLeft: "clamp(8px, 2vw, 12px)",
        paddingRight: "clamp(8px, 2vw, 12px)",
        boxSizing: "border-box" as const,
        WebkitAppearance: "none" as const,
        MozAppearance: "textfield" as const,
      }
    : {
        fontSize: "clamp(11px, 1.2vw, 14px)",
        width: "100%",
        maxWidth: "100%",
        minWidth: "0",
        paddingLeft: "clamp(8px, 1.5vw, 12px)",
        paddingRight: "clamp(8px, 1.5vw, 12px)",
        boxSizing: "border-box" as const,
      };

  const inputHeight = isMobile ? "h-11" : "h-10";

  return (
    <div className={className}>
      <Label className={labelClassName}>{label}</Label>
      <div className="grid grid-cols-2 gap-1 sm:gap-1.5 w-full min-w-0">
        <Input
          type="date"
          value={dateValue}
          onChange={(e) => onDateChange(e.target.value)}
          min={minDate}
          required={required}
          className={`${inputHeight} w-full min-w-0 flex-1 ${inputClassName}`}
          style={baseInputStyle}
        />
        <Input
          type="time"
          value={timeValue}
          onChange={(e) => onTimeChange(e.target.value)}
          required={required}
          className={`${inputHeight} w-full min-w-0 flex-1 ${inputClassName}`}
          style={baseInputStyle}
        />
      </div>
    </div>
  );
}

