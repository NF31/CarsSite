import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientStats } from "@/actions/admin/clients";

interface ClientsStatsCardsProps {
  stats: ClientStats;
}

export const ClientsStatsCards = memo(function ClientsStatsCards({
  stats,
}: ClientsStatsCardsProps) {
  const activePercentage =
    stats.totalClients > 0
      ? Math.round((stats.activeClients / stats.totalClients) * 100)
      : 0;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Clients enregistrés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.totalClients}</div>
          <p className="mt-1 text-xs text-muted-foreground">Comptes cumulés</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Clients actifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-emerald-600">{stats.activeClients}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.totalClients > 0
              ? `${activePercentage}% du portefeuille`
              : "Pas encore d'activité"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Clients fidèles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-indigo-600">{stats.returningClients}</div>
          <p className="mt-1 text-xs text-muted-foreground">Au moins 2 réservations confirmées</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Nouveaux (30 derniers jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{stats.newClientsLast30Days}</div>
          <p className="mt-1 text-xs text-muted-foreground">Prospects convertis récemment</p>
        </CardContent>
      </Card>
    </section>
  );
});

