import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, CreditCard, History } from "lucide-react";
import type { ProcessedBooking } from "../handlers/booking-processor";
import type { InvoiceStats } from "../handlers/invoice-processor";

interface DashboardStatsCardsProps {
  activeBookings: ProcessedBooking[];
  upcomingBookings: ProcessedBooking[];
  pastBookings: ProcessedBooking[];
  invoiceStats: InvoiceStats;
}

export function DashboardStatsCards({
  activeBookings,
  upcomingBookings,
  pastBookings,
  invoiceStats,
}: DashboardStatsCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Réservations actives
          </CardTitle>
          <Clock className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{activeBookings.length}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            {activeBookings.length > 0
              ? "Profitez bien de votre location en cours."
              : "Aucune location en cours pour le moment."}
          </p>
        </CardContent>
      </Card>

      <Card className="border border-slate-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">À venir</CardTitle>
          <Calendar className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{upcomingBookings.length}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            {upcomingBookings.length > 0
              ? "Préparez-vous pour vos prochains trajets."
              : "Réservez votre prochain véhicule en quelques clics."}
          </p>
        </CardContent>
      </Card>

      <Card className="border border-slate-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Historique complété
          </CardTitle>
          <History className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{pastBookings.length}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            {pastBookings.length > 0
              ? "Replongez dans vos précédentes expériences."
              : "Pas encore de location terminée."}
          </p>
        </CardContent>
      </Card>

      <Card className="border border-slate-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Factures à payer</CardTitle>
          <CreditCard className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{invoiceStats.outstandingInvoices.length}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            {invoiceStats.outstandingInvoices.length > 0
              ? "Pensez à régler vos factures en attente."
              : "Aucune facture en attente de paiement."}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

