"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { BookingStep4PaymentProps } from "./BookingStep4Payment/types";
import { usePriceCalculator } from "./BookingStep4Payment/handlers/price-calculator";
import { useBookingCreator } from "./BookingStep4Payment/handlers/booking-creator";
import { BookingSummaryCard } from "./BookingStep4Payment/components/booking-summary-card";
import { PriceDetailsCard } from "./BookingStep4Payment/components/price-details-card";
import { PaymentOptionsCard } from "./BookingStep4Payment/components/payment-options-card";
import { NavigationButtons } from "./BookingStep4Payment/components/navigation-buttons";

export function BookingStep4Payment({
  vehicle,
  bookingData,
  updateBookingData,
  onPrevious,
  existingBookingId,
}: BookingStep4PaymentProps) {
  const { priceCalculation, isCalculatingPrice } = usePriceCalculator({
    vehicleId: vehicle.id,
    startDate: bookingData.startDate,
    endDate: bookingData.endDate,
    startTime: bookingData.startTime,
    endTime: bookingData.endTime,
    selectedServiceIds: bookingData.selectedServiceIds,
  });

  const { handleCreateBooking, isCreatingBooking, createError } = useBookingCreator({
    bookingData,
    existingBookingId,
  });

  if (!vehicle) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <BookingSummaryCard vehicle={vehicle} bookingData={bookingData} />

      <PriceDetailsCard priceCalculation={priceCalculation} isCalculatingPrice={isCalculatingPrice} />

      {createError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{createError}</AlertDescription>
        </Alert>
      )}

      <PaymentOptionsCard
        bookingData={bookingData}
        priceCalculation={priceCalculation}
        existingBookingId={existingBookingId}
        updateBookingData={updateBookingData}
      />

      <NavigationButtons
        bookingData={bookingData}
        priceCalculation={priceCalculation}
        existingBookingId={existingBookingId}
        isCreatingBooking={isCreatingBooking}
        isCalculatingPrice={isCalculatingPrice}
        onPrevious={onPrevious}
        onCreateBooking={handleCreateBooking}
      />
    </div>
  );
}
