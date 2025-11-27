"use client";

import { Card } from "@/components/ui/card";
import type { CalendarRange, BookingCalendarEvent } from "@/actions/admin/bookings";
import { useCalendarEvents, useCalendarEventTransformation } from "@/hooks/useCalendarEvents";
import { useCalendarRange } from "@/hooks/useCalendarRange";
import { useCalendarDialogs } from "@/hooks/useCalendarDialogs";
import {
  CalendarHeader,
  CalendarContent,
  EventContent,
  EventDialog,
  DayDialog,
} from "./calendar";
import type { EventContentArg } from "@fullcalendar/core";

export interface BookingsCalendarProps {
  initialRange: CalendarRange;
  initialEvents?: BookingCalendarEvent[];
}

export function BookingsCalendar({ initialRange, initialEvents = [] }: BookingsCalendarProps) {
  const calendarEvents = useCalendarEvents({
    initialEvents,
    initialRange,
  });

  const calendarRange = useCalendarRange({
    initialRange,
    onRangeChange: calendarEvents.refreshEvents,
  });

  const { calendarEvents: transformedEvents } = useCalendarEventTransformation(
    calendarEvents.events,
    calendarRange.activeViewType
  );

  const dialogs = useCalendarDialogs();

  const renderEventContent = (eventInfo: EventContentArg) => {
    return <EventContent eventInfo={eventInfo} />;
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <CalendarHeader
          isRefreshing={calendarEvents.isRefreshing}
          onRefresh={calendarEvents.handleRefresh}
        />

        <CalendarContent
          events={transformedEvents}
          isRefreshing={calendarEvents.isRefreshing}
          errorMessage={calendarEvents.errorMessage}
          onRefresh={calendarEvents.handleRefresh}
          onEventClick={dialogs.handleEventClick}
          onDatesSet={calendarRange.handleDatesSet}
          onMoreLinkClick={dialogs.handleMoreLinkClick}
          renderEventContent={renderEventContent}
        />
      </Card>

      <EventDialog
        open={dialogs.isEventDialogOpen}
        onOpenChange={dialogs.setIsEventDialogOpen}
        event={dialogs.selectedEvent}
      />

      <DayDialog
        open={dialogs.isDayDialogOpen}
        onOpenChange={dialogs.setIsDayDialogOpen}
        dayLabel={dialogs.selectedDayLabel}
        events={dialogs.selectedDayEvents}
        onEventSelect={dialogs.handleEventSelect}
      />
    </div>
  );
}
