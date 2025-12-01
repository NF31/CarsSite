import { useState, useEffect, startTransition } from "react";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import type { PriceCalculation } from "../types";
import { formatDateTimeLocal } from "../utils/helpers";

export function usePriceCalculation(
  open: boolean,
  startValue: string,
  endValue: string,
  vehicleId: string,
  serviceIds: string[],
  depositPaid: number,
  startDate: string,
  endDate: string
) {
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  useEffect(() => {
    if (!open) {
      setPriceCalculation(null);
      return;
    }
    startTransition(() => {
      setPriceCalculation(null);
    });
  }, [open, startDate, endDate]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const start = startValue ? new Date(startValue) : null;
    const end = endValue ? new Date(endValue) : null;

    if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
      setPriceCalculation(null);
      return;
    }

    if (end <= start) {
      setPriceCalculation(null);
      return;
    }

    const originalStart = formatDateTimeLocal(startDate);
    const originalEnd = formatDateTimeLocal(endDate);

    // Si les dates n'ont pas changé, ne pas calculer
    if (startValue === originalStart && endValue === originalEnd) {
      setPriceCalculation(null);
      return;
    }

    // Calculer le nouveau prix
    setIsCalculatingPrice(true);
    const calculatePrice = async () => {
      try {
        const startHours = start.getHours().toString().padStart(2, "0");
        const startMinutes = start.getMinutes().toString().padStart(2, "0");
        const endHours = end.getHours().toString().padStart(2, "0");
        const endMinutes = end.getMinutes().toString().padStart(2, "0");

        const result = await calculateBookingPriceAction({
          vehicleId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          startTime: `${startHours}:${startMinutes}`,
          endTime: `${endHours}:${endMinutes}`,
          serviceIds: serviceIds || [],
        });

        if (result.success && result.data) {
          const newTotalPrice = result.data.totalPrice;
          const newDownPayment = Math.round(newTotalPrice * 0.3 * 100) / 100;
          const newRemainingAmount = Math.round((newTotalPrice - newDownPayment) * 100) / 100;
          const depositDifference = newDownPayment - depositPaid;
          setPriceCalculation({
            totalPrice: newTotalPrice,
            remainingAmount: newRemainingAmount,
            newDownPayment,
            depositDifference,
          });
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
  }, [open, startValue, endValue, vehicleId, serviceIds, depositPaid, startDate, endDate]);

  return { priceCalculation, isCalculatingPrice };
}

