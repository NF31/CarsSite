import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { ClientRecentBooking } from "@/actions/client/bookings/get-recent";
import { CancelBookingDialog } from "../../CancelBookingDialog";
import { EditBookingDialog } from "../../EditBookingDialog";
import { BookingDetailsDialog } from "./BookingDetailsDialog/BookingDetailsDialog";
import { VehicleDetailsDialog } from "./VehicleDetailsDialog";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  dateFormatter,
} from "../../dashboard-constants";
import { canEditBooking, canCancelBooking } from "../utils";

interface BookingItemProps {
  booking: ClientRecentBooking;
  cancellationPolicy: string;
}

export function BookingItem({ booking, cancellationPolicy }: BookingItemProps) {
  const now = useMemo(() => new Date(), []);
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const canEdit = canEditBooking(booking, now);
  const canCancel = canCancelBooking(booking, now);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">
          {booking.vehicle
            ? `${booking.vehicle.brand} ${booking.vehicle.model}`
            : booking.reference}
        </p>
        <p className="text-xs text-muted-foreground">
          Départ le {dateFormatter.format(startDate)} • Retour le {dateFormatter.format(endDate)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={`${BOOKING_STATUS_COLORS[booking.derivedStatus]} text-[10px]`}>
          {BOOKING_STATUS_LABELS[booking.derivedStatus]}
        </Badge>
        {booking.isCancellationPending ? (
          <Badge variant="destructive" className="text-[10px]">
            Annulation demandée
          </Badge>
        ) : null}
        <BookingDetailsDialog booking={booking} />
        {booking.vehicle ? (
          <VehicleDetailsDialog booking={booking} startDate={startDate} endDate={endDate} />
        ) : null}
        {canEdit ? (
          <EditBookingDialog
            bookingId={booking.id}
            startDate={booking.startDate}
            endDate={booking.endDate}
            totalPrice={booking.totalPrice}
            vehicleId={booking.vehicleId}
            serviceIds={booking.serviceIds}
            depositPaid={booking.depositPaid ?? 0}
          />
        ) : null}
        {canCancel ? (
          <CancelBookingDialog
            bookingId={booking.id}
            startDate={booking.startDate}
            depositPaid={booking.depositPaid ?? 0}
            cancellationPolicy={cancellationPolicy}
          />
        ) : null}
      </div>
    </div>
  );
}

