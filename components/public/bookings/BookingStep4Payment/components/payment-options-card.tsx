import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, CreditCard, Wallet } from "lucide-react";
import { PriceCalculation, PaymentOption, BookingStep4PaymentProps } from "../types";

interface PaymentOptionsCardProps {
  bookingData: BookingStep4PaymentProps["bookingData"];
  priceCalculation: PriceCalculation | null;
  existingBookingId?: string;
  updateBookingData: (updates: Partial<BookingStep4PaymentProps["bookingData"]>) => void;
}

export function PaymentOptionsCard({
  bookingData,
  priceCalculation,
  existingBookingId,
  updateBookingData,
}: PaymentOptionsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl">Paiement</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-base sm:text-lg font-semibold block">Choisissez votre mode de paiement</Label>
            <RadioGroup
              value={bookingData.paymentOption}
              onValueChange={(value) => {
                updateBookingData({ paymentOption: value as PaymentOption });
              }}
              className="space-y-3 sm:space-y-4"
            >
              {/* Option 1 : Acompte seulement (recommandé) */}
              <div className="flex items-start space-x-3 sm:space-x-4 rounded-lg border-2 border-primary/30 p-4 sm:p-5 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer bg-primary/5">
                <RadioGroupItem value="deposit" id="pay-deposit" className="mt-0.5 sm:mt-1" />
                <Label htmlFor="pay-deposit" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span className="font-semibold text-sm sm:text-base">Acompte seulement (recommandé)</span>
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">Recommandé</span>
                    </div>
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground space-y-3 sm:space-y-4">
                    {priceCalculation && (
                      <>
                        <div className="bg-white border-2 border-primary/30 rounded-lg p-3 sm:p-4">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 font-medium">Montant à payer maintenant</p>
                          <p className="text-xl sm:text-2xl font-bold text-primary mb-1">
                            {priceCalculation.deposit.toFixed(2)}€
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            = Acompte uniquement (30% de la location)
                          </p>
                        </div>
                        <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm bg-muted/30 rounded-md p-3 sm:p-4">
                          <div className="flex justify-between items-center py-0.5">
                            <span className="text-muted-foreground">Acompte (30% de la location) :</span>
                            <span className="font-semibold">{priceCalculation.deposit.toFixed(2)}€</span>
                          </div>
                          {priceCalculation.vehicleDeposit > 0 && (
                            <div className="flex justify-between items-center py-0.5 text-amber-700">
                              <span>Caution de garantie :</span>
                              <span className="font-semibold">{priceCalculation.vehicleDeposit.toFixed(2)}€</span>
                              <span className="text-xs text-muted-foreground ml-2">(plus tard)</span>
                            </div>
                          )}
                          <div className="border-t border-border/50 pt-2 mt-2 flex justify-between items-center font-bold text-sm sm:text-base">
                            <span className="text-foreground">Total à payer maintenant :</span>
                            <span className="text-primary">
                              {priceCalculation.deposit.toFixed(2)}€
                            </span>
                          </div>
                        </div>
                        {priceCalculation.vehicleDeposit > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5 sm:p-3">
                            <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
                              ⓘ La caution de garantie ({priceCalculation.vehicleDeposit.toFixed(2)}€) sera bloquée lors de la confirmation de votre réservation et remboursée après restitution sans dégâts.
                            </p>
                          </div>
                        )}
                        {priceCalculation.remainingAmount > 0 && (
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Le solde de <strong className="text-foreground">{priceCalculation.remainingAmount.toFixed(2)}€</strong> sera à régler à la remise du véhicule.
                          </p>
                        )}
                      </>
                    )}
                    {!priceCalculation && (
                      <p>Calcul du montant en cours...</p>
                    )}
                  </div>
                </Label>
              </div>

              {/* Option 2 : Acompte + caution maintenant */}
              <div className="flex items-start space-x-3 sm:space-x-4 rounded-lg border-2 border-border p-4 sm:p-5 hover:bg-muted/50 hover:border-primary/20 transition-all cursor-pointer">
                <RadioGroupItem value="deposit_and_deposit" id="pay-deposit-and-deposit" className="mt-0.5 sm:mt-1" />
                <Label htmlFor="pay-deposit-and-deposit" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold text-sm sm:text-base">Acompte + caution maintenant</span>
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground space-y-3 sm:space-y-4">
                    {priceCalculation && (
                      <>
                        <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-3 sm:p-4">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 font-medium">Montant total à payer maintenant</p>
                          <p className="text-xl sm:text-2xl font-bold text-primary mb-1">
                            {((priceCalculation.deposit || 0) + (priceCalculation.vehicleDeposit || 0)).toFixed(2)}€
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            = Acompte + Caution de garantie
                          </p>
                        </div>
                        <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm bg-muted/30 rounded-md p-3 sm:p-4">
                          <div className="flex justify-between items-center py-0.5">
                            <span className="text-muted-foreground">Acompte (30% de la location) :</span>
                            <span className="font-semibold">{priceCalculation.deposit.toFixed(2)}€</span>
                          </div>
                          {priceCalculation.vehicleDeposit > 0 && (
                            <div className="flex justify-between items-center py-0.5 text-amber-700">
                              <span>+ Caution de garantie :</span>
                              <span className="font-semibold">{priceCalculation.vehicleDeposit.toFixed(2)}€</span>
                            </div>
                          )}
                          <div className="border-t border-border/50 pt-2 mt-2 flex justify-between items-center font-bold text-sm sm:text-base">
                            <span className="text-foreground">Total à payer maintenant :</span>
                            <span className="text-primary">
                              {((priceCalculation.deposit || 0) + (priceCalculation.vehicleDeposit || 0)).toFixed(2)}€
                            </span>
                          </div>
                        </div>
                        {priceCalculation.vehicleDeposit > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5 sm:p-3">
                            <p className="text-xs sm:text-sm text-amber-700 leading-relaxed">
                              ⓘ La caution de garantie sera remboursée après restitution du véhicule sans dégâts.
                            </p>
                          </div>
                        )}
                        {priceCalculation.remainingAmount > 0 && (
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Le solde de <strong className="text-foreground">{priceCalculation.remainingAmount.toFixed(2)}€</strong> sera à régler à la remise du véhicule.
                          </p>
                        )}
                      </>
                    )}
                    {!priceCalculation && (
                      <p>Calcul du montant en cours...</p>
                    )}
                  </div>
                </Label>
              </div>

              {/* Option 3 : Sur place avec empreinte */}
              <div className="flex items-start space-x-3 sm:space-x-4 rounded-lg border-2 border-border p-4 sm:p-5 hover:bg-muted/50 hover:border-primary/20 transition-all cursor-pointer">
                <RadioGroupItem value="on_site" id="pay-on-site" className="mt-0.5 sm:mt-1" />
                <Label htmlFor="pay-on-site" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold text-sm sm:text-base">Payer sur place avec empreinte</span>
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground space-y-3 sm:space-y-4">
                    {priceCalculation && (
                      <>
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 sm:p-4">
                          <p className="text-xs sm:text-sm text-green-700 mb-1.5 sm:mb-2 font-medium">Aucun paiement maintenant</p>
                          <p className="text-xl sm:text-2xl font-bold text-green-700 mb-1">
                            0,00€
                          </p>
                          <p className="text-xs sm:text-sm text-green-600">
                            = Paiement sur place à la remise du véhicule
                          </p>
                        </div>
                        <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm bg-muted/30 rounded-md p-3 sm:p-4">
                          <div className="flex justify-between items-center py-0.5">
                            <span className="text-muted-foreground">Acompte (30% de la location) :</span>
                            <span className="font-semibold text-muted-foreground">0,00€</span>
                            <span className="text-xs text-muted-foreground ml-2">(sur place)</span>
                          </div>
                          {priceCalculation.vehicleDeposit > 0 && (
                            <div className="flex justify-between items-center py-0.5 text-amber-700">
                              <span>Caution de garantie :</span>
                              <span className="font-semibold">{priceCalculation.vehicleDeposit.toFixed(2)}€</span>
                              <span className="text-xs text-muted-foreground ml-2">(empreinte)</span>
                            </div>
                          )}
                          <div className="border-t border-border/50 pt-2 mt-2 flex justify-between items-center font-bold text-sm sm:text-base">
                            <span className="text-foreground">Total à payer maintenant :</span>
                            <span className="text-primary">
                              0,00€
                            </span>
                          </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5 sm:p-3">
                          <p className="text-xs sm:text-sm text-blue-700 leading-relaxed font-semibold mb-1">
                            ⚠️ Empreinte bancaire requise
                          </p>
                          <p className="text-xs sm:text-sm text-blue-600 leading-relaxed">
                            Une empreinte bancaire de {priceCalculation.vehicleDeposit > 0 ? `${priceCalculation.vehicleDeposit.toFixed(2)}€` : "la caution"} sera requise pour confirmer votre réservation. Aucun débit ne sera effectué, l&apos;argent reste bloqué sur votre carte et sera libéré après restitution sans dégâts.
                          </p>
                        </div>
                        <div className="bg-muted/50 border border-border rounded-md p-2.5 sm:p-3">
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">À la remise du véhicule :</strong> Vous paierez l&apos;acompte de {priceCalculation.deposit.toFixed(2)}€ et le solde de {priceCalculation.remainingAmount.toFixed(2)}€.
                          </p>
                        </div>
                      </>
                    )}
                    {!priceCalculation && (
                      <p>Calcul du montant en cours...</p>
                    )}
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          {existingBookingId && (
            <Alert className="mt-4 sm:mt-6 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-blue-600" />
              <AlertDescription className="text-sm sm:text-base leading-relaxed text-blue-800">
                <strong>Modification de votre réservation existante :</strong> Vous allez modifier l&apos;option de paiement de votre réservation. Aucune nouvelle réservation ne sera créée.
              </AlertDescription>
            </Alert>
          )}
          <Alert className="mt-4 sm:mt-6">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <AlertDescription className="text-sm sm:text-base leading-relaxed">
              {bookingData.paymentOption === "deposit" && (
                <>
                  <strong>Acompte seulement :</strong> {existingBookingId ? "Vous serez redirigé vers la page de paiement pour régler l&apos;acompte de" : "Votre réservation sera créée et vous serez redirigé vers la page de paiement pour régler l&apos;acompte de"} {priceCalculation ? `${priceCalculation.deposit.toFixed(2)}€` : "montant calculé"}€. La caution de garantie sera bloquée lors de la confirmation de votre réservation.
                </>
              )}
              {bookingData.paymentOption === "deposit_and_deposit" && (
                <>
                  <strong>Paiement immédiat :</strong> {existingBookingId ? "Vous serez redirigé vers la page de paiement pour régler l&apos;acompte et la caution de garantie" : "Votre réservation sera créée et vous serez redirigé vers la page de paiement pour régler l&apos;acompte et la caution de garantie"} ({priceCalculation ? `${((priceCalculation.deposit || 0) + (priceCalculation.vehicleDeposit || 0)).toFixed(2)}€` : "montant calculé"}€ au total).
                </>
              )}
              {bookingData.paymentOption === "on_site" && (
                <>
                  <strong>Paiement sur place :</strong> {existingBookingId ? "Une empreinte bancaire sera requise pour confirmer votre réservation" : "Votre réservation sera créée en attente de validation. Une empreinte bancaire sera requise pour confirmer votre réservation"} (aucun débit, juste un blocage temporaire). Vous paierez l&apos;acompte et le solde à la remise du véhicule.
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}

