import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GetPublicVehicleByIdResult } from "@/actions/public/vehicles/get-by-id";
import { BookingStep4PaymentProps } from "../types";

interface BookingSummaryCardProps {
  vehicle: NonNullable<GetPublicVehicleByIdResult["data"]>;
  bookingData: BookingStep4PaymentProps["bookingData"];
}

export function BookingSummaryCard({ vehicle, bookingData }: BookingSummaryCardProps) {
  return (
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
  );
}

