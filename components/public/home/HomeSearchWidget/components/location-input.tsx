import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface LocationInputProps {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  placeId: string;
  placeIdFieldName: string;
  required?: boolean;
}

export function LocationInput({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  inputRef,
  placeId,
  placeIdFieldName,
  required = false,
}: LocationInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <Badge className="bg-slate-900 text-white">1</Badge>
        {label}
      </Label>
      <div className="relative h-10 sm:h-12 rounded-lg sm:rounded-xl border border-slate-200 bg-white">
        <MapPin className="absolute left-3 sm:left-4 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-primary z-30 pointer-events-none" />
        <Input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          placeholder={placeholder}
          className="h-10 sm:h-12 w-full rounded-lg sm:rounded-xl border-0 bg-transparent pl-9 sm:pl-11 pr-3 sm:pr-4 text-sm sm:text-base text-slate-900 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange(newValue);
            // Mettre à jour le champ caché
            const form = e.target.closest("form");
            if (form) {
              const hiddenInput = form.querySelector(`input[name="${name}"]`) as HTMLInputElement;
              if (hiddenInput) {
                hiddenInput.value = newValue;
              }
            }
          }}
          required={required}
        />
        <input type="hidden" name={placeIdFieldName} value={placeId || ""} />
      </div>
    </div>
  );
}

