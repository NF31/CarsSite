"use client";

import { useState, useEffect } from "react";
import { GetPublicVehicleByIdResult } from "@/actions/public/vehicles/get-by-id";
import { getPublicServicesAction, PublicService } from "@/actions/public/bookings/get-services";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BookingStep2ServicesProps {
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
  updateBookingData: (updates: Partial<BookingStep2ServicesProps["bookingData"]>) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
}

export function BookingStep2Services({
  vehicle,
  bookingData,
  updateBookingData,
  onNext,
  onPrevious,
  canGoNext,
}: BookingStep2ServicesProps) {
  const [services, setServices] = useState<PublicService[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
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

  // Charger les services disponibles
  useEffect(() => {
    const loadServices = async () => {
      setIsLoadingServices(true);
      setServicesError(null);

      try {
        const result = await getPublicServicesAction(vehicle.id);

        if (result.success && result.data) {
          setServices(result.data);
        } else {
          setServicesError(result.error || "Impossible de charger les services");
        }
      } catch (error) {
        console.error("Erreur lors du chargement des services", error);
        setServicesError("Erreur lors du chargement des services");
      } finally {
        setIsLoadingServices(false);
      }
    };

    loadServices();
  }, [vehicle.id]);

  // Calculer le prix quand les services changent
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

  const handleServiceToggle = (serviceId: string) => {
    const selectedIds = bookingData.selectedServiceIds;
    const isSelected = selectedIds.includes(serviceId);

    if (isSelected) {
      updateBookingData({
        selectedServiceIds: selectedIds.filter((id) => id !== serviceId),
      });
    } else {
      updateBookingData({
        selectedServiceIds: [...selectedIds, serviceId],
      });
    }
  };

  const formatServicePrice = (service: PublicService, days: number): string => {
    switch (service.pricingType) {
      case "PER_DAY":
        return `${service.price.toFixed(2)}€/jour (${(service.price * days).toFixed(2)}€)`;
      case "FIXED":
        return `${service.price.toFixed(2)}€ (forfait)`;
      case "PERCENTAGE":
        return `${service.price}% du prix du véhicule`;
      default:
        return `${service.price.toFixed(2)}€`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Liste des services */}
      {isLoadingServices ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : servicesError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{servicesError}</AlertDescription>
        </Alert>
      ) : services.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aucun service additionnel disponible pour ce véhicule
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {services.map((service) => {
            const isSelected = bookingData.selectedServiceIds.includes(service.id);
            const days = priceCalculation?.numberOfDays || 1;

            return (
              <Card
                key={service.id}
                className={`cursor-pointer transition-all ${
                  isSelected ? "border-primary ring-2 ring-primary" : "hover:border-primary/50"
                }`}
                onClick={() => handleServiceToggle(service.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleServiceToggle(service.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`service-${service.id}`}
                          className="font-semibold cursor-pointer"
                        >
                          {service.name}
                        </Label>
                        <span className="text-sm font-semibold text-primary">
                          {formatServicePrice(service, days)}
                        </span>
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Récapitulatif du prix */}
      {priceCalculation && (
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif</CardTitle>
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
      )}

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
            onNext();
          }}
          disabled={!canGoNext || isCalculatingPrice}
        >
          {isCalculatingPrice ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calcul en cours...
            </>
          ) : (
            "Suivant"
          )}
        </Button>
      </div>
    </div>
  );
}

