import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createDefaultAdminSettings } from "@/actions/admin/settings/shared";
import { ClientBreadcrumbs } from "@/components/client/Breadcrumbs";
import type { ReservationsPageProps } from "./types";
import { HISTORY_PAGE_SIZE } from "./types";
import { resolveSearchParams, parsePageParam, createHistoryPageHref } from "./utils/helpers";
import { loadReservationsData, loadServicesForReservations } from "./utils/data-loader";
import {
  processBookings,
  filterUpcomingBookings,
  filterInProgressBookings,
  filterPastBookings,
} from "./handlers/booking-processor";
import { StatsCards } from "./components/stats-cards";
import { BookingsSection } from "./components/bookings-section";
import { HistorySection } from "./components/history-section";
import { NoReservationsCard } from "./components/no-reservations-card";

export async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Charger les données
  const { bookings, cancellationPolicySetting } = await loadReservationsData(userId);

  const defaultSettings = createDefaultAdminSettings();
  const cancellationPolicy =
    typeof cancellationPolicySetting?.value === "string"
      ? cancellationPolicySetting.value
      : defaultSettings.configuration.cancellationPolicy;

  const now = new Date();

  // Charger les services
  const servicesMap = await loadServicesForReservations(bookings);

  // Traiter les réservations
  const derivedBookings = processBookings(bookings, now);

  // Filtrer les réservations
  const upcomingBookings = filterUpcomingBookings(derivedBookings, now);
  const inProgressBookings = filterInProgressBookings(derivedBookings);
  const pastBookings = filterPastBookings(derivedBookings);

  const totalUpcoming = upcomingBookings.length;
  const totalInProgress = inProgressBookings.length;
  const totalPast = pastBookings.length;
  const totalBookings = derivedBookings.length;

  // Gérer la pagination de l'historique
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const historyPageParam = resolvedSearchParams.historyPage;
  const requestedHistoryPage = parsePageParam(historyPageParam);
  const totalHistoryPages = Math.max(1, Math.ceil(totalPast / HISTORY_PAGE_SIZE));
  const historyPage = Math.min(requestedHistoryPage, totalHistoryPages);
  const historyStartIndex = (historyPage - 1) * HISTORY_PAGE_SIZE;
  const historyPageBookings = pastBookings.slice(historyStartIndex, historyStartIndex + HISTORY_PAGE_SIZE);
  const historyRangeStart = totalPast === 0 ? 0 : historyStartIndex + 1;
  const historyRangeEnd = totalPast === 0 ? 0 : Math.min(historyStartIndex + HISTORY_PAGE_SIZE, totalPast);
  const hasPreviousHistoryPage = historyPage > 1;
  const hasNextHistoryPage = historyPage < totalHistoryPages;

  return (
    <div className="container space-y-8 py-8 px-4 sm:px-6">
      <ClientBreadcrumbs
        items={[
          { label: "Tableau de bord", href: "/dashboard" },
          { label: "Mes réservations" },
        ]}
        className="mb-4"
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Mes réservations</h1>
        <p className="text-gray-600">
          Retrouvez vos locations passées, en cours et à venir. Gérez vos demandes de modification ou
          d&apos;annulation en quelques clics.
        </p>
      </header>

      {totalBookings === 0 ? (
        <NoReservationsCard />
      ) : (
        <>
          <StatsCards
            totalUpcoming={totalUpcoming}
            totalInProgress={totalInProgress}
            totalPast={totalPast}
          />

          <section className="grid gap-6 lg:grid-cols-2">
            <BookingsSection
              title="Réservations à venir"
              description="Vos prochaines locations confirmées. Modifiez vos dates ou annulez conformément à notre politique."
              bookings={upcomingBookings}
              emptyTitle="Aucune réservation à venir"
              emptyDescription="Planifiez votre prochaine escapade en choisissant un véhicule adapté à vos besoins."
              servicesMap={servicesMap}
              cancellationPolicy={cancellationPolicy}
              now={now}
            />

            <BookingsSection
              title="Réservations en cours"
              description="Locations actuellement actives. Contactez-nous en cas de besoin ou prolongez votre séjour."
              bookings={inProgressBookings}
              emptyTitle="Aucune réservation en cours"
              emptyDescription="Vos locations actives apparaîtront ici dès le début de votre parcours."
              servicesMap={servicesMap}
              cancellationPolicy={cancellationPolicy}
              now={now}
            />
          </section>

          <HistorySection
            pastBookings={pastBookings}
            historyPageBookings={historyPageBookings}
            totalPast={totalPast}
            historyPage={historyPage}
            totalHistoryPages={totalHistoryPages}
            historyRangeStart={historyRangeStart}
            historyRangeEnd={historyRangeEnd}
            hasPreviousHistoryPage={hasPreviousHistoryPage}
            hasNextHistoryPage={hasNextHistoryPage}
            createHistoryPageHref={(page) => createHistoryPageHref(page, resolvedSearchParams)}
            servicesMap={servicesMap}
            cancellationPolicy={cancellationPolicy}
            now={now}
          />
        </>
      )}
    </div>
  );
}

