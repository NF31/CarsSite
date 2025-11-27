import { useRef, useCallback, useState } from "react";
import type { DatesSetArg } from "@fullcalendar/core";
import type { CalendarRange } from "@/actions/admin/bookings";

interface UseCalendarRangeProps {
  initialRange: CalendarRange;
  onRangeChange: (range: CalendarRange) => Promise<void>;
}

export function useCalendarRange({ initialRange, onRangeChange }: UseCalendarRangeProps) {
  const [activeViewType, setActiveViewType] = useState<string>("dayGridMonth");
  const lastFetchedRangeRef = useRef<string | null>(null);

  const makeRangeKey = useCallback((range: CalendarRange) => `${range.start}|${range.end}`, []);

  const updateRangeState = useCallback((nextRange: CalendarRange) => {
    // Cette fonction peut être utilisée pour mettre à jour l'état si nécessaire
    // Pour l'instant, on délègue la gestion à useCalendarEvents
  }, []);

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const nextRange: CalendarRange = {
        start: arg.start.toISOString(),
        end: arg.end.toISOString(),
      };

      setActiveViewType(arg.view.type);

      const nextKey = makeRangeKey(nextRange);

      if (lastFetchedRangeRef.current === nextKey) {
        updateRangeState(nextRange);
        return;
      }

      lastFetchedRangeRef.current = nextKey;
      updateRangeState(nextRange);

      onRangeChange(nextRange);
    },
    [makeRangeKey, updateRangeState, onRangeChange],
  );

  return {
    activeViewType,
    handleDatesSet,
  };
}

