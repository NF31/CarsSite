import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createDefaultAdminSettings } from "@/actions/admin/settings/shared";
import { getClientRecentBookingsAction } from "@/actions/client/bookings/get-recent";
import { RecentActivityCard } from "@/components/client/dashboard/RecentActivityCard";
import { RecentInvoicesCard } from "@/components/client/dashboard/RecentInvoicesCard";
import { ClientBreadcrumbs } from "@/components/client/Breadcrumbs";
import type { DashboardPageProps, DashboardBookingWithCancellation } from "./types";
import { RECENT_ACTIVITY_PAGE_SIZE } from "./types";
import { resolveSearchParams, parsePageParam } from "./utils/helpers";
import { loadDashboardData, loadServicesForBookings } from "./utils/data-loader";
import { createMissingInvoices } from "./handlers/invoice-creator";
import {
  processBookings,
  filterActiveBookings,
  filterUpcomingBookings,
  filterPastBookings,
} from "./handlers/booking-processor";
import { processInvoices } from "./handlers/invoice-processor";
import { DashboardStatsCards } from "./components/dashboard-stats-cards";
import { UpcomingBookingsSection } from "./components/upcoming-bookings-section";
import { FinancialSummaryCard } from "./components/financial-summary-card";
import { PersonalInfoCards } from "./components/personal-info-cards";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const resolvedSearchParams = await resolveSearchParams(searchParams);

  // Créer automatiquement les factures manquantes pour les réservations confirmées
  await createMissingInvoices(session.user.id);

  // Charger les données du dashboard
  const { bookings, invoices, cancellationPolicySetting } = await loadDashboardData(session.user.id);

  const defaultSettings = createDefaultAdminSettings();
  const cancellationPolicy =
    typeof cancellationPolicySetting?.value === "string"
      ? cancellationPolicySetting.value
      : defaultSettings.configuration.cancellationPolicy;

  // Charger les réservations récentes
  const initialRecentResult = await getClientRecentBookingsAction({
    page: parsePageParam(resolvedSearchParams.recentPage),
    limit: RECENT_ACTIVITY_PAGE_SIZE,
  });

  const initialRecentBookings =
    initialRecentResult.success && initialRecentResult.data
      ? initialRecentResult.data
      : {
          bookings: [],
          pagination: {
            total: 0,
            limit: RECENT_ACTIVITY_PAGE_SIZE,
            page: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        };

  const now = new Date();

  // Charger les services pour toutes les réservations
  const servicesMap = await loadServicesForBookings(bookings);

  // Traiter les réservations (dériver les statuts, etc.)
  const processedBookings = await processBookings(
    bookings as DashboardBookingWithCancellation[],
    now
  );

  // Filtrer les réservations
  const activeBookings = filterActiveBookings(processedBookings);
  const upcomingBookings = filterUpcomingBookings(processedBookings, now);
  const pastBookings = filterPastBookings(processedBookings, now);

  // Traiter les factures
  const invoiceStats = processInvoices(invoices);

  return (
    <div className="container space-y-8 py-8 px-4 sm:px-6">
      <ClientBreadcrumbs
        items={[{ label: "Tableau de bord", href: "/dashboard" }]}
        className="mb-4"
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Bienvenue, {session.user.name} 👋</h1>
        <p className="text-gray-600">
          Visualisez vos prochaines locations, retrouvez vos factures et suivez l&apos;historique de vos voyages.
        </p>
      </header>

      <DashboardStatsCards
        activeBookings={activeBookings}
        upcomingBookings={upcomingBookings}
        pastBookings={pastBookings}
        invoiceStats={invoiceStats}
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <UpcomingBookingsSection
          upcomingBookings={upcomingBookings}
          servicesMap={servicesMap}
          cancellationPolicy={cancellationPolicy}
          now={now}
        />

        <FinancialSummaryCard invoiceStats={invoiceStats} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Vos dernières réservations terminées ou en cours.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivityCard
              initialData={initialRecentBookings}
              cancellationPolicy={cancellationPolicy}
            />
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Mes factures récentes</CardTitle>
            <CardDescription>Retrouvez vos cinq dernières factures générées.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RecentInvoicesCard
              invoices={invoiceStats.recentInvoices.map((invoice) => ({
                ...invoice,
                invoiceNumber: invoice.invoiceNumber || "",
                issuedAt: invoice.issuedAt.toISOString(),
              }))}
            />
          </CardContent>
        </Card>
      </section>

      <PersonalInfoCards session={session} />
    </div>
  );
}
