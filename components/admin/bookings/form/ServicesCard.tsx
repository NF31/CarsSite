"use client";

import { memo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ServicePricingType } from "@/lib/types/service-pricing-type";
import type { BookingFormValues } from "@/hooks/useBookingForm";
import type { BookingServiceOption } from "@/actions/admin/bookings";

interface ServicesCardProps {
  services: BookingServiceOption[];
  formatter: Intl.NumberFormat;
}

export const ServicesCard = memo(function ServicesCard({ services, formatter }: ServicesCardProps) {
  const form = useFormContext<BookingFormValues>();
  const watchServiceIdsValue = useWatch({ control: form.control, name: "serviceIds" });
  const watchServiceIds = watchServiceIdsValue ?? [];

  if (services.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Services additionnels</CardTitle>
          <CardDescription>Ajoutez des options tarifaires pour cette réservation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
            Aucun service additionnel n&apos;est disponible pour le moment.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services additionnels</CardTitle>
        <CardDescription>Ajoutez des options tarifaires pour cette réservation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => {
            const isSelected = watchServiceIds.includes(service.id);
            const isInactive = !service.active;
            const isDisabled = isInactive && !isSelected;

            return (
              <label
                key={service.id}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-lg border p-4 text-sm transition",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/40 hover:border-primary/40",
                  isInactive
                    ? "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300"
                    : "text-gray-900"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{service.name}</span>
                    <div className="text-xs text-muted-foreground">
                      {service.pricingType === ServicePricingType.FIXED && (
                        <span>+ {formatter.format(service.price)}</span>
                      )}
                      {service.pricingType === ServicePricingType.PER_DAY && (
                        <span>+ {formatter.format(service.price)} / jour</span>
                      )}
                      {service.pricingType === ServicePricingType.PERCENTAGE && (
                        <span>+ {service.price}% du montant du véhicule</span>
                      )}
                    </div>
                  </div>
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={(checked) => {
                      const current = new Set(watchServiceIds);
                      if (checked) {
                        current.add(service.id);
                      } else {
                        current.delete(service.id);
                      }
                      form.setValue("serviceIds", Array.from(current), { shouldDirty: true });
                    }}
                  />
                </div>
                {isInactive ? (
                  <p className="text-xs font-medium text-amber-700">
                    Service inactif (maintenu uniquement pour cette réservation).
                  </p>
                ) : null}
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

