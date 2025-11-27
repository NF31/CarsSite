"use client";

import { memo, useMemo } from "react";
import { CalendarRange } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { clientDateFormatter } from "@/components/admin/clients/client-helpers";
import type { ClientDetail } from "@/actions/admin/clients";

interface ClientActivityCardProps {
  client: ClientDetail;
  lastActivity: string;
  totalAmountFormatted: string;
  averageAmountFormatted: string;
}

export const ClientActivityCard = memo(function ClientActivityCard({
  client,
  lastActivity,
  totalAmountFormatted,
  averageAmountFormatted,
}: ClientActivityCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarRange className="h-5 w-5 text-primary" />
          Activité et réservations
        </CardTitle>
        <CardDescription>
          Suivi des performances et de la fidélité de ce client.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Réservations totales
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {client.stats.totalBookings}
            </p>
            <p className="text-xs text-muted-foreground">
              {client.stats.completedBookings} terminées
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Dernière réservation
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">{lastActivity}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Montant dépensé
            </p>
            <p className="mt-1 text-2xl font-bold text-primary">
              {totalAmountFormatted}
            </p>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            Première réservation&nbsp;:&nbsp;
            {client.stats.firstBookingDate
              ? clientDateFormatter.format(new Date(client.stats.firstBookingDate))
              : "Non disponible"}
          </span>
          <span className="text-gray-300">•</span>
          <span>
            Panier moyen&nbsp;:&nbsp;
            {averageAmountFormatted}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

