import { useState } from "react";
import { checkVehicleAvailabilityAction } from "@/actions/public/bookings/check-availability";
import type { BookingData } from "../types";
import { AVAILABILITY_ERROR_MESSAGES } from "../constants";

interface UseAvailabilityCheckProps {
  vehicleId: string;
  bookingData: BookingData;
  onSuccess: () => void;
}

export function useAvailabilityCheck({ vehicleId, bookingData, onSuccess }: UseAvailabilityCheckProps) {
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const checkAvailability = async () => {
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
        vehicleId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      if (result.success) {
        if (result.available) {
          // Disponible, continuer
          onSuccess();
        } else {
          // Indisponible, afficher l'erreur
          const reason = result.reason || "default";
          if (reason === "booking_conflict") {
            setAvailabilityError(
              AVAILABILITY_ERROR_MESSAGES.booking_conflict(result.conflict?.reference)
            );
          } else {
            setAvailabilityError(AVAILABILITY_ERROR_MESSAGES[reason] || AVAILABILITY_ERROR_MESSAGES.default);
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

  return {
    isCheckingAvailability,
    availabilityError,
    checkAvailability,
    clearError: () => setAvailabilityError(null),
  };
}

