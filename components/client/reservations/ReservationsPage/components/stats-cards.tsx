import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, History } from "lucide-react";

type StatsCardsProps = {
  totalUpcoming: number;
  totalInProgress: number;
  totalPast: number;
};

export function StatsCards({ totalUpcoming, totalInProgress, totalPast }: StatsCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            À venir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold text-gray-900">{totalUpcoming}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Réservations confirmées à venir. Vous pouvez encore les modifier ou demander une annulation.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            En cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold text-gray-900">{totalInProgress}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Locations actuellement actives. Profitez de votre trajet et pensez à vérifier votre check-out.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Historique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold text-gray-900">{totalPast}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Locations terminées ou annulées. Consultez vos factures ou réservez à nouveau un véhicule.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

