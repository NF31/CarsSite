import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface BookingsListProps {
  bookings: Array<{
    id: string;
    reference: string;
    status: string;
    startDate: Date | string;
    endDate: Date | string;
  }>;
}

export const BookingsList = memo(function BookingsList({ bookings }: BookingsListProps) {
  if (!bookings || bookings.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-4 border-t">
      <h3 className="font-semibold mb-3">Réservations actives</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="destructive" className="text-xs">
                {booking.reference}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {booking.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(booking.startDate), "dd/MM/yyyy")} - {format(new Date(booking.endDate), "dd/MM/yyyy")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});

