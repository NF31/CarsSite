"use client";

import { memo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { EventContentArg } from "@fullcalendar/core";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "./status-config";
import type { CalendarEventMeta } from "./types";
import type { BookingCalendarEvent } from "@/actions/admin/bookings";

interface EventContentProps {
  eventInfo: EventContentArg;
}

export const EventContent = memo(function EventContent({ eventInfo }: EventContentProps) {
  const meta = eventInfo.event.extendedProps as CalendarEventMeta | undefined;
  if (!meta) {
    return <div className="px-2 py-1 text-xs font-medium">{eventInfo.event.title}</div>;
  }

  if (meta.kind === "aggregate") {
    return (
      <div className="flex flex-col gap-1 px-2 py-1 text-xs font-semibold text-neutral-900">
        <span className="text-sm font-semibold">{eventInfo.event.title}</span>
        <span className="text-[11px] font-medium opacity-80">Cliquer pour voir le détail</span>
      </div>
    );
  }

  const booking = meta.booking;
  const statusMeta = STATUS_CONFIG[booking.status];
  const vehicleLabel = booking.vehicle.label;
  const timeText = eventInfo.timeText
    ? eventInfo.timeText
    : `${format(new Date(booking.start), "HH:mm", { locale: fr })} → ${format(
        new Date(booking.end),
        "HH:mm",
        { locale: fr },
      )}`;

  return (
    <div className="flex flex-col gap-1 px-2 py-1 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-white">
          {booking.reference}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-[1px] text-[10px] font-semibold tracking-wide uppercase",
            statusMeta.badgeClass,
          )}
        >
          {statusMeta.label}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 text-[11px] font-medium text-white">
        <span>{timeText}</span>
        <span className="truncate opacity-90">{vehicleLabel}</span>
      </div>
    </div>
  );
});

