import { Card, CardContent } from "@/components/ui/card";
import type { PriceCalculation } from "../types";

interface PriceSummaryCardProps {
  priceCalculation: PriceCalculation;
}

export function PriceSummaryCard({ priceCalculation }: PriceSummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h4 className="font-semibold mb-4">Récapitulatif</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Véhicule ({priceCalculation.numberOfDays.toFixed(2)} jour(s))</span>
            <span>{priceCalculation.vehiclePrice.toFixed(2)}€</span>
          </div>
          {priceCalculation.servicesPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span>Services</span>
              <span>{priceCalculation.servicesPrice.toFixed(2)}€</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total de la location</span>
              <span>{priceCalculation.totalPrice.toFixed(2)}€</span>
            </div>
            <div className="space-y-2 mt-3">
              <div className="flex justify-between text-sm">
                <span>Acompte (30%)</span>
                <span>{priceCalculation.deposit.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Solde à la remise</span>
                <span>{priceCalculation.remainingAmount.toFixed(2)}€</span>
              </div>
            </div>
            {priceCalculation.vehicleDeposit > 0 && (
              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between text-sm font-medium text-amber-600">
                  <span>Caution de garantie</span>
                  <span>{priceCalculation.vehicleDeposit.toFixed(2)}€</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ⓘ Cette caution sera bloquée lors de la confirmation et remboursée après restitution sans dégâts. Elle n&apos;est pas incluse dans le prix de la location.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

