import { Euro, Check } from "lucide-react";
import { bookingCurrencyFormatter } from "../../booking-helpers";
import type { BookingListItem } from "../types";

interface BookingPricingInfoProps {
  booking: BookingListItem;
  variant?: "mobile" | "desktop";
}

export function BookingPricingInfo({ booking, variant = "mobile" }: BookingPricingInfoProps) {
  if (variant === "desktop") {
    return (
      <div className="align-top">
        <div className="font-semibold text-primary">
          {bookingCurrencyFormatter.format(booking.totalPrice)}
        </div>
        <div className="text-xs text-muted-foreground">
          Acompte {bookingCurrencyFormatter.format(booking.depositPaid)}
        </div>
        {booking.securityDepositPaid && booking.securityDepositPaid > 0 && (
          <div className="text-xs font-medium text-green-600">
            Caution payée {bookingCurrencyFormatter.format(booking.securityDepositPaid)}
          </div>
        )}
        <div
          className={`text-xs font-medium ${
            booking.remainingAmount > 0 ? "text-amber-600" : "text-emerald-600"
          }`}
        >
          Solde {bookingCurrencyFormatter.format(booking.remainingAmount)}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-md px-3 py-2 text-sm bg-gray-50">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700 flex items-center gap-2">
          <Euro className="h-4 w-4 text-muted-foreground" />
          Total
        </span>
        <span className="font-semibold text-primary">
          {bookingCurrencyFormatter.format(booking.totalPrice)}
        </span>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
        <span className="flex items-center gap-1">
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          Acompte {bookingCurrencyFormatter.format(booking.depositPaid)}
        </span>
        <span>
          Solde{" "}
          <span
            className={`font-medium ${
              booking.remainingAmount > 0 ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            {bookingCurrencyFormatter.format(booking.remainingAmount)}
          </span>
        </span>
      </div>
      {booking.securityDepositPaid && booking.securityDepositPaid > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-200">
          <div className="flex items-center gap-1 text-xs">
            <Check className="h-3.5 w-3.5 text-green-500" />
            <span className="text-muted-foreground">Caution payée:</span>
            <span className="font-medium text-green-600">
              {bookingCurrencyFormatter.format(booking.securityDepositPaid)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

