import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bookingCurrencyFormatter } from "@/components/admin/bookings/booking-helpers";

interface RefundsStatsCardsProps {
  totalRefunded: number;
  stats: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
  };
}

export const RefundsStatsCards = memo(function RefundsStatsCards({
  totalRefunded,
  stats,
}: RefundsStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total remboursé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {bookingCurrencyFormatter.format(totalRefunded)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sur {stats.total} remboursement{stats.total > 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Complétés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
          <p className="text-xs text-muted-foreground mt-1">Remboursements réussis</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
          <p className="text-xs text-muted-foreground mt-1">En cours de traitement</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Échoués</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
          <p className="text-xs text-muted-foreground mt-1">Remboursements échoués</p>
        </CardContent>
      </Card>
    </div>
  );
});

