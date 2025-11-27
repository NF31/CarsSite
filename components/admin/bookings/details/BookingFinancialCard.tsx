"use client";

import { memo } from "react";
import { Euro, Shield, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bookingCurrencyFormatter } from "@/components/admin/bookings/booking-helpers";
import type { BookingDetail } from "@/actions/admin/bookings";

interface BookingFinancialCardProps {
  booking: BookingDetail;
}

export const BookingFinancialCard = memo(function BookingFinancialCard({
  booking,
}: BookingFinancialCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Euro className="h-5 w-5 text-muted-foreground" />
          Montants & paiements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Montant total</p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {bookingCurrencyFormatter.format(booking.totalPrice)}
          </p>
        </div>
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4" />
              Acompte payé
            </span>
            <span className="font-semibold text-gray-900">
              {bookingCurrencyFormatter.format(booking.depositPaid)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Reste à payer
            </span>
            <span className="font-semibold text-gray-900">
              {bookingCurrencyFormatter.format(booking.remainingAmount)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

