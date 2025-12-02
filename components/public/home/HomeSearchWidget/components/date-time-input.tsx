import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateTimeInputProps {
  dateLabel: string;
  dateId: string;
  dateName: string;
  dateValue: string;
  dateMin: string;
  onDateChange: (value: string) => void;
  timeId: string;
  timeName: string;
  timeValue: string;
  timeMin?: string;
  onTimeChange: (value: string) => void;
  dateRequired?: boolean;
}

export function DateTimeInput({
  dateLabel,
  dateId,
  dateName,
  dateValue,
  dateMin,
  onDateChange,
  timeId,
  timeName,
  timeValue,
  timeMin,
  onTimeChange,
  dateRequired = false,
}: DateTimeInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={dateId} className="text-sm font-semibold text-slate-600">
        {dateLabel}
      </Label>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] gap-2">
        <Input
          id={dateId}
          name={dateName}
          type="date"
          className="h-10 sm:h-12 rounded-lg sm:rounded-xl border-slate-200 text-sm"
          min={dateMin}
          required={dateRequired}
          value={dateValue}
          onChange={(e) => onDateChange(e.target.value)}
        />
        <Input
          id={timeId}
          name={timeName}
          type="time"
          value={timeValue}
          min={timeMin}
          className="h-10 sm:h-12 rounded-lg sm:rounded-xl border-slate-200 text-sm"
          onChange={(e) => onTimeChange(e.target.value)}
        />
      </div>
    </div>
  );
}

