import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Wallet2 } from "lucide-react";
import Link from "next/link";
import { currencyFormatter } from "@/components/client/dashboard/dashboard-constants";
import type { InvoiceStats } from "../handlers/invoice-processor";

interface FinancialSummaryCardProps {
  invoiceStats: InvoiceStats;
}

export function FinancialSummaryCard({ invoiceStats }: FinancialSummaryCardProps) {
  return (
    <Card className="border border-slate-100 shadow-sm">
      <CardHeader>
        <CardTitle>Résumé financier</CardTitle>
        <CardDescription>Statut de vos paiements et dépenses.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Montant total payé</span>
            <Wallet2 className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {currencyFormatter.format(invoiceStats.totalSpent)}
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Factures payées</span>
            <span className="font-semibold text-emerald-600">{invoiceStats.paidInvoices.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Factures en attente</span>
            <span className="font-semibold text-amber-600">{invoiceStats.outstandingInvoices.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Total de factures</span>
            <span className="font-medium text-gray-900">
              {invoiceStats.paidInvoices.length + invoiceStats.outstandingInvoices.length}
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/invoices" className="inline-flex items-center justify-center gap-2 text-sm">
            Voir mes factures
            <FileText className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

