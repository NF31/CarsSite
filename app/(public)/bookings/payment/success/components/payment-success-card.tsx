import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { BookingData, ModificationMetadata, PaymentAmounts, PaymentType } from "../types";

interface PaymentSuccessCardProps {
  booking: BookingData;
  amounts: PaymentAmounts;
  paymentType: PaymentType;
  modificationMetadata: ModificationMetadata | null;
}

export function PaymentSuccessCard({
  booking,
  amounts,
  paymentType,
  modificationMetadata,
}: PaymentSuccessCardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-2 border-green-200 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-green-50 to-green-100 pb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              {paymentType.isModificationPayment
                ? "Paiement supplémentaire confirmé !"
                : "Paiement confirmé !"}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {paymentType.isModificationPayment
                ? "Votre paiement supplémentaire pour la modification a été effectué avec succès"
                : "Votre réservation a été confirmée avec succès"}
            </p>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Référence de réservation</p>
              <p className="text-2xl font-bold text-primary font-mono">{booking.reference}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Véhicule</span>
                <span className="font-semibold">
                  {booking.vehicle.brand} {booking.vehicle.model}
                </span>
              </div>

              {/* Afficher les informations de modification si c'est un paiement supplémentaire */}
              {paymentType.isModificationPayment &&
                modificationMetadata &&
                modificationMetadata.originalTotalPrice != null && (
                  <div className="border-t pt-3 mt-3 space-y-2">
                    <p className="text-sm font-semibold text-amber-700 mb-2">📊 Comparaison des prix</p>
                    <div className="bg-white rounded p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prix original :</span>
                        <span>{modificationMetadata.originalTotalPrice.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nouveau prix :</span>
                        <span className="font-semibold">{booking.totalPrice.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-muted-foreground">Différence :</span>
                        <span
                          className={`font-semibold ${
                            booking.totalPrice - modificationMetadata.originalTotalPrice >= 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {booking.totalPrice - modificationMetadata.originalTotalPrice >= 0 ? "+" : ""}
                          {(booking.totalPrice - modificationMetadata.originalTotalPrice).toFixed(2)}€
                        </span>
                      </div>
                    </div>
                    {modificationMetadata.originalDepositPaid != null && (
                      <div className="bg-white rounded p-3 space-y-2 text-sm mt-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Acompte original :</span>
                          <span>{modificationMetadata.originalDepositPaid.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nouvel acompte :</span>
                          <span className="font-semibold">{booking.depositPaid?.toFixed(2) || "0.00"}€</span>
                        </div>
                        {modificationMetadata.depositDifference != null && (
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-muted-foreground">Paiement supplémentaire :</span>
                            <span className="font-semibold text-green-600">
                              +{modificationMetadata.depositDifference.toFixed(2)}€
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              {amounts.actualDepositPaid > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {paymentType.isModificationPayment
                      ? "Acompte total payé (30%)"
                      : "Acompte payé (30%)"}
                  </span>
                  <span className="font-semibold text-green-600">
                    {amounts.actualDepositPaid.toFixed(2)}€
                  </span>
                </div>
              )}

              {amounts.expectedSecurityDeposit > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {paymentType.type === "authorization"
                      ? "Caution de garantie (bloquée)"
                      : amounts.actualSecurityDepositPaid > 0
                      ? "Caution de garantie payée"
                      : "Caution de garantie (sera bloquée plus tard)"}
                  </span>
                  <span className="font-semibold text-amber-600">
                    {amounts.expectedSecurityDeposit.toFixed(2)}€
                  </span>
                </div>
              )}

              {booking.remainingAmount && booking.remainingAmount > 0 && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Solde à la remise</span>
                  <span className="font-semibold">{booking.remainingAmount.toFixed(2)}€</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-semibold">Total de la location</span>
                <span className="font-bold text-lg">{booking.totalPrice.toFixed(2)}€</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Prochaines étapes :</strong>
                <br />
                {paymentType.isModificationPayment
                  ? "Vous allez recevoir un email de mise à jour avec les détails de votre paiement supplémentaire dans quelques instants."
                  : "Vous allez recevoir un email de confirmation dans quelques instants."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1" variant="outline">
                <Link href="/dashboard">Retour au tableau de bord</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href={`/bookings/${booking.id}`}>
                  Voir ma réservation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

