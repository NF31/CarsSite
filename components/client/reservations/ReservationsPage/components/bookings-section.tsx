import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "./empty-state";
import { BookingCard } from "./booking-card";
import type { ProcessedBooking } from "../handlers/booking-processor";

type BookingsSectionProps = {
  title: string;
  description: string;
  bookings: ProcessedBooking[];
  emptyTitle: string;
  emptyDescription: string;
  servicesMap: Map<string, { id: string; name: string; price: number }>;
  cancellationPolicy: string;
  now: Date;
};

export function BookingsSection({
  title,
  description,
  bookings,
  emptyTitle,
  emptyDescription,
  servicesMap,
  cancellationPolicy,
  now,
}: BookingsSectionProps) {
  return (
    <Card className="border border-slate-100 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              servicesMap={servicesMap}
              cancellationPolicy={cancellationPolicy}
              now={now}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

