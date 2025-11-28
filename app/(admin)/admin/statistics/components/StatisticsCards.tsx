import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { currencyFormatter, percentFormatter } from "../utils/formatters";

interface StatisticsCardsProps {
  totalRevenue: number;
  revenueLastMonth: number;
  revenueGrowth: number;
  totalBookings: number;
  bookingsLastMonth: number;
  bookingsGrowth: number;
  activeClients: number;
  averageBookingValue: number;
  occupancyRate: number;
  occupiedVehicles: number;
  totalVehicles: number;
  availabilityRate: number;
}

export const StatisticsCards = memo(function StatisticsCards({
  totalRevenue,
  revenueLastMonth,
  revenueGrowth,
  totalBookings,
  bookingsLastMonth,
  bookingsGrowth,
  activeClients,
  averageBookingValue,
  occupancyRate,
  occupiedVehicles,
  totalVehicles,
  availabilityRate,
}: StatisticsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Revenus (12 derniers mois)</CardDescription>
          <CardTitle className="text-2xl">{currencyFormatter.format(totalRevenue)}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {revenueLastMonth > 0 ? (
            <span>
              {currencyFormatter.format(revenueLastMonth)} sur le dernier mois (
              {revenueGrowth >= 0 ? "+" : ""}
              {revenueGrowth.toFixed(1)}%)
            </span>
          ) : (
            <span>Aucun revenu enregistré le mois dernier.</span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Réservations (12 derniers mois)</CardDescription>
          <CardTitle className="text-2xl">{totalBookings.toLocaleString("fr-FR")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {bookingsLastMonth > 0 ? (
            <span>
              {bookingsLastMonth.toLocaleString("fr-FR")} le mois dernier (
              {bookingsGrowth >= 0 ? "+" : ""}
              {bookingsGrowth.toFixed(1)}%)
            </span>
          ) : (
            <span>Aucune réservation le mois dernier.</span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Clients actifs</CardDescription>
          <CardTitle className="text-2xl">{activeClients.toLocaleString("fr-FR")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Valeur moyenne d&apos;une réservation :{" "}
          {currencyFormatter.format(averageBookingValue || 0)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Taux d&apos;occupation</CardDescription>
          <CardTitle className="text-2xl">{percentFormatter.format(occupancyRate / 100)}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {occupiedVehicles.toLocaleString("fr-FR")} véhicules occupés /{" "}
          {totalVehicles.toLocaleString("fr-FR")} au total. Disponibilité :{" "}
          {percentFormatter.format(availabilityRate / 100)}
        </CardContent>
      </Card>
    </div>
  );
});

