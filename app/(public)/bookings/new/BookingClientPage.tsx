"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { GetPublicVehicleByIdResult } from "@/actions/public/vehicles/get-by-id";
import { getUserDataForBookingAction } from "@/actions/public/bookings/get-user-data";
import { BookingStep1Summary } from "@/components/public/bookings/BookingStep1Summary";
import { BookingStep2Services } from "@/components/public/bookings/BookingStep2Services";
import { BookingStep3Information } from "@/components/public/bookings/BookingStep3Information";
import { BookingStep4Payment } from "@/components/public/bookings/BookingStep4Payment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";

interface BookingClientPageProps {
  vehicle: GetPublicVehicleByIdResult["data"];
  initialStartDate?: string;
  initialEndDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialPickup?: string;
  initialReturnLocation?: string;
  initialPickupPlaceId?: string;
  initialReturnPlaceId?: string;
}

type BookingStep = 1 | 2 | 3 | 4;

interface BookingData {
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
  payNow: boolean; // Si true, payer l'acompte maintenant
}

const STEPS = [
  { number: 1, title: "Résumé", description: "Véhicule et dates" },
  { number: 2, title: "Services", description: "Options additionnelles" },
  { number: 3, title: "Informations", description: "Vos coordonnées" },
  { number: 4, title: "Paiement", description: "Finalisation" },
];

export function BookingClientPage({
  vehicle,
  initialStartDate = "",
  initialEndDate = "",
  initialStartTime = "",
  initialEndTime = "",
  initialPickup = "",
  initialReturnLocation = "",
  initialPickupPlaceId = "",
  initialReturnPlaceId = "",
}: BookingClientPageProps) {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    vehicleId: vehicle.id,
    startDate: initialStartDate,
    endDate: initialEndDate,
    startTime: initialStartTime,
    endTime: initialEndTime,
    pickup: initialPickup,
    returnLocation: initialReturnLocation,
    pickupPlaceId: initialPickupPlaceId,
    returnPlaceId: initialReturnPlaceId,
    selectedServiceIds: [],
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    driverLicenseUrl: undefined,
    acceptedTerms: false,
    payNow: false, // Par défaut, ne pas payer maintenant
  });
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [isTermsAlreadyAccepted, setIsTermsAlreadyAccepted] = useState(false);

         // Charger les données de l'utilisateur connecté dès le début
         useEffect(() => {
           const loadUserData = async () => {
             // Charger si l'utilisateur est connecté et que les données n'ont pas encore été chargées
             if (status === "authenticated" && session?.user && !userDataLoaded) {
               try {
                 const result = await getUserDataForBookingAction();
                 if (result.success && result.data) {
                   // Pré-remplir les données utilisateur seulement si elles ne sont pas déjà remplies
                   setBookingData((prev) => ({
                     ...prev,
                     customerName: prev.customerName || result.data!.name,
                     customerEmail: prev.customerEmail || result.data!.email,
                     customerPhone: prev.customerPhone || result.data!.phone || "",
                     driverLicenseUrl: prev.driverLicenseUrl || result.data!.driverLicenseUrl || undefined,
                     // Si l'utilisateur a déjà accepté les CGV, pré-remplir automatiquement
                     acceptedTerms: prev.acceptedTerms || result.data!.termsAccepted || false,
                   }));
                   setIsTermsAlreadyAccepted(result.data!.termsAccepted || false);
                   setUserDataLoaded(true);
                 }
               } catch (error) {
                 console.error("Erreur lors du chargement des données utilisateur", error);
               }
             }
           };

           loadUserData();
         }, [status, session, userDataLoaded]);

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => ((prev + 1) as BookingStep));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => ((prev - 1) as BookingStep));
    }
  };

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...updates }));
  };

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1:
        // Vérifier que les dates et lieux sont remplis
        // Pour l'instant, on accepte les lieux même sans placeId (on utilisera la location du véhicule par défaut)
        return (
          !!bookingData.startDate &&
          !!bookingData.endDate &&
          !!bookingData.startTime &&
          !!bookingData.endTime &&
          !!bookingData.pickup &&
          !!bookingData.returnLocation
        );
      case 2:
        // Toujours possible de passer à l'étape suivante (services optionnels)
        return true;
      case 3:
        // Vérifier que les informations client sont complètes
        // Si l'utilisateur a déjà accepté les CGV (isTermsAlreadyAccepted), on considère que acceptedTerms est vrai
        return (
          !!bookingData.customerName &&
          !!bookingData.customerEmail &&
          !!bookingData.customerPhone &&
          !!bookingData.driverLicenseUrl &&
          (bookingData.acceptedTerms || isTermsAlreadyAccepted)
        );
      case 4:
        // Pas de navigation depuis l'étape de paiement
        return false;
      default:
        return false;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* En-tête avec progression */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Réserver un véhicule</h1>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between items-center">
            {STEPS.map((step, index) => (
              <div
                key={step.number}
                className={`flex items-center ${
                  index < STEPS.length - 1 ? "flex-1" : ""
                }`}
              >
                <div
                  className={`flex flex-col items-center ${
                    step.number <= currentStep ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      step.number <= currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.number}
                  </div>
                  <span className="text-xs mt-1 font-medium">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu de l'étape actuelle */}
      <Card>
        <CardHeader>
          <CardTitle>
            Étape {currentStep} : {STEPS[currentStep - 1].title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {STEPS[currentStep - 1].description}
          </p>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <BookingStep1Summary
              vehicle={vehicle}
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              canGoNext={canGoNext()}
            />
          )}
          {currentStep === 2 && (
            <BookingStep2Services
              vehicle={vehicle}
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              canGoNext={canGoNext()}
            />
          )}
          {currentStep === 3 && (
            <BookingStep3Information
              vehicle={vehicle}
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              canGoNext={canGoNext()}
              isTermsAlreadyAccepted={isTermsAlreadyAccepted}
            />
          )}
          {currentStep === 4 && (
            <BookingStep4Payment
              vehicle={vehicle}
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onPrevious={handlePrevious}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

