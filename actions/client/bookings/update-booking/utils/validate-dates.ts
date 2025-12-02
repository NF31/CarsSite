/**
 * Valide les dates de modification de réservation
 */
export interface DateValidationResult {
  valid: boolean;
  error?: string;
}

export function validateBookingDates(
  startDate: Date | null,
  endDate: Date | null,
  now: Date = new Date()
): DateValidationResult {
  if (!startDate || !endDate) {
    return {
      valid: false,
      error: "Veuillez sélectionner des dates de début et de fin valides.",
    };
  }

  if (startDate <= now) {
    return {
      valid: false,
      error: "La nouvelle date de départ doit être dans le futur.",
    };
  }

  if (endDate <= startDate) {
    return {
      valid: false,
      error: "La date de fin doit être postérieure à la date de début.",
    };
  }

  return { valid: true };
}

