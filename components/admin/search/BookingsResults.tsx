import { memo } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Booking {
  id: string;
  reference: string;
  totalPrice: number;
  status: string;
  user: {
    name: string | null;
    email: string;
  };
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string;
  };
  startDate: Date;
}

const bookingStatusLabels: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

const bookingStatusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  CONFIRMED: "default",
  IN_PROGRESS: "secondary",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

interface BookingsResultsProps {
  bookings: Booking[];
}

export const BookingsResults = memo(function BookingsResults({
  bookings,
}: BookingsResultsProps) {
  if (bookings.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <CardTitle>Réservations ({bookings.length})</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/admin/bookings/${booking.id}`}
              className="block p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium">
                    #{booking.reference} - {booking.user.name || booking.user.email}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {booking.vehicle.brand} {booking.vehicle.model} •{" "}
                    {new Date(booking.startDate).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={bookingStatusVariants[booking.status] || "default"}>
                    {bookingStatusLabels[booking.status] || booking.status}
                  </Badge>
                  <div className="text-sm font-medium">
                    {booking.totalPrice.toFixed(2)} €
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

