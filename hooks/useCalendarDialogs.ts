import { useState, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { EventClickArg, MoreLinkArg } from "@fullcalendar/core";
import type { BookingCalendarEvent } from "@/actions/admin/bookings";
import type { CalendarEventMeta } from "@/components/admin/bookings/calendar/types";

export function useCalendarDialogs() {
  const [selectedEvent, setSelectedEvent] = useState<BookingCalendarEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<BookingCalendarEvent[]>([]);
  const [selectedDayLabel, setSelectedDayLabel] = useState<string | null>(null);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const meta = arg.event.extendedProps as CalendarEventMeta | undefined;
    if (!meta) {
      return;
    }

    if (meta.kind === "aggregate") {
      setSelectedDayEvents(meta.events);
      setSelectedDayLabel(
        format(new Date(`${meta.date}T00:00:00`), "EEEE d MMMM yyyy", {
          locale: fr,
        }),
      );
      setIsDayDialogOpen(true);
      return;
    }

    setSelectedEvent(meta.booking);
    setIsEventDialogOpen(true);
  }, []);

  const handleMoreLinkClick = useCallback((arg: MoreLinkArg) => {
    const dayEvents = arg.allSegs
      .flatMap((seg: (typeof arg.allSegs)[number]) => {
        const meta = seg.event.extendedProps as CalendarEventMeta | undefined;
        if (!meta) {
          return [];
        }
        if (meta.kind === "aggregate") {
          return meta.events;
        }
        return [meta.booking];
      });

    if (dayEvents.length === 0) {
      return "none";
    }

    setSelectedDayEvents(dayEvents);
    setSelectedDayLabel(
      format(arg.date, "EEEE d MMMM yyyy", {
        locale: fr,
      }),
    );
    setIsDayDialogOpen(true);
    return "none";
  }, []);

  const handleEventSelect = useCallback((event: BookingCalendarEvent) => {
    setSelectedEvent(event);
    setIsDayDialogOpen(false);
    setIsEventDialogOpen(true);
  }, []);

  return {
    selectedEvent,
    isEventDialogOpen,
    setIsEventDialogOpen,
    isDayDialogOpen,
    setIsDayDialogOpen,
    selectedDayEvents,
    selectedDayLabel,
    handleEventClick,
    handleMoreLinkClick,
    handleEventSelect,
  };
}

