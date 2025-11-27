import type { BookingCalendarEvent } from "@/actions/admin/bookings";

export type CalendarEventMeta =
  | { kind: "booking"; booking: BookingCalendarEvent }
  | { kind: "aggregate"; date: string; events: BookingCalendarEvent[] };

