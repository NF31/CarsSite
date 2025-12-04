import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { MaintenanceType } from "@/lib/types/maintenance-type";
import { TYPE_OPTIONS } from "../constants";

interface TypeSelectProps {
  type: MaintenanceType;
  onValueChange: (value: MaintenanceType) => void;
  isPending: boolean;
  hasEnded: boolean;
}

export function TypeSelect({ type, onValueChange, isPending, hasEnded }: TypeSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="maintenance-type">Type de maintenance</Label>
      <Select
        value={type}
        onValueChange={(value) => onValueChange(value as MaintenanceType)}
        disabled={isPending || hasEnded}
      >
        <SelectTrigger id="maintenance-type" className="w-full">
          <SelectValue placeholder="Type d'intervention" />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

