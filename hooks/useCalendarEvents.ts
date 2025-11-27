import { useState, useTransition, useCallback, useMemo } from "react";
import type { EventInput } from "@fullcalendar/core";
import { getCalendarEventsAction, type CalendarRange, type BookingCalendarEvent } from "@/actions/admin/bookings";
import type { CalendarEventMeta } from "@/components/admin/bookings/calendar/types";
import { STATUS_CONFIG } from "@/components/admin/bookings/calendar/status-config";

interface UseCalendarEventsProps {
  initialEvents: BookingCalendarEvent[];
  initialRange: CalendarRange;
}

export function useCalendarEvents({ initialEvents, initialRange }: UseCalendarEventsProps) {
  const [events, setEvents] = useState<BookingCalendarEvent[]>(initialEvents);
  const [currentRange, setCurrentRange] = useState<CalendarRange>(initialRange);
  const [isRefreshing, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshEvents = useCallback(
    async (range: CalendarRange) => {
      startTransition(async () => {
        const result = await getCalendarEventsAction(range);
        if (result.success && result.data) {
          setEvents(result.data);
          setErrorMessage(null);
        } else {
          setErrorMessage(
            result.error ?? "Impossible de charger les réservations pour cette plage de dates."
          );
        }
      });
    },
    []
  );

  const handleRefresh = useCallback(() => {
    refreshEvents(currentRange);
  }, [currentRange, refreshEvents]);

  const updateRange = useCallback((nextRange: CalendarRange) => {
    setCurrentRange((prev: CalendarRange) => {
      if (prev.start === nextRange.start && prev.end === nextRange.end) {
        return prev;
      }
      return nextRange;
    });
  }, []);

  return {
    events,
    setEvents,
    currentRange,
    updateRange,
    isRefreshing,
    errorMessage,
    setErrorMessage,
    refreshEvents,
    handleRefresh,
  };
}

export function useCalendarEventTransformation(
  events: BookingCalendarEvent[],
  activeViewType: string
): { calendarEvents: EventInput[] } {
  const formatBookingEvent = useCallback((booking: BookingCalendarEvent): EventInput => {
    const meta = STATUS_CONFIG[booking.status];
    return {
      id: booking.id,
      title: booking.reference,
      start: booking.start,
      end: booking.end,
      display: "block",
      className: ["booking-event", meta.className],
      extendedProps: { kind: "booking", booking } satisfies CalendarEventMeta,
    };
  }, []);

  const calendarEvents = useMemo<EventInput[]>(() => {
    const isTimeGridView = activeViewType.startsWith("timeGrid");

    if (!isTimeGridView) {
      return events.map(formatBookingEvent);
    }

    const grouped = new Map<string, BookingCalendarEvent[]>();
    events.forEach((booking) => {
      const dayKey = booking.start.slice(0, 10);
      const list = grouped.get(dayKey);
      if (list) {
        list.push(booking);
      } else {
        grouped.set(dayKey, [booking]);
      }
    });

    const results: EventInput[] = [];

    grouped.forEach((bookings, day) => {
      const sorted = bookings.sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      );

      if (sorted.length > 2) {
        results.push({
          id: `aggregate-${day}`,
          title: `${sorted.length} réservation${sorted.length > 1 ? "s" : ""}`,
          start: `${day}T00:00:00`,
          end: `${day}T23:59:59`,
          allDay: true,
          display: "block",
          className: ["booking-aggregate-event"],
          extendedProps: {
            kind: "aggregate",
            date: day,
            events: sorted,
          } satisfies CalendarEventMeta,
        });
      } else {
        sorted.forEach((booking) => {
          results.push(formatBookingEvent(booking));
        });
      }
    });

    return results;
  }, [activeViewType, events, formatBookingEvent]);

  return { calendarEvents };
}

