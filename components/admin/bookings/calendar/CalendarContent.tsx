"use client";

import { memo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import type { EventInput, EventContentArg, EventClickArg, DatesSetArg, MoreLinkArg } from "@fullcalendar/core";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import "@/app/calendar.css";

interface CalendarContentProps {
  events: EventInput[];
  isRefreshing: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
  onEventClick: (arg: EventClickArg) => void;
  onDatesSet: (arg: DatesSetArg) => void;
  onMoreLinkClick: (arg: MoreLinkArg) => string | undefined;
  renderEventContent: (eventInfo: EventContentArg) => JSX.Element;
}

export const CalendarContent = memo(function CalendarContent({
  events,
  isRefreshing,
  errorMessage,
  onRefresh,
  onEventClick,
  onDatesSet,
  onMoreLinkClick,
  renderEventContent,
}: CalendarContentProps) {
  return (
    <CardContent className="space-y-4">
      {errorMessage ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">{errorMessage}</span>
          <Button type="button" variant="ghost" size="sm" onClick={onRefresh}>
            Réessayer
          </Button>
        </div>
      ) : null}

      <div className="relative rounded-2xl border border-border/60 bg-white shadow-inner shadow-slate-100">
        {isRefreshing ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : null}

        <div className="fullcalendar-container rounded-2xl">
          <FullCalendar
            locales={[frLocale]}
            locale="fr"
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              start: "prev,next today",
              center: "title",
              end: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Aujourd'hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
            }}
            firstDay={1}
            eventDisplay="block"
            allDaySlot
            height="auto"
            selectable={false}
            events={events}
            eventContent={renderEventContent}
            eventClick={onEventClick}
            datesSet={onDatesSet}
            dayMaxEvents
            moreLinkClassNames="text-sm font-semibold text-primary"
            moreLinkContent={(args) => (
              <span>
                +{args.num} autre{args.num > 1 ? "s" : ""}
              </span>
            )}
            moreLinkClick={onMoreLinkClick}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            dayHeaderClassNames="bg-muted/40 text-muted-foreground font-semibold"
            dayCellClassNames="border border-transparent"
            nowIndicator
          />
        </div>
      </div>
    </CardContent>
  );
});

