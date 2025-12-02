import { CalendarDays } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { DialogMode } from "../types";
import { getMinTime } from "../utils";

interface DateRangeInputsProps {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  onStartDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  mode: DialogMode;
  todayIso: string;
  now: Date;
  isPending: boolean;
  hasStarted: boolean;
  hasEnded: boolean;
  error?: string[];
}

export function DateRangeInputs({
  startDate,
  startTime,
  endDate,
  endTime,
  onStartDateChange,
  onStartTimeChange,
  onEndDateChange,
  onEndTimeChange,
  mode,
  todayIso,
  now,
  isPending,
  hasStarted,
  hasEnded,
  error,
}: DateRangeInputsProps) {
  const minStartTime = getMinTime(mode, startDate, todayIso, now);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Début
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="date"
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              min={todayIso}
              disabled={isPending || hasStarted || hasEnded}
              className="w-full"
            />
            <Input
              type="time"
              value={startTime}
              onChange={(event) => onStartTimeChange(event.target.value)}
              min={minStartTime}
              disabled={isPending || hasStarted || hasEnded}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Fin
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="date"
              value={endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              min={startDate || todayIso}
              disabled={isPending || hasEnded}
              className="w-full"
            />
            <Input
              type="time"
              value={endTime}
              onChange={(event) => onEndTimeChange(event.target.value)}
              min={startDate === endDate ? startTime : undefined}
              disabled={isPending || hasEnded}
              className="w-full"
            />
          </div>
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error[0]}</p>}
    </>
  );
}

