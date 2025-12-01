"use client";

import { useMemo } from "react";
import { LoadScript } from "@react-google-maps/api";
import { VehicleSummaryCard } from "./components/vehicle-summary-card";
import { DatesLocationsCard } from "./components/dates-locations-card";
import { PriceSummaryCard } from "./components/price-summary-card";
import { AvailabilityErrorAlert } from "./components/availability-error-alert";
import { NavigationButtons } from "./components/navigation-buttons";
import { usePriceCalculation } from "./hooks/use-price-calculation";
import { useAvailabilityCheck } from "./hooks/use-availability-check";
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_ERROR_MESSAGE } from "./constants";
import type { BookingStep1SummaryProps } from "./types";

function BookingStep1SummaryContent({
  vehicle,
  bookingData,
  updateBookingData,
  onNext,
  canGoNext,
}: BookingStep1SummaryProps) {
  const { priceCalculation, isCalculatingPrice } = usePriceCalculation({
    vehicleId: vehicle.id,
    bookingData,
  });

  const { isCheckingAvailability, availabilityError, checkAvailability } = useAvailabilityCheck({
    vehicleId: vehicle.id,
    bookingData,
    onSuccess: onNext,
  });

  const handleNextClick = async () => {
    if (!canGoNext) {
      return;
    }
    await checkAvailability();
  };

  return (
    <div className="space-y-6">
      <VehicleSummaryCard vehicle={vehicle} />

      <DatesLocationsCard bookingData={bookingData} updateBookingData={updateBookingData} />

      {availabilityError && <AvailabilityErrorAlert error={availabilityError} />}

      {priceCalculation && <PriceSummaryCard priceCalculation={priceCalculation} />}

      <NavigationButtons
        onNext={handleNextClick}
        canGoNext={canGoNext}
        isCheckingAvailability={isCheckingAvailability}
        isCalculatingPrice={isCalculatingPrice}
      />
    </div>
  );
}

export function BookingStep1Summary(props: BookingStep1SummaryProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const libraries = useMemo(() => GOOGLE_MAPS_LIBRARIES, []);

  if (!apiKey) {
    return <BookingStep1SummaryContent {...props} />;
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={libraries}
      onError={(error) => {
        if (error?.message?.includes("RefererNotAllowedMapError")) {
          console.error(GOOGLE_MAPS_ERROR_MESSAGE);
        }
      }}
    >
      <BookingStep1SummaryContent {...props} />
    </LoadScript>
  );
}

