import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ReturnLocationInputProps {
  id: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  placeId: string;
  placeIdFieldName: string;
}

export function ReturnLocationInput({
  id,
  name,
  placeholder,
  value,
  onChange,
  inputRef,
  placeId,
  placeIdFieldName,
}: ReturnLocationInputProps) {
  return (
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
          const value = e.target.value;
          console.log("[HomeSearchWidget] 📝 Input change for return:", value);
          onChange(value);
        }}
      />
      <input type="hidden" name={name} value={value || ""} />
      <input type="hidden" name={placeIdFieldName} value={placeId || ""} />
    </div>
  );
}

