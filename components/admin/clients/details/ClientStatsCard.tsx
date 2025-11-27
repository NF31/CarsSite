"use client";

import { memo } from "react";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { clientDateFormatter } from "@/components/admin/clients/client-helpers";
import type { ClientDetail } from "@/actions/admin/clients";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

interface ClientStatsCardProps {
  stats: ClientDetail["stats"];
}

export const ClientStatsCard = memo(function ClientStatsCard({ stats }: ClientStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Statistiques
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Réservations totales</p>
            <span className="text-2xl font-bold text-gray-900">{stats.totalBookings}</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">En cours / à venir</p>
            <span className="text-lg font-semibold">{stats.upcomingBookings}</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Terminées</p>
            <span className="text-lg font-semibold">{stats.completedBookings}</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Annulées</p>
            <span className="text-lg font-semibold">{stats.cancelledBookings}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Montant dépensé</p>
            <span className="text-lg font-semibold text-primary">
              {currencyFormatter.format(stats.totalAmountSpent)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Panier moyen</p>
            <span className="text-lg font-semibold">
              {currencyFormatter.format(stats.averageAmountSpent)}
            </span>
          </div>
        </div>
        <Separator />
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Première réservation :{" "}
            {stats.firstBookingDate
              ? clientDateFormatter.format(new Date(stats.firstBookingDate))
              : "Non disponible"}
          </p>
          <p>
            Dernière réservation :{" "}
            {stats.lastBookingDate
              ? clientDateFormatter.format(new Date(stats.lastBookingDate))
              : "Non disponible"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

