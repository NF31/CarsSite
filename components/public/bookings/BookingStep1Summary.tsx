"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { GetPublicVehicleByIdResult } from "@/actions/public/vehicles/get-by-id";
import { checkVehicleAvailabilityAction } from "@/actions/public/bookings/check-availability";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LoadScript } from "@react-google-maps/api";

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: typeof google.maps.places.Autocomplete;
        };
        event?: {
          clearInstanceListeners: (instance: any) => void;
        };
      };
    };
  }
}

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

interface BookingStep1SummaryProps {
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
  };
  updateBookingData: (updates: Partial<BookingStep1SummaryProps["bookingData"]>) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
}

function BookingStep1SummaryContent({
  vehicle,
  bookingData,
  updateBookingData,
  onNext,
  onPrevious,
  canGoNext,
}: BookingStep1SummaryProps) {
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [priceCalculation, setPriceCalculation] = useState<{
    vehiclePrice: number;
    servicesPrice: number;
    totalPrice: number;
    deposit: number;
    vehicleDeposit: number;
    remainingAmount: number;
    numberOfDays: number;
  } | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  const mainImage = vehicle.images[0] || "/placeholder-car.jpg";

  // Refs pour les inputs et autocomplete
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);
  const autocompletePickupRef = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteReturnRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Calculer le prix quand les dates changent
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

  const handleCheckAvailability = async () => {
    if (
      !bookingData.startDate ||
      !bookingData.endDate ||
      !bookingData.startTime ||
      !bookingData.endTime
    ) {
      setAvailabilityError("Veuillez remplir toutes les dates et heures");
      return;
    }

    setIsCheckingAvailability(true);
    setAvailabilityError(null);

    try {
      // Combiner date et heure
      const [startHours, startMinutes] = bookingData.startTime.split(":").map(Number);
      const [endHours, endMinutes] = bookingData.endTime.split(":").map(Number);

      const start = new Date(bookingData.startDate);
      start.setHours(
        !isNaN(startHours) ? startHours : 0,
        !isNaN(startMinutes) ? startMinutes : 0,
        0,
        0
      );

      const end = new Date(bookingData.endDate);
      end.setHours(
        !isNaN(endHours) ? endHours : 0,
        !isNaN(endMinutes) ? endMinutes : 0,
        0,
        0
      );

      const result = await checkVehicleAvailabilityAction({
        vehicleId: vehicle.id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      if (result.success) {
        if (result.available) {
          // Disponible, continuer
          onNext();
        } else {
          // Indisponible, afficher l'erreur
          switch (result.reason) {
            case "booking_conflict":
              setAvailabilityError(
                `Ce véhicule est déjà réservé pour cette période (référence: ${result.conflict?.reference || "N/A"})`
              );
              break;
            case "maintenance_conflict":
              setAvailabilityError("Ce véhicule est en maintenance pour cette période");
              break;
            case "vehicle_unavailable":
              setAvailabilityError("Ce véhicule n'est pas disponible pour le moment");
              break;
            default:
              setAvailabilityError("Ce véhicule n'est pas disponible pour cette période");
          }
        }
      } else {
        setAvailabilityError(result.error || "Erreur lors de la vérification de disponibilité");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de disponibilité", error);
      setAvailabilityError("Erreur lors de la vérification de disponibilité");
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleNextClick = async () => {
    if (!canGoNext) {
      return;
    }

    // Vérifier la disponibilité avant de continuer
    await handleCheckAvailability();
    // Note: onNext() est appelé dans handleCheckAvailability() si le véhicule est disponible
  };

  // Initialiser Autocomplete pour le pickup
  useEffect(() => {
    if (!pickupInputRef.current || typeof window === "undefined") {
      return;
    }

    if (!window.google?.maps?.places?.Autocomplete) {
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete && pickupInputRef.current) {
          clearInterval(checkGoogleMaps);
          initializePickupAutocomplete();
        }
      }, 100);
      return () => clearInterval(checkGoogleMaps);
    }

    initializePickupAutocomplete();

    function initializePickupAutocomplete() {
      if (!pickupInputRef.current || !window.google?.maps?.places?.Autocomplete) {
        return;
      }

      if (autocompletePickupRef.current) {
        google.maps.event.clearInstanceListeners(autocompletePickupRef.current);
        autocompletePickupRef.current = null;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
        componentRestrictions: { country: "fr" },
        fields: ["formatted_address", "place_id", "geometry"],
        types: ["geocode"],
      });

      autocompletePickupRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place) {
          const displayName = place.formatted_address || "";
          const placeId = place.place_id || "";
          if (displayName) {
            updateBookingData({ pickup: displayName, pickupPlaceId: placeId });
          }
        }
      });
    }

    return () => {
      if (autocompletePickupRef.current) {
        google.maps.event.clearInstanceListeners(autocompletePickupRef.current);
        autocompletePickupRef.current = null;
      }
    };
  }, [updateBookingData]);

  // Initialiser Autocomplete pour le retour
  useEffect(() => {
    if (!returnInputRef.current || typeof window === "undefined") {
      return;
    }

    if (!window.google?.maps?.places?.Autocomplete) {
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete && returnInputRef.current) {
          clearInterval(checkGoogleMaps);
          initializeReturnAutocomplete();
        }
      }, 100);
      return () => clearInterval(checkGoogleMaps);
    }

    initializeReturnAutocomplete();

    function initializeReturnAutocomplete() {
      if (!returnInputRef.current || !window.google?.maps?.places?.Autocomplete) {
        return;
      }

      if (autocompleteReturnRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteReturnRef.current);
        autocompleteReturnRef.current = null;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(returnInputRef.current, {
        componentRestrictions: { country: "fr" },
        fields: ["formatted_address", "place_id", "geometry"],
        types: ["geocode"],
      });

      autocompleteReturnRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place) {
          const displayName = place.formatted_address || "";
          const placeId = place.place_id || "";
          if (displayName) {
            updateBookingData({ returnLocation: displayName, returnPlaceId: placeId });
          }
        }
      });
    }

    return () => {
      if (autocompleteReturnRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteReturnRef.current);
        autocompleteReturnRef.current = null;
      }
    };
  }, [updateBookingData]);

  return (
    <div className="space-y-6">
      {/* Résumé du véhicule */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative w-full md:w-64 h-48 rounded-lg overflow-hidden">
              <Image
                src={mainImage}
                alt={`${vehicle.brand} ${vehicle.model}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 256px"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-muted-foreground">
                  {vehicle.year} • {vehicle.seats} places • {vehicle.transmission} • {vehicle.fuelType}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {vehicle.location.name}, {vehicle.location.city}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {vehicle.pricePerDay.toFixed(2)}€
                  </p>
                  <p className="text-xs text-muted-foreground">par jour</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dates et lieux */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Dates de location</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="startDate">Date de départ</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      id="startDate"
                      type="date"
                      value={bookingData.startDate}
                      onChange={(e) => updateBookingData({ startDate: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                    <Input
                      id="startTime"
                      type="time"
                      value={bookingData.startTime}
                      onChange={(e) => updateBookingData({ startTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="endDate">Date de retour</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      id="endDate"
                      type="date"
                      value={bookingData.endDate}
                      onChange={(e) => updateBookingData({ endDate: e.target.value })}
                      min={bookingData.startDate || new Date().toISOString().split("T")[0]}
                      required
                    />
                    <Input
                      id="endTime"
                      type="time"
                      value={bookingData.endTime}
                      onChange={(e) => updateBookingData({ endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Lieux</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="pickup">Lieu de retrait</Label>
                  <Input
                    ref={pickupInputRef}
                    id="pickup"
                    type="text"
                    value={bookingData.pickup}
                    onChange={(e) => updateBookingData({ pickup: e.target.value })}
                    placeholder="Paris CDG Aéroport"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="returnLocation">Lieu de retour</Label>
                  <Input
                    ref={returnInputRef}
                    id="returnLocation"
                    type="text"
                    value={bookingData.returnLocation}
                    onChange={(e) => updateBookingData({ returnLocation: e.target.value })}
                    placeholder="Paris CDG Aéroport"
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Erreur de disponibilité */}
      {availabilityError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{availabilityError}</AlertDescription>
        </Alert>
      )}

      {/* Récapitulatif du prix */}
      {priceCalculation && (
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
                      ⓘ Cette caution sera bloquée lors de la confirmation et remboursée après restitution sans dégâts. Elle n'est pas incluse dans le prix de la location.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boutons de navigation */}
      <div className="flex justify-end gap-3">
        {/* Pas de bouton Précédent à l'étape 1 */}
        <Button
          type="button"
          onClick={handleNextClick}
          disabled={!canGoNext || isCheckingAvailability || isCalculatingPrice}
          className="w-full sm:w-auto"
        >
          {isCheckingAvailability ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Vérification...
            </>
          ) : isCalculatingPrice ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calcul...
            </>
          ) : (
            "Suivant"
          )}
        </Button>
      </div>
    </div>
  );
}

export function BookingStep1Summary(props: BookingStep1SummaryProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const libraries = useMemo(() => GOOGLE_MAPS_LIBRARIES, []);

  if (!apiKey) {
    // Si pas de clé API, on retourne le contenu sans LoadScript
    return <BookingStep1SummaryContent {...props} />;
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={libraries}
      onError={(error) => {
        if (error?.message?.includes("RefererNotAllowedMapError")) {
          console.error(
            "⚠️ Erreur Google Maps: RefererNotAllowedMapError\n" +
              "Pour résoudre ce problème :\n" +
              "1. Allez dans Google Cloud Console > APIs & Services > Credentials\n" +
              "2. Sélectionnez votre clé API\n" +
              "3. Dans 'Application restrictions', ajoutez :\n" +
              "   - http://localhost:3000/*\n" +
              "   - https://votre-domaine.com/*\n" +
              "4. Consultez docs/google-maps-setup.md pour plus de détails"
          );
        }
      }}
    >
      <BookingStep1SummaryContent {...props} />
    </LoadScript>
  );
}

