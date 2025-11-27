"use client";

import { memo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "./status-config";
import type { BookingCalendarEvent } from "@/actions/admin/bookings";

interface DayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayLabel: string | null;
  events: BookingCalendarEvent[];
  onEventSelect: (event: BookingCalendarEvent) => void;
}

export const DayDialog = memo(function DayDialog({
  open,
  onOpenChange,
  dayLabel,
  events,
  onEventSelect,
}: DayDialogProps) {
  if (events.length === 0) return null;

  return (
    <Dialog open={open && events.length > 0} onOpenChange={onOpenChange}>
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
                {dayLabel}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {events.length} réservation
                {events.length > 1 ? "s" : ""} programmée{events.length > 1 ? "s" : ""} ce jour-là.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-6 pb-6">
            {events.map((booking) => {
              const meta = STATUS_CONFIG[booking.status];
              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => {
                    onEventSelect(booking);
                    onOpenChange(false);
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
  );
});

