import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvoiceListItem, InvoicesSummary } from "@/actions/admin/invoices/get-invoices";
import { formatCurrency } from "../invoice-helpers";

interface InvoicesStatsCardsProps {
  summary: InvoicesSummary;
  invoices: InvoiceListItem[];
}

export const InvoicesStatsCards = memo(function InvoicesStatsCards({
  summary,
  invoices,
}: InvoicesStatsCardsProps) {
  const pendingSentInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "SENT").length,
    [invoices]
  );

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Factures totales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{summary.totalInvoices}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCurrency(summary.totalAmount)} facturés
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            En attente de paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-amber-600">
            {formatCurrency(summary.outstandingAmount)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {pendingSentInvoices} factures à échéance
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Factures payées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-emerald-600">{summary.paidCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.sentCount} factures envoyées
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">En retard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">{summary.overdueCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.draftCount} brouillons à finaliser
          </p>
        </CardContent>
      </Card>
    </section>
  );
});

