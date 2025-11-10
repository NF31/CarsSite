"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import type {
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventInput,
  MoreLinkArg,
} from "@fullcalendar/core";
import { format, formatDistanceStrict } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarRange,
  BookingCalendarEvent,
  getCalendarEventsAction,
} from "@/actions/admin/bookings";
import { Calendar as CalendarIcon, Loader2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import "@/app/calendar.css";

export interface BookingsCalendarProps {
  initialRange: CalendarRange;
  initialEvents?: BookingCalendarEvent[];
}

type CalendarEventMeta =
  | { kind: "booking"; booking: BookingCalendarEvent }
  | { kind: "aggregate"; date: string; events: BookingCalendarEvent[] };

const STATUS_CONFIG: Record<
  BookingCalendarEvent["status"],
  {
    label: string;
    description: string;
    className: string;
    badgeClass: string;
    legendClass: string;
    headerClass: string;
    borderColor: string;
    backgroundColor: string;
    textColor: string;
  }
> = {
  PENDING: {
    label: "En attente",
    description: "Réservation en cours de validation",
    className: "status-pending",
    badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
    legendClass: "from-amber-50 via-amber-100 to-amber-200 border-amber-200 text-amber-900",
    headerClass: "bg-gradient-to-br from-amber-50 via-amber-100 to-white text-amber-900",
    borderColor: "#d97706",
    backgroundColor: "#f59e0b",
    textColor: "#ffffff",
  },
  CONFIRMED: {
    label: "Confirmée",
    description: "Réservation validée prêt à démarrer",
    className: "status-confirmed",
    badgeClass: "bg-blue-100 text-blue-800 border border-blue-200",
    legendClass: "from-blue-50 via-blue-100 to-blue-200 border-blue-200 text-blue-900",
    headerClass: "bg-gradient-to-br from-blue-50 via-blue-100 to-white text-blue-900",
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
    textColor: "#1d4ed8",
  },
  IN_PROGRESS: {
    label: "En cours",
    description: "Trajet actuellement en cours",
    className: "status-in-progress",
    badgeClass: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    legendClass: "from-indigo-50 via-indigo-100 to-indigo-200 border-indigo-200 text-indigo-900",
    headerClass: "bg-gradient-to-br from-indigo-50 via-indigo-100 to-white text-indigo-900",
    borderColor: "#1d4ed8",
    backgroundColor: "#3b82f6",
    textColor: "#ffffff",
  },
  COMPLETED: {
    label: "Terminée",
    description: "Trajet clôturé et facturé",
    className: "status-completed",
    badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    legendClass: "from-emerald-50 via-emerald-100 to-emerald-200 border-emerald-200 text-emerald-900",
    headerClass: "bg-gradient-to-br from-emerald-50 via-emerald-100 to-white text-emerald-900",
    borderColor: "#059669",
    backgroundColor: "#34d399",
    textColor: "#ffffff",
  },
  CANCELLED: {
    label: "Annulée",
    description: "Réservation annulée (client ou admin)",
    className: "status-cancelled",
    badgeClass: "bg-rose-100 text-rose-800 border border-rose-200",
    legendClass: "from-rose-50 via-rose-100 to-rose-200 border-rose-200 text-rose-900",
    headerClass: "bg-gradient-to-br from-rose-50 via-rose-100 to-white text-rose-900",
    borderColor: "#dc2626",
    backgroundColor: "#ef4444",
    textColor: "#ffffff",
  },
};

export function BookingsCalendar({ initialRange, initialEvents = [] }: BookingsCalendarProps) {
  const [events, setEvents] = useState<BookingCalendarEvent[]>(initialEvents);
  const [currentRange, setCurrentRange] = useState<CalendarRange>(initialRange);
  const [selectedEvent, setSelectedEvent] = useState<BookingCalendarEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<BookingCalendarEvent[]>([]);
  const [selectedDayLabel, setSelectedDayLabel] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastFetchedRangeRef = useRef<string | null>(null);
  const [activeViewType, setActiveViewType] = useState<string>("dayGridMonth");

  const updateRangeState = useCallback((nextRange: CalendarRange) => {
    setCurrentRange((prev: CalendarRange) => {
      if (prev.start === nextRange.start && prev.end === nextRange.end) {
        return prev;
      }
      return nextRange;
    });
  }, []);

  const makeRangeKey = useCallback((range: CalendarRange) => `${range.start}|${range.end}`, []);

  const calendarEvents = useMemo<EventInput[]>(() => {
    const formatBookingEvent = (booking: BookingCalendarEvent): EventInput => {
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
    };

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
  }, [activeViewType, events]);

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      const result = await getCalendarEventsAction(currentRange);
      if (result.success && result.data) {
        setEvents(result.data);
        setErrorMessage(null);
      } else {
        setErrorMessage(result.error ?? "Impossible de rafraîchir les réservations pour cette période. Réessayez plus tard.");
      }
    });
  }, [currentRange]);

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

      startTransition(async () => {
        const result = await getCalendarEventsAction(nextRange);
        if (result.success && result.data) {
          setEvents(result.data);
          setErrorMessage(null);
        } else {
          setErrorMessage(result.error ?? "Impossible de charger les réservations pour cette plage de dates.");
        }
      });
    },
    [makeRangeKey, updateRangeState],
  );

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

  const renderEventContent = useCallback((eventInfo: EventContentArg) => {
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
  }, []);

  const activeEventDialogMeta = selectedEvent ? STATUS_CONFIG[selectedEvent.status] : null;

  const legendOrder: BookingCalendarEvent["status"][] = [
    "CONFIRMED",
    "IN_PROGRESS",
    "PENDING",
    "COMPLETED",
    "CANCELLED",
  ];

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-6 border-b pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarIcon className="h-5 w-5" />
                </span>
                Calendrier des réservations
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-muted-foreground">
                Visualisez l&apos;occupation de la flotte et accédez aux détails clients depuis un événement.
              </CardDescription>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Rafraîchir
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {legendOrder.map((status) => {
              const meta = STATUS_CONFIG[status];
              return (
                <div
                  key={status}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-gradient-to-br p-3 shadow-sm",
                    meta.legendClass,
                  )}
                >
                  <span
                    className="h-3 w-3 rounded-full border border-white/70"
                    style={{ backgroundColor: meta.backgroundColor }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{meta.label}</span>
                    <span className="text-xs font-medium opacity-80">{meta.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMessage ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span className="font-medium">{errorMessage}</span>
              <Button type="button" variant="ghost" size="sm" onClick={handleRefresh}>
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
                events={calendarEvents}
                eventContent={renderEventContent}
                eventClick={handleEventClick}
                datesSet={handleDatesSet}
                dayMaxEvents
                moreLinkClassNames="text-sm font-semibold text-primary"
                moreLinkContent={(args) => (
                  <span>
                    +{args.num} autre{args.num > 1 ? "s" : ""}
                  </span>
                )}
                moreLinkClick={handleMoreLinkClick}
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
      </Card>

      <Dialog open={isEventDialogOpen && Boolean(selectedEvent)} onOpenChange={setIsEventDialogOpen}>
        <DialogContent
          className={cn(
            "max-w-3xl border-none bg-white/95 p-0 shadow-2xl outline-none transition-all",
            "data-[state=open]:animate-in data-[state=open]:fade-in-50 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-50 data-[state=closed]:zoom-out-95",
          )}
        >
          {selectedEvent ? (
            <div className="overflow-hidden rounded-xl bg-gradient-to-br from-white via-white to-muted/40">
              <div
                className={cn(
                  "px-6 py-5 transition-colors",
                  activeEventDialogMeta ? activeEventDialogMeta.headerClass : "bg-white",
                )}
              >
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold text-foreground">
                    {selectedEvent.reference}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {selectedEvent.vehicle.label} • {selectedEvent.vehicle.licensePlate}
                  </DialogDescription>
                </DialogHeader>
                {activeEventDialogMeta ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn("uppercase", activeEventDialogMeta.badgeClass)}
                    >
                      {activeEventDialogMeta.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Durée&nbsp;: {selectedEvent.durationDays} jour
                      {selectedEvent.durationDays > 1 ? "s" : ""}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-6 px-6 pb-6 pt-4 sm:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-border/60 bg-white/60 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Informations client
                  </h3>
                  <div className="space-y-1 text-sm leading-tight text-foreground">
                    <p className="font-medium">{selectedEvent.user.name}</p>
                    <p className="text-muted-foreground">{selectedEvent.user.email ?? "Email indisponible"}</p>
                    {selectedEvent.user.phone ? (
                      <p className="text-muted-foreground">{selectedEvent.user.phone}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border/60 bg-white/60 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Déroulé
                  </h3>
                  <div className="space-y-2 text-sm leading-tight text-foreground">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">Départ</p>
                      <p className="font-medium">
                        {format(new Date(selectedEvent.start), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {selectedEvent.pickupLocation.name} · {selectedEvent.pickupLocation.city}
                      </p>
                    </div>
                    <div className="border-t border-dashed border-border/60 pt-2">
                      <p className="text-muted-foreground text-xs uppercase">Retour</p>
                      <p className="font-medium">
                        {format(new Date(selectedEvent.end), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {selectedEvent.returnLocation.name} · {selectedEvent.returnLocation.city}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border/60 bg-white/60 p-4 shadow-sm sm:col-span-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Synthèse rapide
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      Trajet de{" "}
                      <strong>
                        {formatDistanceStrict(new Date(selectedEvent.start), new Date(selectedEvent.end), {
                          locale: fr,
                        })}
                      </strong>
                    </span>
                    <span>
                      Véhicule&nbsp;: <strong>{selectedEvent.vehicle.label}</strong> (
                      {selectedEvent.vehicle.licensePlate})
                    </span>
                    <span>
                      Client&nbsp;: <strong>{selectedEvent.user.name}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isDayDialogOpen && selectedDayEvents.length > 0} onOpenChange={setIsDayDialogOpen}>
        <DialogContent
          className={cn(
            "max-w-2xl border-none bg-white/95 p-0 shadow-2xl outline-none transition-all",
            "data-[state=open]:animate-in data-[state=open]:fade-in-50 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-50 data-[state=closed]:zoom-out-95",
          )}
        >
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-muted/50">
            <div className="px-6 py-5">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  {selectedDayLabel}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {selectedDayEvents.length} réservation
                  {selectedDayEvents.length > 1 ? "s" : ""} programmée{selectedDayEvents.length > 1 ? "s" : ""} ce jour-là.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-4 px-6 pb-6">
              {selectedDayEvents.map((booking) => {
                const meta = STATUS_CONFIG[booking.status];
                return (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => {
                      setSelectedEvent(booking);
                      setIsDayDialogOpen(false);
                      setIsEventDialogOpen(true);
                    }}
                    className={cn(
                      "group w-full transform-gpu rounded-xl border bg-gradient-to-br p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                      meta.legendClass,
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: meta.borderColor,
                          }}
                        />
                        <p className="text-sm font-semibold text-foreground">{booking.reference}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: meta.backgroundColor,
                          color: meta.textColor,
                          borderColor: meta.borderColor,
                        }}
                      >
                        {meta.label}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <span>
                        {format(new Date(booking.start), "HH:mm", { locale: fr })} →{" "}
                        {format(new Date(booking.end), "HH:mm", { locale: fr })}
                      </span>
                      <span>
                        {booking.vehicle.label} · {booking.vehicle.licensePlate}
                      </span>
                      <span>
                        {booking.user.name}
                        {booking.user.phone ? ` · ${booking.user.phone}` : ""}
                      </span>
                      <span>
                        Prise en charge&nbsp;: {booking.pickupLocation.city} • Retour&nbsp;:{" "}
                        {booking.returnLocation.city}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

