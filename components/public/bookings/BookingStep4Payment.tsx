"use client";

import { useState, useEffect } from "react";
import { GetPublicVehicleByIdResult } from "@/actions/public/vehicles/get-by-id";
import { createPublicBookingAction } from "@/actions/public/bookings/create-booking";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import { getPendingBookingAction } from "@/actions/public/bookings/get-pending-booking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, CreditCard, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
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
    paymentOption: "deposit" | "deposit_and_deposit" | "on_site";
  };
  updateBookingData: (updates: Partial<BookingStep4PaymentProps["bookingData"]>) => void;
  onPrevious: () => void;
  existingBookingId?: string; // ID de la réservation existante si on revient depuis la page de paiement
}

export function BookingStep4Payment({
  vehicle,
  bookingData,
  updateBookingData,
  onPrevious,
  existingBookingId,
}: BookingStep4PaymentProps) {
  const router = useRouter();
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Log pour déboguer - vérifier que existingBookingId est bien reçu
  useEffect(() => {
    console.log("🔍 [BookingStep4Payment - CLIENT] Props reçues:", {
      timestamp: new Date().toISOString(),
      existingBookingId: existingBookingId || "UNDEFINED",
      existingBookingIdType: typeof existingBookingId,
      existingBookingIdLength: existingBookingId?.length || 0,
      existingBookingIdValue: existingBookingId,
      vehicleId: vehicle?.id,
      hasVehicle: !!vehicle,
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      urlSearchParams: typeof window !== 'undefined' ? window.location.search : 'N/A',
    });
  }, [existingBookingId, vehicle]);
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
    // Vérification CRITIQUE : Si une réservation existe déjà, NE PAS créer de nouvelle réservation
    // Cette vérification doit être la PREMIÈRE chose à faire, AVANT même setIsCreatingBooking
    
    // Vérifier aussi dans l'URL au cas où le prop n'est pas transmis
    const urlParams = new URLSearchParams(window.location.search);
    const bookingIdFromUrl = urlParams.get('bookingId');
    const finalBookingId = existingBookingId || bookingIdFromUrl;
    
    // Log client ET serveur (via console.log qui apparaît dans les deux)
    console.log("🔍 [BookingStep4Payment - CLIENT] handleCreateBooking appelé", {
      timestamp: new Date().toISOString(),
      existingBookingId: existingBookingId || "UNDEFINED",
      existingBookingIdType: typeof existingBookingId,
      existingBookingIdLength: existingBookingId?.length || 0,
      bookingIdFromUrl: bookingIdFromUrl || "UNDEFINED",
      bookingIdFromUrlType: typeof bookingIdFromUrl,
      finalBookingId: finalBookingId || "UNDEFINED",
      finalBookingIdType: typeof finalBookingId,
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      urlSearchParams: typeof window !== 'undefined' ? window.location.search : 'N/A',
      willUseExistingBooking: !!(finalBookingId && finalBookingId.trim() !== ""),
    });

    if (finalBookingId && finalBookingId.trim() !== "") {
      // Déterminer le type de paiement selon l'option choisie
      let paymentType = "full";
      if (bookingData.paymentOption === "deposit") {
        paymentType = "deposit";
      } else if (bookingData.paymentOption === "deposit_and_deposit") {
        paymentType = "full";
      } else if (bookingData.paymentOption === "on_site") {
        paymentType = "authorization";
      }

      console.log("✅ [BookingStep4Payment - CLIENT] Réservation existante détectée, redirection directe vers paiement", {
        timestamp: new Date().toISOString(),
        finalBookingId,
        existingBookingId,
        bookingIdFromUrl,
        paymentOption: bookingData.paymentOption,
        paymentType,
        willRedirectTo: `/bookings/payment?bookingId=${finalBookingId}&type=${paymentType}`,
      });

      toast.success("Option de paiement mise à jour", {
        description: "Redirection vers le paiement...",
        duration: 2000,
      });
      router.push(`/bookings/payment?bookingId=${finalBookingId}&type=${paymentType}`);
      return; // IMPORTANT : Sortir immédiatement, ne pas continuer - AUCUN appel à createPublicBookingAction
    }

    // Si on arrive ici, c'est qu'il n'y a PAS de réservation existante dans les props/URL
    // MAIS on doit vérifier dans la base de données s'il existe une réservation PENDING
    console.log("🔍 [BookingStep4Payment - CLIENT] Vérification dans la DB d'une réservation avec statut PENDING:", {
      vehicleId: bookingData.vehicleId,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      existingBookingId: existingBookingId || "aucun",
      statusRecherche: "PENDING",
      message: "Recherche d'une réservation PENDING pour cet utilisateur, ce véhicule et cette période",
    });

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

      // VÉRIFIER D'ABORD s'il existe une réservation PENDING dans la DB
      // avec TOUS les critères : dates, véhicule, services, lieux de retrait/retour
      // Gère les deux cas : utilisateur connecté (via session) et non connecté (via email)
      const pendingBookingResult = await getPendingBookingAction({
        vehicleId: bookingData.vehicleId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        serviceIds: bookingData.selectedServiceIds,
        pickupLocationId: bookingData.pickupPlaceId,
        returnLocationId: bookingData.returnPlaceId,
        customerEmail: bookingData.customerEmail, // Pour les utilisateurs non connectés
      });

      if (pendingBookingResult.success && pendingBookingResult.booking) {
        // Une réservation PENDING existe déjà ! Utiliser celle-ci
        console.log("✅ [BookingStep4Payment - CLIENT] Réservation PENDING trouvée dans la DB, utilisation de celle-ci:", {
          bookingId: pendingBookingResult.booking.id,
          reference: pendingBookingResult.booking.reference,
          status: pendingBookingResult.booking.status,
          message: "Réservation avec statut PENDING trouvée, redirection vers le paiement sans créer de nouvelle réservation",
        });

        // Déterminer le type de paiement selon l'option choisie
        let paymentType = "full";
        if (bookingData.paymentOption === "deposit") {
          paymentType = "deposit";
        } else if (bookingData.paymentOption === "deposit_and_deposit") {
          paymentType = "full";
        } else if (bookingData.paymentOption === "on_site") {
          paymentType = "authorization";
        }

        toast.success("Réservation trouvée", {
          description: "Redirection vers le paiement...",
          duration: 2000,
        });
        router.push(`/bookings/payment?bookingId=${pendingBookingResult.booking.id}&type=${paymentType}`);
        setIsCreatingBooking(false);
        return; // IMPORTANT : Sortir, ne pas créer de nouvelle réservation
      }

      // Aucune réservation PENDING trouvée, on peut créer une nouvelle réservation
      console.log("🆕 [BookingStep4Payment - CLIENT] Aucune réservation PENDING trouvée dans la DB, création d'une nouvelle réservation:", {
        vehicleId: bookingData.vehicleId,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        statusRecherche: "PENDING",
        message: "Aucune réservation avec statut PENDING trouvée, création d'une nouvelle réservation",
      });

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
        // Gérer les différentes options de paiement
        if (bookingData.paymentOption === "deposit") {
          // Acompte seulement : rediriger vers paiement de l'acompte
          toast.success("Réservation créée", {
            description: "Redirection vers le paiement de l'acompte...",
            duration: 2000,
          });
          router.push(`/bookings/payment?bookingId=${result.data.bookingId}&type=deposit`);
        } else if (bookingData.paymentOption === "deposit_and_deposit") {
          // Acompte + caution : rediriger vers paiement complet
          toast.success("Réservation créée", {
            description: "Redirection vers le paiement...",
            duration: 2000,
          });
          router.push(`/bookings/payment?bookingId=${result.data.bookingId}&type=full`);
        } else if (bookingData.paymentOption === "on_site") {
          // Sur place avec empreinte : rediriger vers page d'empreinte
          toast.success("Réservation créée", {
            description: "Redirection vers la confirmation de l'empreinte bancaire...",
            duration: 2000,
          });
          router.push(`/bookings/payment?bookingId=${result.data.bookingId}&type=authorization`);
        } else {
          // Fallback : confirmation classique
          toast.success("Réservation créée avec succès", {
            description: `Votre réservation ${result.data.reference} a été créée avec succès. Vous allez recevoir un email de confirmation.`,
            duration: 5000,
          });
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
    <div className="space-y-4 sm:space-y-6">
      {/* Récapitulatif de la réservation */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">Récapitulatif de votre réservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 pt-0">
          {/* Véhicule */}
          <div className="pb-3 sm:pb-4 border-b border-border/50">
            <h4 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3">Véhicule</h4>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">{vehicle.brand} {vehicle.model}</span>
              <span className="mx-2">•</span>
              <span>{vehicle.year}</span>
              <span className="mx-2">•</span>
              <span>{vehicle.seats} places</span>
            </p>
          </div>

          {/* Dates et lieux */}
          <div className="pb-3 sm:pb-4 border-b border-border/50">
            <h4 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3">Dates et lieux</h4>
            <div className="text-sm sm:text-base text-muted-foreground space-y-2 sm:space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                <span className="font-semibold text-foreground min-w-[60px] sm:min-w-[70px]">Départ:</span>
                <span className="flex-1">
                  {bookingData.startDate} à {bookingData.startTime}
                  <span className="hidden sm:inline mx-2">•</span>
                  <span className="block sm:inline mt-1 sm:mt-0">{bookingData.pickup}</span>
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                <span className="font-semibold text-foreground min-w-[60px] sm:min-w-[70px]">Retour:</span>
                <span className="flex-1">
                  {bookingData.endDate} à {bookingData.endTime}
                  <span className="hidden sm:inline mx-2">•</span>
                  <span className="block sm:inline mt-1 sm:mt-0">{bookingData.returnLocation}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          {bookingData.selectedServiceIds.length > 0 && (
            <div className="pb-3 sm:pb-4 border-b border-border/50">
              <h4 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3">Services additionnels</h4>
              <p className="text-sm sm:text-base text-muted-foreground">
                {bookingData.selectedServiceIds.length} service{bookingData.selectedServiceIds.length > 1 ? "s" : ""} sélectionné{bookingData.selectedServiceIds.length > 1 ? "s" : ""}
              </p>
            </div>
          )}

          {/* Informations client */}
          <div>
            <h4 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3">Informations client</h4>
            <div className="text-sm sm:text-base text-muted-foreground space-y-1.5 sm:space-y-2">
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                <span className="font-semibold text-foreground min-w-[80px] sm:min-w-[90px]">Nom:</span>
                <span>{bookingData.customerName}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                <span className="font-semibold text-foreground min-w-[80px] sm:min-w-[90px]">Email:</span>
                <span className="break-all">{bookingData.customerEmail}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                <span className="font-semibold text-foreground min-w-[80px] sm:min-w-[90px]">Téléphone:</span>
                <span>{bookingData.customerPhone}</span>
              </div>
              {bookingData.driverLicenseUrl && (
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <span className="font-semibold text-foreground min-w-[80px] sm:min-w-[90px]">Permis:</span>
                  <span className="text-green-600 font-medium">✓ Téléchargé</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Récapitulatif du prix */}
      {priceCalculation ? (
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
                  updateBookingData({ paymentOption: value as "deposit" | "deposit_and_deposit" | "on_site" });
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

      {/* Boutons de navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-2 sm:pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={(e) => {
            e.preventDefault();
            onPrevious();
          }}
          className="w-full sm:w-auto order-2 sm:order-1"
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
          className="flex items-center justify-center gap-2 w-full sm:w-auto order-1 sm:order-2 text-sm sm:text-base h-11 sm:h-12"
        >
          {isCreatingBooking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {existingBookingId ? "Mise à jour en cours..." : "Création en cours..."}
            </>
          ) : existingBookingId ? (
            <>
              <CreditCard className="h-4 w-4" />
              {bookingData.paymentOption === "deposit" 
                ? (priceCalculation ? `Modifier et payer l'acompte ${priceCalculation.deposit.toFixed(2)}€` : "Modifier l'option de paiement")
                : bookingData.paymentOption === "deposit_and_deposit"
                ? (priceCalculation ? `Modifier et payer ${((priceCalculation.deposit || 0) + (priceCalculation.vehicleDeposit || 0)).toFixed(2)}€ maintenant` : "Modifier l'option de paiement")
                : "Modifier l'option de paiement"}
            </>
          ) : bookingData.paymentOption === "deposit" ? (
            <>
              <CreditCard className="h-4 w-4" />
              {priceCalculation
                ? `Confirmer et payer l'acompte ${priceCalculation.deposit.toFixed(2)}€`
                : "Confirmer et payer l'acompte"}
            </>
          ) : bookingData.paymentOption === "deposit_and_deposit" ? (
            <>
              <CreditCard className="h-4 w-4" />
              {priceCalculation
                ? `Confirmer et payer ${((priceCalculation.deposit || 0) + (priceCalculation.vehicleDeposit || 0)).toFixed(2)}€ maintenant`
                : "Confirmer et payer maintenant"}
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

