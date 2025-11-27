"use client";

import { memo } from "react";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { bookingCurrencyFormatter } from "@/components/admin/bookings/booking-helpers";
import { ServicePricingType } from "@prisma/client";
import type { BookingDetail } from "@/actions/admin/bookings";

const pricingTypeLabels: Record<ServicePricingType, string> = {
  FIXED: "Montant fixe",
  PER_DAY: "Par jour",
  PERCENTAGE: "Pourcentage",
};

interface BookingServicesCardProps {
  booking: BookingDetail;
}

export const BookingServicesCard = memo(function BookingServicesCard({ booking }: BookingServicesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          Services additionnels
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {booking.services.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-muted-foreground">
            Aucun service additionnel n&apos;est lié à cette réservation.
          </div>
        ) : (
          <div className="space-y-3">
            {booking.services.map((service) => (
              <div key={service.id} className="flex flex-col gap-2 rounded-md border bg-white/50 p-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">{service.name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[11px]">
                      {pricingTypeLabels[service.pricingType]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px]",
                        service.active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      )}
                    >
                      {service.active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tarification appliquée :{" "}
                  <span className="font-medium text-gray-900">
                    {service.pricingType === ServicePricingType.PERCENTAGE
                      ? `${service.price}%`
                      : bookingCurrencyFormatter.format(service.price)}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

