"use client";

import { memo } from "react";
import { Euro } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { BookingFormValues } from "@/hooks/useBookingForm";

interface PricingInfo {
  durationDays: number;
  basePrice: number;
  servicesAmount: number;
  total: number;
  recommendedDeposit: number;
}

interface PricingCardProps {
  autoPricing: boolean;
  onAutoPricingChange: (checked: boolean) => void;
  pricingInfo: PricingInfo;
  remainingAmount: number;
  isPending: boolean;
  formatter: Intl.NumberFormat;
}

export const PricingCard = memo(function PricingCard({
  autoPricing,
  onAutoPricingChange,
  pricingInfo,
  remainingAmount,
  isPending,
  formatter,
}: PricingCardProps) {
  const form = useFormContext<BookingFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tarification & acompte</CardTitle>
        <CardDescription>
          Calcul automatique basé sur le véhicule sélectionné et la durée. Vous pouvez ajuster manuellement si besoin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Tarification automatique</p>
            <p className="text-xs text-muted-foreground">
              Désactivez pour modifier librement les montants.
            </p>
          </div>
          <Switch checked={autoPricing} onCheckedChange={onAutoPricingChange} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="totalPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Montant total</FormLabel>
                <div className="relative">
                  <Input type="number" step="0.01" min={0} disabled={isPending} {...field} />
                  <Euro className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="depositPaid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acompte perçu</FormLabel>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    disabled={autoPricing || isPending}
                    {...field}
                  />
                  <Euro className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="text-xs text-muted-foreground">Reste à payer</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatter.format(remainingAmount)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="text-xs text-muted-foreground">Durée estimée</p>
            <p className="text-lg font-semibold text-gray-900">
              {pricingInfo.durationDays > 0 ? `${pricingInfo.durationDays} jour(s)` : "—"}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="text-xs text-muted-foreground">Montant véhicule</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatter.format(pricingInfo.basePrice)}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="text-xs text-muted-foreground">Services additionnels</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatter.format(pricingInfo.servicesAmount)}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="text-xs text-muted-foreground">Acompte recommandé</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatter.format(pricingInfo.recommendedDeposit)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

