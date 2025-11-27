"use client";

import { memo } from "react";
import Link from "next/link";
import { CheckCircle2, CalendarRange, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { clientDateTimeFormatter } from "@/components/admin/clients/client-helpers";
import type { ClientDetail, ClientDetailBooking } from "@/actions/admin/clients";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

interface ClientRecentActivityCardProps {
  client: ClientDetail;
  lastBooking: ClientDetailBooking | null;
}

export const ClientRecentActivityCard = memo(function ClientRecentActivityCard({
  client,
  lastBooking,
}: ClientRecentActivityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Compte créé</p>
            <p>{clientDateTimeFormatter.format(new Date(client.createdAt))}</p>
          </div>
        </div>
        {client.stats.lastBookingDate && (
          <div className="flex items-start gap-3">
            <CalendarRange className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Dernière réservation</p>
              <p>{clientDateTimeFormatter.format(new Date(client.stats.lastBookingDate))}</p>
            </div>
          </div>
        )}
        {lastBooking && (
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Réservation en vedette</p>
              <p>
                <Link href={`/admin/bookings/${lastBooking.id}`} className="text-primary hover:underline">
                  {lastBooking.reference}
                </Link>{" "}
                • {currencyFormatter.format(lastBooking.totalPrice)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

