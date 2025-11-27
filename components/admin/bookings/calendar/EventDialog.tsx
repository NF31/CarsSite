"use client";

import { memo } from "react";
import { format, formatDistanceStrict } from "date-fns";
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

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: BookingCalendarEvent | null;
}

export const EventDialog = memo(function EventDialog({
  open,
  onOpenChange,
  event,
}: EventDialogProps) {
  if (!event) return null;

  const activeEventDialogMeta = STATUS_CONFIG[event.status];

  return (
    <Dialog open={open && Boolean(event)} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-3xl border-none bg-white/95 p-0 shadow-2xl outline-none transition-all",
          "data-[state=open]:animate-in data-[state=open]:fade-in-50 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-50 data-[state=closed]:zoom-out-95",
        )}
      >
        <div className="overflow-hidden rounded-xl bg-gradient-to-br from-white via-white to-muted/40">
          <div
            className={cn(
              "px-6 py-5 transition-colors",
              activeEventDialogMeta ? activeEventDialogMeta.headerClass : "bg-white",
            )}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-foreground">
                {event.reference}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {event.vehicle.label} • {event.vehicle.licensePlate}
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
                  Durée&nbsp;: {event.durationDays} jour
                  {event.durationDays > 1 ? "s" : ""}
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
                <p className="font-medium">{event.user.name}</p>
                <p className="text-muted-foreground">{event.user.email ?? "Email indisponible"}</p>
                {event.user.phone ? (
                  <p className="text-muted-foreground">{event.user.phone}</p>
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
                    {format(new Date(event.start), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {event.pickupLocation.name} · {event.pickupLocation.city}
                  </p>
                </div>
                <div className="border-t border-dashed border-border/60 pt-2">
                  <p className="text-muted-foreground text-xs uppercase">Retour</p>
                  <p className="font-medium">
                    {format(new Date(event.end), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {event.returnLocation.name} · {event.returnLocation.city}
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
                    {formatDistanceStrict(new Date(event.start), new Date(event.end), {
                      locale: fr,
                    })}
                  </strong>
                </span>
                <span>
                  Véhicule&nbsp;: <strong>{event.vehicle.label}</strong> (
                  {event.vehicle.licensePlate})
                </span>
                <span>
                  Client&nbsp;: <strong>{event.user.name}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

