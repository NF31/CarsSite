import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServicesSummary } from "@/actions/admin/services";

const summaryPriceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

interface ServicesStatsCardsProps {
  summary: ServicesSummary;
}

export const ServicesStatsCards = memo(function ServicesStatsCards({
  summary,
}: ServicesStatsCardsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Services actifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{summary.active}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.total > 0
              ? `${Math.round((summary.active / summary.total) * 100)}% du catalogue`
              : "Aucun service actif"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Services inactifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-amber-600">{summary.inactive}</div>
          <p className="text-xs text-muted-foreground mt-1">
            En attente de réactivation ou d&apos;archivage
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Prix moyen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {summary.averagePrice !== null
              ? summaryPriceFormatter.format(summary.averagePrice)
              : "—"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Calculé sur l&apos;ensemble des services actifs et inactifs
          </p>
        </CardContent>
      </Card>
    </section>
  );
});

