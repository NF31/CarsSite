import { useState, useEffect } from "react";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import type { BookingData, PriceCalculation } from "../types";

interface UsePriceCalculationProps {
  vehicleId: string;
  bookingData: BookingData;
}

export function usePriceCalculation({ vehicleId, bookingData }: UsePriceCalculationProps) {
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

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
          vehicleId,
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
    vehicleId,
  ]);

  return { priceCalculation, isCalculatingPrice };
}

