import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { UpcomingBookingsList } from "./upcoming-bookings-list";
import type { ProcessedBooking } from "../handlers/booking-processor";

interface UpcomingBookingsSectionProps {
  upcomingBookings: ProcessedBooking[];
  servicesMap: Map<string, { id: string; name: string; price: number }>;
  cancellationPolicy: string;
  now: Date;
}

export function UpcomingBookingsSection({
  upcomingBookings,
  servicesMap,
  cancellationPolicy,
  now,
}: UpcomingBookingsSectionProps) {
  return (
    <Card className="lg:col-span-2 border border-slate-100 shadow-sm">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Prochaines réservations</CardTitle>
          <CardDescription>
            Retrouvez vos locations confirmées. Nous vous enverrons un rappel par email avant chaque départ.
          </CardDescription>
        </div>
        <Button variant="outline" asChild className="text-xs sm:text-sm">
          <Link href="/reservations" className="inline-flex items-center gap-1">
            <span className="hidden sm:inline">Gérer mes réservations</span>
            <span className="sm:hidden">Gérer</span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <UpcomingBookingsList
          bookings={upcomingBookings}
          servicesMap={servicesMap}
          cancellationPolicy={cancellationPolicy}
          now={now}
        />
      </CardContent>
    </Card>
  );
}

