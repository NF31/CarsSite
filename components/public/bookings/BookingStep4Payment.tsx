"use client";

import { useState, useEffect } from "react";
import { GetPublicVehicleByIdResult } from "@/actions/public/vehicles/get-by-id";
import { createPublicBookingAction } from "@/actions/public/bookings/create-booking";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, CreditCard, Euro, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface BookingStep4PaymentProps {
  vehicle: GetPublicVehicleByIdResult["data"];
  bookingData: {
    vehicleId: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    pickup: string;
    returnLocation: string;
    pickupPlaceId: string;
    returnPlaceId: string;
    selectedServiceIds: string[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    driverLicenseUrl?: string;
    acceptedTerms: boolean;
    payNow: boolean;
  };
  updateBookingData: (updates: Partial<BookingStep4PaymentProps["bookingData"]>) => void;
  onPrevious: () => void;
}

export function BookingStep4Payment({
  vehicle,
  bookingData,
  updateBookingData,
  onPrevious,
}: BookingStep4PaymentProps) {
  const router = useRouter();
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [priceCalculation, setPriceCalculation] = useState<{
    vehiclePrice: number;
    servicesPrice: number;
    totalPrice: number;
    deposit: number;
    vehicleDeposit: number;
    remainingAmount: number;
    numberOfDays: number;
    breakdown: {
      vehicle: {
        pricePerDay: number;
        days: number;
        total: number;
      };
      services: Array<{
        id: string;
        name: string;
        price: number;
        pricingType: "PER_DAY" | "FIXED" | "PERCENTAGE";
        total: number;
      }>;
    };
  } | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  // Calculer le prix
  useEffect(() => {
    const calculatePrice = async () => {
      if (
        !bookingData.startDate ||
        !bookingData.endDate ||
        !bookingData.startTime ||
        !bookingData.endTime
      ) {
        setPriceCalculation(null);
        return;
      }

      setIsCalculatingPrice(true);
      try {
        const result = await calculateBookingPriceAction({
          vehicleId: vehicle.id,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          serviceIds: bookingData.selectedServiceIds,
        });

        if (result.success && result.data) {
          setPriceCalculation(result.data);
        } else {
          setPriceCalculation(null);
        }
      } catch (error) {
        console.error("Erreur lors du calcul du prix", error);
        setPriceCalculation(null);
      } finally {
        setIsCalculatingPrice(false);
      }
    };

    calculatePrice();
  }, [
    bookingData.startDate,
    bookingData.endDate,
    bookingData.startTime,
    bookingData.endTime,
    bookingData.selectedServiceIds,
    vehicle.id,
  ]);

  const handleCreateBooking = async () => {
    setIsCreatingBooking(true);
    setCreateError(null);

    try {
      // Combiner dates et heures
      const [startHours, startMinutes] = bookingData.startTime.split(":").map(Number);
      const [endHours, endMinutes] = bookingData.endTime.split(":").map(Number);

      const startDate = new Date(bookingData.startDate);
      startDate.setHours(
        !isNaN(startHours) ? startHours : 0,
        !isNaN(startMinutes) ? startMinutes : 0,
        0,
        0
      );

      const endDate = new Date(bookingData.endDate);
      endDate.setHours(
        !isNaN(endHours) ? endHours : 0,
        !isNaN(endMinutes) ? endMinutes : 0,
        0,
        0
      );

      const result = await createPublicBookingAction({
        vehicleId: bookingData.vehicleId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        pickup: bookingData.pickup,
        returnLocation: bookingData.returnLocation,
        pickupPlaceId: bookingData.pickupPlaceId,
        returnPlaceId: bookingData.returnPlaceId,
        serviceIds: bookingData.selectedServiceIds,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        driverLicenseUrl: bookingData.driverLicenseUrl,
        acceptedTerms: bookingData.acceptedTerms,
      });

      if (result.success && result.data) {
        // Si le client a choisi de payer maintenant, rediriger vers la page de paiement
        if (bookingData.payNow) {
          toast.success("Réservation créée", {
            description: "Redirection vers le paiement...",
            duration: 2000,
          });
          router.push(`/bookings/payment?bookingId=${result.data.bookingId}`);
        } else {
          toast.success("Réservation créée avec succès", {
            description: `Votre réservation ${result.data.reference} a été créée avec succès. Vous allez recevoir un email de confirmation. Elle sera validée par un administrateur dans les plus brefs délais.`,
            duration: 5000,
          });
          // Rediriger vers la page de confirmation
          router.push(`/bookings/confirmation?reference=${result.data.reference}`);
        }
      } else {
        const errorMessage = result.error || "Erreur lors de la création de la réservation";
        setCreateError(errorMessage);
        toast.error("Erreur lors de la création de la réservation", {
          description: errorMessage,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Erreur lors de la création de la réservation", error);
      const errorMessage = "Une erreur inattendue est survenue lors de la création de la réservation.";
      setCreateError(errorMessage);
      toast.error("Erreur lors de la création de la réservation", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsCreatingBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Récapitulatif de la réservation */}
      <Card>
        <CardHeader>
          <CardTitle>Récapitulatif de votre réservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Véhicule */}
          <div>
            <h4 className="font-semibold mb-2">Véhicule</h4>
            <p className="text-sm text-muted-foreground">
              {vehicle.brand} {vehicle.model} • {vehicle.year} • {vehicle.seats} places
            </p>
          </div>

          {/* Dates et lieux */}
          <div>
            <h4 className="font-semibold mb-2">Dates et lieux</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Départ:</strong> {bookingData.startDate} à {bookingData.startTime} • {bookingData.pickup}
              </p>
              <p>
                <strong>Retour:</strong> {bookingData.endDate} à {bookingData.endTime} • {bookingData.returnLocation}
              </p>
            </div>
          </div>

          {/* Services */}
          {bookingData.selectedServiceIds.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Services additionnels</h4>
              <p className="text-sm text-muted-foreground">
                {bookingData.selectedServiceIds.length} service(s) sélectionné(s)
              </p>
            </div>
          )}

          {/* Informations client */}
          <div>
            <h4 className="font-semibold mb-2">Informations client</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Nom:</strong> {bookingData.customerName}
              </p>
              <p>
                <strong>Email:</strong> {bookingData.customerEmail}
              </p>
              <p>
                <strong>Téléphone:</strong> {bookingData.customerPhone}
              </p>
              {bookingData.driverLicenseUrl && (
                <p>
                  <strong>Permis de conduire:</strong> Téléchargé
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Récapitulatif du prix */}
      {priceCalculation ? (
        <Card>
          <CardHeader>
            <CardTitle>Détails du prix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Véhicule ({priceCalculation.numberOfDays.toFixed(2)} jour(s))</span>
                <span>{priceCalculation.vehiclePrice.toFixed(2)}€</span>
              </div>
              {priceCalculation.servicesPrice > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Services</span>
                    <span>{priceCalculation.servicesPrice.toFixed(2)}€</span>
                  </div>
                  <div className="pl-4 space-y-1">
                    {priceCalculation.breakdown.services.map((service) => (
                      <div key={service.id} className="flex justify-between text-xs text-muted-foreground">
                        <span>• {service.name}</span>
                        <span>{service.total.toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                </>
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
                      ⓘ Cette caution sera bloquée lors de la confirmation et remboursée après restitution sans dégâts. Elle n'est pas incluse dans le prix de la location.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
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
      )}

      {/* Erreur */}
      {createError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{createError}</AlertDescription>
        </Alert>
      )}

      {/* Paiement */}
      <Card>
        <CardHeader>
          <CardTitle>Paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Choisissez votre mode de paiement</Label>
              <RadioGroup
                value={bookingData.payNow ? "now" : "later"}
                onValueChange={(value) => {
                  updateBookingData({ payNow: value === "now" });
                }}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="now" id="pay-now" className="mt-1" />
                  <Label htmlFor="pay-now" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Payer l'acompte maintenant</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Vous paierez l'acompte de {priceCalculation ? priceCalculation.deposit.toFixed(2) : "0.00"}€ maintenant.</p>
                      {priceCalculation && priceCalculation.vehicleDeposit > 0 && (
                        <p className="text-amber-600">
                          + Caution de garantie : {priceCalculation.vehicleDeposit.toFixed(2)}€ (sera remboursée après restitution)
                        </p>
                      )}
                      {priceCalculation && priceCalculation.remainingAmount > 0 && (
                        <p>Le solde de {priceCalculation.remainingAmount.toFixed(2)}€ sera à régler à la remise du véhicule.</p>
                      )}
                    </div>
                  </Label>
                </div>
                <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="later" id="pay-later" className="mt-1" />
                  <Label htmlFor="pay-later" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Payer plus tard</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Vous paierez l'acompte de {priceCalculation ? priceCalculation.deposit.toFixed(2) : "0.00"}€ lors de la confirmation de votre réservation par l'administrateur.</p>
                      {priceCalculation && priceCalculation.vehicleDeposit > 0 && (
                        <p className="text-amber-600">
                          + Caution de garantie : {priceCalculation.vehicleDeposit.toFixed(2)}€ (sera bloquée à la confirmation)
                        </p>
                      )}
                      {priceCalculation && priceCalculation.remainingAmount > 0 && (
                        <p>Le solde de {priceCalculation.remainingAmount.toFixed(2)}€ sera à régler à la remise du véhicule.</p>
                      )}
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {bookingData.payNow ? (
                  <>
                    <strong>Paiement immédiat :</strong> Votre réservation sera créée et vous serez redirigé vers la page de paiement pour régler l'acompte et la caution de garantie.
                  </>
                ) : (
                  <>
                    <strong>Paiement différé :</strong> Votre réservation sera créée en attente de validation. Vous recevrez un email avec les instructions de paiement une fois la réservation confirmée par l'administrateur.
                  </>
                )}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Boutons de navigation */}
      <div className="flex justify-between gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={(e) => {
            e.preventDefault();
            onPrevious();
          }}
        >
          Précédent
        </Button>
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleCreateBooking();
          }}
          disabled={isCreatingBooking || isCalculatingPrice || !priceCalculation}
          className="flex items-center gap-2"
        >
          {isCreatingBooking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Création en cours...
            </>
          ) : bookingData.payNow ? (
            <>
              <CreditCard className="h-4 w-4" />
              Confirmer et payer maintenant
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Confirmer la réservation
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

