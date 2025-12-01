import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EmptyState } from "./empty-state";
import { BookingCard } from "./booking-card";
import type { ProcessedBooking } from "../handlers/booking-processor";

type HistorySectionProps = {
  pastBookings: ProcessedBooking[];
  historyPageBookings: ProcessedBooking[];
  totalPast: number;
  historyPage: number;
  totalHistoryPages: number;
  historyRangeStart: number;
  historyRangeEnd: number;
  hasPreviousHistoryPage: boolean;
  hasNextHistoryPage: boolean;
  createHistoryPageHref: (page: number) => string;
  servicesMap: Map<string, { id: string; name: string; price: number }>;
  cancellationPolicy: string;
  now: Date;
};

export function HistorySection({
  pastBookings,
  historyPageBookings,
  totalPast,
  historyPage,
  totalHistoryPages,
  historyRangeStart,
  historyRangeEnd,
  hasPreviousHistoryPage,
  hasNextHistoryPage,
  createHistoryPageHref,
  servicesMap,
  cancellationPolicy,
  now,
}: HistorySectionProps) {
  return (
    <section>
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle>Historique des réservations</CardTitle>
          <CardDescription>
            Consultez vos locations terminées ou annulées, téléchargez vos factures et laissez un avis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pastBookings.length === 0 ? (
            <EmptyState
              title="Historique vide"
              description="Vos locations terminées s'afficheront ici. Nous espérons vous revoir bientôt !"
            />
          ) : (
            <>
              {historyPageBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  servicesMap={servicesMap}
                  cancellationPolicy={cancellationPolicy}
                  now={now}
                />
              ))}
              {totalHistoryPages > 1 ? (
                <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Affichage {historyRangeStart}–{historyRangeEnd} sur {totalPast} • Page {historyPage} sur{" "}
                    {totalHistoryPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild disabled={!hasPreviousHistoryPage}>
                      <Link
                        href={hasPreviousHistoryPage ? createHistoryPageHref(historyPage - 1) : "#"}
                        aria-disabled={!hasPreviousHistoryPage}
                      >
                        Précédent
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild disabled={!hasNextHistoryPage}>
                      <Link
                        href={hasNextHistoryPage ? createHistoryPageHref(historyPage + 1) : "#"}
                        aria-disabled={!hasNextHistoryPage}
                      >
                        Suivant
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

