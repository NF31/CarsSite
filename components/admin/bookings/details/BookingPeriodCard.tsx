"use client";

import { memo } from "react";
import { CalendarRange, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { BookingDetail } from "@/actions/admin/bookings";

interface BookingPeriodCardProps {
  booking: BookingDetail;
  startDateLabel: string;
  endDateLabel: string;
  durationLabel: string;
  timelineMessage: {
    label: string;
    helper: string;
  };
}

export const BookingPeriodCard = memo(function BookingPeriodCard({
  booking,
  startDateLabel,
  endDateLabel,
  durationLabel,
  timelineMessage,
}: BookingPeriodCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarRange className="h-5 w-5 text-muted-foreground" />
          Période & itinéraire
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase text-muted-foreground">Début</p>
            <p className="text-sm font-semibold text-gray-900 break-words">{startDateLabel}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase text-muted-foreground">Fin</p>
            <p className="text-sm font-semibold text-gray-900 break-words">{endDateLabel}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase text-muted-foreground">Durée estimée</p>
            <p className="text-sm font-semibold text-gray-900 break-words">{durationLabel}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase text-muted-foreground">Statut temporel</p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="break-words">{timelineMessage.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{timelineMessage.helper}</p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase text-muted-foreground">Retrait</p>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-semibold text-gray-900 break-words">{booking.pickupLocation.name}</p>
                <p className="text-muted-foreground break-words">{booking.pickupLocation.city}</p>
                {booking.pickupLocation.address && (
                  <p className="text-xs text-muted-foreground break-words">{booking.pickupLocation.address}</p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase text-muted-foreground">Retour</p>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-semibold text-gray-900 break-words">{booking.returnLocation.name}</p>
                <p className="text-muted-foreground break-words">{booking.returnLocation.city}</p>
                {booking.returnLocation.address && (
                  <p className="text-xs text-muted-foreground break-words">{booking.returnLocation.address}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

