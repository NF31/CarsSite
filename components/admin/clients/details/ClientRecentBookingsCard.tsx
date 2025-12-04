"use client";

import { memo } from "react";
import Link from "next/link";
import { Clock, MapPin, Car, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarRange } from "lucide-react";
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "@/components/admin/bookings/booking-helpers";
import { clientDateTimeFormatter } from "@/components/admin/clients/client-helpers";
import { formatRelativeBooking } from "./utils";
import type { ClientDetailBooking } from "@/actions/admin/clients";
import { BookingStatus } from "@/lib/types/booking-status";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

interface BookingWithStatus extends ClientDetailBooking {
  computedStatus: BookingStatus;
}

interface ClientRecentBookingsCardProps {
  bookings: BookingWithStatus[];
}

export const ClientRecentBookingsCard = memo(function ClientRecentBookingsCard({
  bookings,
}: ClientRecentBookingsCardProps) {
  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5" />
            Réservations récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-muted-foreground">
            Ce client n&apos;a pas encore effectué de réservation.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5" />
          Réservations récentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Créée le {clientDateTimeFormatter.format(new Date(booking.createdAt))}
                  </p>
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="text-base font-semibold text-primary hover:underline"
                  >
                    Réservation {booking.reference}
                  </Link>
                </div>
                <Badge className={`${BOOKING_STATUS_COLORS[booking.computedStatus]} w-fit`}>
                  {BOOKING_STATUS_LABELS[booking.computedStatus]}
                </Badge>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>
                    {clientDateTimeFormatter.format(new Date(booking.startDate))} →{" "}
                    {clientDateTimeFormatter.format(new Date(booking.endDate))}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{formatRelativeBooking(booking)}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {booking.vehicle ? (
                  <span className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    {booking.vehicle.brand} {booking.vehicle.model} • {booking.vehicle.licensePlate}
                  </span>
                ) : null}
                <span className="flex items-center gap-2 font-medium text-gray-900">
                  <Wallet className="h-4 w-4 text-primary" />
                  {currencyFormatter.format(booking.totalPrice)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

