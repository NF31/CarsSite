import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Euro, Shield } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

interface VehiclePricingProps {
  pricePerDay: number;
  pricePerWeek: number | null;
  pricePerMonth: number | null;
  deposit: number;
}

export const VehiclePricing = memo(function VehiclePricing({
  pricePerDay,
  pricePerWeek,
  pricePerMonth,
  deposit,
}: VehiclePricingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="h-5 w-5" />
          Tarification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Prix par jour</span>
            <span className="text-2xl font-bold text-primary">
              {currencyFormatter.format(pricePerDay)}
            </span>
          </div>
          {pricePerWeek && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Prix par semaine</span>
              <span className="text-lg font-semibold">
                {currencyFormatter.format(pricePerWeek)}
              </span>
            </div>
          )}
          {pricePerMonth && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Prix par mois</span>
              <span className="text-lg font-semibold">
                {currencyFormatter.format(pricePerMonth)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Caution
            </span>
            <span className="text-lg font-semibold">
              {currencyFormatter.format(deposit)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

