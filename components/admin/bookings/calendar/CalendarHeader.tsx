"use client";

import { memo } from "react";
import { Calendar as CalendarIcon, RefreshCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, LEGEND_ORDER } from "./status-config";
import type { BookingCalendarEvent } from "@/actions/admin/bookings";

interface CalendarHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const CalendarHeader = memo(function CalendarHeader({
  isRefreshing,
  onRefresh,
}: CalendarHeaderProps) {
  return (
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
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Rafraîchir
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {LEGEND_ORDER.map((status) => {
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
  );
});

