"use client";

import { cn } from "@/lib/utils";
import type { PriceCalculation } from "../types";

type PriceComparisonCardProps = {
  priceCalculation: PriceCalculation;
  currentTotalPrice: number;
  depositPaid: number;
  securityDepositPaid: number;
  isCalculatingPrice: boolean;
};

export function PriceComparisonCard({
  priceCalculation,
  currentTotalPrice,
  depositPaid,
  securityDepositPaid,
  isCalculatingPrice,
}: PriceComparisonCardProps) {
  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
      {/* Section principale : Différence de prix total */}
      {(() => {
        const priceDifference = priceCalculation.totalPrice - currentTotalPrice;
        const roundedPriceDifference = Math.round(priceDifference * 100) / 100;

        if (roundedPriceDifference !== 0) {
          return (
            <div
              className={cn(
                "rounded-lg border-2 p-4 space-y-2",
                roundedPriceDifference > 0 ? "border-amber-300 bg-amber-50" : "border-green-300 bg-green-50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  {roundedPriceDifference > 0 ? "📈 Augmentation" : "📉 Réduction"} du prix total :
                </span>
                <span
                  className={cn(
                    "text-lg font-bold",
                    roundedPriceDifference > 0 ? "text-amber-700" : "text-green-700"
                  )}
                >
                  {roundedPriceDifference > 0 ? "+" : ""}
                  {currencyFormatter.format(roundedPriceDifference)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Prix actuel</p>
                  <p className="text-sm font-semibold text-gray-900">{currencyFormatter.format(currentTotalPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Nouveau prix</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {isCalculatingPrice ? (
                      <span className="text-muted-foreground">Calcul...</span>
                    ) : (
                      currencyFormatter.format(priceCalculation.totalPrice)
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Prix actuel :</span>
        <span className="text-sm font-semibold text-gray-900">{currencyFormatter.format(currentTotalPrice)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Nouveau prix :</span>
        <span className="text-sm font-semibold text-blue-900">
          {isCalculatingPrice ? (
            <span className="text-muted-foreground">Calcul en cours...</span>
          ) : (
            currencyFormatter.format(priceCalculation.totalPrice)
          )}
        </span>
      </div>
      {!isCalculatingPrice && (
        <>
          <div className="border-t border-blue-200 pt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Acompte actuel (30%) :</span>
              <span className="text-sm font-semibold text-gray-900">{currencyFormatter.format(depositPaid)}</span>
            </div>
            {securityDepositPaid > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Caution déjà payée :</span>
                <span className="text-sm font-semibold text-green-600">
                  {currencyFormatter.format(securityDepositPaid)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Nouvel acompte (30%) :</span>
              <span className="text-sm font-semibold text-blue-900">
                {currencyFormatter.format(priceCalculation.newDownPayment)}
              </span>
            </div>
            {priceCalculation.depositDifference !== 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-gray-700">Différence d&apos;acompte :</span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    priceCalculation.depositDifference > 0 ? "text-red-600" : "text-green-600"
                  )}
                >
                  {priceCalculation.depositDifference > 0 ? "+" : ""}
                  {currencyFormatter.format(priceCalculation.depositDifference)}
                </span>
              </div>
            )}
          </div>
          {priceCalculation.depositDifference < 0 && (
            <div className="rounded-md bg-green-50 p-3 border border-green-200">
              <p className="text-xs text-green-700 font-medium mb-1">💰 Remboursement prévu</p>
              <p className="text-xs text-green-600">
                Un remboursement de {Math.abs(priceCalculation.depositDifference).toFixed(2)}€ sera effectué sous
                5-10 jours ouvrés.
              </p>
            </div>
          )}
          {priceCalculation.depositDifference > 0 && (
            <div className="rounded-md bg-amber-50 p-4 border-2 border-amber-300">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg">💳</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900 mb-1">Paiement supplémentaire requis</p>
                  <p className="text-sm text-amber-800 font-medium mb-2">
                    Vous avez déjà payé {currencyFormatter.format(depositPaid)} d&apos;acompte.
                  </p>
                  <div className="bg-white rounded-md p-3 border border-amber-200">
                    <p className="text-xs text-amber-900 font-semibold mb-1">
                      ✅ Vous devrez payer uniquement la différence :
                    </p>
                    <p className="text-lg font-bold text-amber-700 text-center">
                      {currencyFormatter.format(priceCalculation.depositDifference)}
                    </p>
                  </div>
                  {securityDepositPaid > 0 && (
                    <p className="text-xs text-amber-700 font-medium mt-2">
                      ℹ️ La caution de garantie ({currencyFormatter.format(securityDepositPaid)}) a déjà été payée et
                      ne sera pas redemandée.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="border-t border-blue-200 pt-2 space-y-3">
            {/* Ancien solde */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Ancien solde à payer :</span>
              <span className="text-sm text-gray-700">
                {currencyFormatter.format(currentTotalPrice - depositPaid)}
              </span>
            </div>

            {/* Nouveau solde */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Nouveau solde à payer :</span>
              <span className="font-semibold text-blue-900">
                {currencyFormatter.format(priceCalculation.remainingAmount)}
              </span>
            </div>

            {/* Différence de solde */}
            {(() => {
              const oldRemainingAmount = currentTotalPrice - depositPaid;
              const newRemainingAmount = priceCalculation.remainingAmount;
              const remainingDifference = newRemainingAmount - oldRemainingAmount;
              const roundedDifference = Math.round(remainingDifference * 100) / 100;

              if (roundedDifference !== 0) {
                return (
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Différence de solde :</span>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        roundedDifference > 0 ? "text-red-600" : "text-green-600"
                      )}
                    >
                      {roundedDifference > 0 ? "+" : ""}
                      {currencyFormatter.format(roundedDifference)}
                    </span>
                  </div>
                );
              }
              return null;
            })()}

            {/* Explication */}
            {(() => {
              const oldRemainingAmount = currentTotalPrice - depositPaid;
              const newRemainingAmount = priceCalculation.remainingAmount;
              const remainingDifference = newRemainingAmount - oldRemainingAmount;
              const roundedDifference = Math.round(remainingDifference * 100) / 100;

              if (roundedDifference > 0) {
                return (
                  <div className="rounded-md bg-amber-50 p-3 border border-amber-200">
                    <p className="text-xs text-amber-700 font-medium mb-1">⚠️ Solde à payer augmenté</p>
                    <p className="text-xs text-amber-600">
                      Vous devrez payer {Math.abs(roundedDifference).toFixed(2)}€ de plus à la remise du véhicule
                      qu&apos;initialement prévu.
                    </p>
                  </div>
                );
              } else if (roundedDifference < 0) {
                return (
                  <div className="rounded-md bg-green-50 p-3 border border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-1">✅ Solde à payer réduit</p>
                    <p className="text-xs text-green-600">
                      Vous paierez {Math.abs(roundedDifference).toFixed(2)}€ de moins à la remise du véhicule
                      qu&apos;initialement prévu.
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
          {priceCalculation.totalPrice === currentTotalPrice && priceCalculation.depositDifference === 0 && (
            <div className="rounded-md bg-green-50 p-2 border border-green-200">
              <p className="text-xs text-green-700 text-center font-medium">
                Le prix et l&apos;acompte restent identiques
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

