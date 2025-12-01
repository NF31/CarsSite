import { useState, useEffect } from "react";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import { PriceCalculation } from "../types";

interface UsePriceCalculatorProps {
  vehicleId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  selectedServiceIds: string[];
}

export function usePriceCalculator({
  vehicleId,
  startDate,
  endDate,
  startTime,
  endTime,
  selectedServiceIds,
}: UsePriceCalculatorProps) {
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  useEffect(() => {
    const calculatePrice = async () => {
      if (!startDate || !endDate || !startTime || !endTime) {
        setPriceCalculation(null);
        return;
      }

      setIsCalculatingPrice(true);
      try {
        const result = await calculateBookingPriceAction({
          vehicleId,
          startDate,
          endDate,
          startTime,
          endTime,
          serviceIds: selectedServiceIds,
        });

        if (result.success && result.data) {
          setPriceCalculation(result.data);
        } else {
          setPriceCalculation(null);
        }
      } catch (error) {
        setPriceCalculation(null);
      } finally {
        setIsCalculatingPrice(false);
      }
    };

    calculatePrice();
  }, [vehicleId, startDate, endDate, startTime, endTime, selectedServiceIds]);

  return { priceCalculation, isCalculatingPrice };
}

