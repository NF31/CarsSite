import { CalendarRange } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "../../booking-helpers";
import type { FormattedBookingRow } from "../types";
import { BookingActionsMenu } from "./BookingActionsMenu";
import { BookingPricingInfo } from "./BookingPricingInfo";
import { BookingUserInfo } from "./BookingUserInfo";
import { BookingVehicleInfo } from "./BookingVehicleInfo";
import { BookingLocationInfo } from "./BookingLocationInfo";

interface BookingCardProps {
  row: FormattedBookingRow;
}

export function BookingCard({ row }: BookingCardProps) {
  const { booking, index, canEdit } = row;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase">Réservation #{index}</p>
          <p className="text-lg font-semibold text-gray-900">{booking.reference}</p>
        </div>
        <Badge className={`${BOOKING_STATUS_COLORS[booking.status]} text-[11px] px-2 py-0.5`}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      </div>
      {!canEdit && (
        <Badge
          variant="outline"
          className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-200 w-fit"
        >
          Modification indisponible (dates passées)
        </Badge>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <CalendarRange className="h-4 w-4 text-muted-foreground" />
          <span>{booking.period}</span>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-700">
        <BookingUserInfo user={booking.user} variant="mobile" />
        <BookingVehicleInfo vehicle={booking.vehicle} variant="mobile" />
      </div>

      <BookingLocationInfo
        pickupLocation={booking.pickupLocation}
        returnLocation={booking.returnLocation}
        variant="mobile"
      />

      <BookingPricingInfo booking={booking} variant="mobile" />

      <div className="flex justify-end">
        <BookingActionsMenu booking={booking} canEdit={canEdit} variant="mobile" />
      </div>
    </div>
  );
}

