import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { PriceCalculation } from "../types";

interface PriceDetailsCardProps {
  priceCalculation: PriceCalculation | null;
  isCalculatingPrice: boolean;
}

export function PriceDetailsCard({ priceCalculation, isCalculatingPrice }: PriceDetailsCardProps) {
  if (!priceCalculation) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          {isCalculatingPrice ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          ) : (
            <p className="text-sm text-muted-foreground">
              Impossible de calculer le prix
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl">Détails du prix</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center text-sm sm:text-base py-1.5">
            <span className="text-muted-foreground">Véhicule ({priceCalculation.numberOfDays.toFixed(2)} jour{priceCalculation.numberOfDays > 1 ? "s" : ""})</span>
            <span className="font-semibold">{priceCalculation.vehiclePrice.toFixed(2)}€</span>
          </div>
          {priceCalculation.servicesPrice > 0 && (
            <>
              <div className="flex justify-between items-center text-sm sm:text-base py-1.5 border-t border-border/50 pt-3">
                <span className="text-muted-foreground">Services</span>
                <span className="font-semibold">{priceCalculation.servicesPrice.toFixed(2)}€</span>
              </div>
              <div className="pl-3 sm:pl-4 space-y-1.5 sm:space-y-2 bg-muted/30 rounded-md p-2 sm:p-3">
                {priceCalculation.breakdown.services.map((service) => (
                  <div key={service.id} className="flex justify-between items-center text-xs sm:text-sm text-muted-foreground">
                    <span>• {service.name}</span>
                    <span className="font-medium">{service.total.toFixed(2)}€</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="border-t-2 border-primary/20 pt-3 sm:pt-4 mt-3 sm:mt-4">
            <div className="flex justify-between items-center font-semibold text-base sm:text-lg mb-3 sm:mb-4">
              <span>Total de la location</span>
              <span className="text-primary">{priceCalculation.totalPrice.toFixed(2)}€</span>
            </div>
            <div className="space-y-2 sm:space-y-2.5 bg-muted/20 rounded-md p-3 sm:p-4">
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-muted-foreground">Acompte (30%)</span>
                <span className="font-semibold">{priceCalculation.deposit.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-muted-foreground">Solde à la remise</span>
                <span className="font-semibold">{priceCalculation.remainingAmount.toFixed(2)}€</span>
              </div>
            </div>
            {priceCalculation.vehicleDeposit > 0 && (
              <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-amber-200 bg-amber-50/50 rounded-md p-3 sm:p-4">
                <div className="flex justify-between items-center text-sm sm:text-base font-semibold text-amber-700 mb-2">
                  <span>Caution de garantie</span>
                  <span>{priceCalculation.vehicleDeposit.toFixed(2)}€</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-600 leading-relaxed">
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

