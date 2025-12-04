"use client";

import { Badge } from "@/components/ui/badge";
import { BookingStatus } from "@/lib/types/booking-status";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  dateTimeFormatter,
} from "@/components/client/dashboard/dashboard-constants";
import { EditBookingDialog } from "@/components/client/dashboard/EditBookingDialog";
import { CancelBookingDialog } from "@/components/client/dashboard/CancelBookingDialog";
import { BookingDetailsDialog } from "./booking-details-dialog";
import { VehicleDetailsDialog } from "./vehicle-details-dialog";
import type { ProcessedBooking } from "../handlers/booking-processor";

type BookingCardProps = {
  booking: ProcessedBooking;
  servicesMap: Map<string, { id: string; name: string; price: number }>;
  cancellationPolicy: string;
  now: Date;
};

export function BookingCard({ booking, servicesMap, cancellationPolicy, now }: BookingCardProps) {
  const startDate = new Date(booking.startDateISO);
  const endDate = new Date(booking.endDateISO);
  const canEdit =
    startDate > now &&
    booking.derivedStatus !== BookingStatus.PENDING &&
    booking.derivedStatus !== BookingStatus.CANCELLED &&
    booking.derivedStatus !== BookingStatus.COMPLETED &&
    !booking.isCancellationPending;
  const canCancel =
    startDate > now &&
    !booking.isCancellationPending &&
    (booking.derivedStatus === BookingStatus.PENDING ||
      booking.derivedStatus === BookingStatus.CONFIRMED);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">
            {booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : booking.reference}
          </p>
          <Badge className={`${BOOKING_STATUS_COLORS[booking.derivedStatus]} text-[10px]`}>
            {BOOKING_STATUS_LABELS[booking.derivedStatus]}
          </Badge>
          {booking.isCancellationPending ? (
            <Badge variant="destructive" className="text-[10px]">
              Annulation demandée
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Départ le {dateTimeFormatter.format(startDate)} • Retour le {dateTimeFormatter.format(endDate)}
        </p>
        <p className="text-xs text-muted-foreground">
          Référence : <span className="font-medium text-gray-900">{booking.reference}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <BookingDetailsDialog booking={booking} servicesMap={servicesMap} />
        {booking.vehicle ? <VehicleDetailsDialog booking={booking} /> : null}
        {canEdit ? (
          <EditBookingDialog
            bookingId={booking.id}
            startDate={booking.startDateISO}
            endDate={booking.endDateISO}
            totalPrice={booking.totalPrice ?? 0}
            vehicleId={booking.vehicleId}
            serviceIds={booking.serviceIds}
            depositPaid={booking.depositPaid ?? 0}
          />
        ) : null}
        {canCancel ? (
          <CancelBookingDialog
            bookingId={booking.id}
            startDate={booking.startDateISO}
            depositPaid={booking.depositPaid ?? 0}
            cancellationPolicy={cancellationPolicy}
            cancellationState={{
              requested: booking.isCancellationPending,
              requestedAt: booking.cancellationRequestedAtISO,
              refundRate: booking.cancellationRequestedRefundRate,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

