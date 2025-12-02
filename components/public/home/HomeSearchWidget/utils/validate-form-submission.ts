import { getMinTimeForToday } from "./get-min-time-for-today";
import type { SearchFormData } from "../types";

/**
 * Valide la soumission du formulaire et retourne un message d'erreur si nécessaire
 */
export function validateFormSubmission(
  formData: SearchFormData,
  todayDateString: string
): string | null {
  // Validation finale : vérifier que la date/heure de départ n'est pas dans le passé
  if (formData.startDate === todayDateString) {
    const now = new Date();
    const [hours, minutes] = formData.startTime.split(":").map(Number);
    const selectedDateTime = new Date();
    selectedDateTime.setHours(hours, minutes, 0, 0);

    // Vérifier que l'heure n'est pas dans le passé (sans délai supplémentaire)
    if (selectedDateTime < now) {
      const minTime = getMinTimeForToday();
      return `L'heure de départ ne peut pas être dans le passé. Veuillez sélectionner une heure future (au moins ${minTime}).`;
    }
  }

  return null;
}

