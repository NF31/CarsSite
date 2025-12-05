import { Badge } from "@/components/ui/badge";
import { BookingStatus } from "@/lib/types/booking-status";
import { EditBookingDialog } from "@/components/client/dashboard/EditBookingDialog";
import { CancelBookingDialog } from "@/components/client/dashboard/CancelBookingDialog";
import { BookingInvoiceDownload } from "@/components/client/dashboard/BookingInvoiceDownload";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  dateTimeFormatter,
} from "@/components/client/dashboard/dashboard-constants";
import type { ProcessedBooking } from "../handlers/booking-processor";
import { BookingDetailsDialog } from "./booking-details-dialog";
import { VehicleDetailsDialog } from "./vehicle-details-dialog";

interface UpcomingBookingsListProps {
  bookings: ProcessedBooking[];
  servicesMap: Map<string, { id: string; name: string; price: number }>;
  cancellationPolicy: string;
  now: Date;
}

export function UpcomingBookingsList({
  bookings,
  servicesMap,
  cancellationPolicy,
  now,
}: UpcomingBookingsListProps) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-muted-foreground">
        Aucune réservation à venir. Réservez un véhicule pour votre prochaine escapade.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                {booking.vehicle
                  ? `${booking.vehicle.brand} ${booking.vehicle.model}`
                  : booking.reference}
              </h2>
              <Badge className={`${BOOKING_STATUS_COLORS[booking.derivedStatus]} text-[10px]`}>
                {BOOKING_STATUS_LABELS[booking.derivedStatus]}
              </Badge>
              {booking.isCancellationPending ? (
                <Badge variant="destructive" className="text-[10px]">
                  Annulation demandée
                </Badge>
              ) : null}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Départ le {dateTimeFormatter.format(new Date(booking.startDate))}
            </p>
            <p className="text-xs text-muted-foreground">Référence : {booking.reference}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BookingInvoiceDownload invoice={booking.invoices[0] || null} />
            <BookingDetailsDialog booking={booking} servicesMap={servicesMap} />
            {booking.vehicle ? <VehicleDetailsDialog booking={booking} /> : null}
            {booking.startDate > now && booking.derivedStatus !== BookingStatus.PENDING ? (
              <EditBookingDialog
                bookingId={booking.id}
                startDate={booking.startDate.toISOString()}
                endDate={booking.endDate.toISOString()}
                totalPrice={booking.totalPrice ?? 0}
                vehicleId={booking.vehicleId}
                serviceIds={booking.serviceIds}
                depositPaid={booking.depositPaid ?? 0}
              />
            ) : null}
            {booking.startDate > now &&
            !booking.isCancellationPending &&
            (booking.derivedStatus === BookingStatus.PENDING ||
              booking.derivedStatus === BookingStatus.CONFIRMED) ? (
              <CancelBookingDialog
                bookingId={booking.id}
                startDate={booking.startDate.toISOString()}
                depositPaid={booking.depositPaid ?? 0}
                cancellationPolicy={cancellationPolicy}
              />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

