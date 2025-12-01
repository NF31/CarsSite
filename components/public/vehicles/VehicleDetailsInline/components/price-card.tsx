"use client";

import { m } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import type { Vehicle, PriceCalculation } from "../types";

type PriceCardProps = {
  vehicle: Vehicle;
  priceCalculation: PriceCalculation;
};

export function PriceCard({ vehicle, priceCalculation }: PriceCardProps) {
  const { totalAmount, numberOfDays } = priceCalculation;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card>
        <CardContent className="p-6">
          {totalAmount !== null && numberOfDays !== null ? (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl font-black text-primary">
                  {totalAmount.toFixed(2)}€
                </span>
                <span className="text-sm text-muted-foreground">
                  pour{" "}
                  {numberOfDays % 1 === 0
                    ? numberOfDays.toFixed(0)
                    : numberOfDays.toFixed(2)}{" "}
                  jour{numberOfDays > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {vehicle.pricePerDay.toFixed(0)}€ par jour
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl font-black text-primary">
                  {vehicle.pricePerDay.toFixed(0)}€
                </span>
                <span className="text-sm text-muted-foreground">par jour</span>
              </div>
              {vehicle.pricePerWeek && (
                <p className="text-sm text-muted-foreground">
                  {vehicle.pricePerWeek.toFixed(0)}€ par semaine
                </p>
              )}
              {vehicle.pricePerMonth && (
                <p className="text-sm text-muted-foreground">
                  {vehicle.pricePerMonth.toFixed(0)}€ par mois
                </p>
              )}
            </div>
          )}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Caution : {vehicle.deposit.toFixed(0)}€</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
}

