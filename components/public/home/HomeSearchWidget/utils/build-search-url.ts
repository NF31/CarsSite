import type { SearchFormData } from "../types";
import { SELECTED_CATEGORY } from "../constants";

/**
 * Construit l'URL de recherche avec tous les paramètres du formulaire
 */
export function buildSearchUrl(formData: SearchFormData): string {
  const params = new URLSearchParams();

  // Catégorie
  params.set("category", SELECTED_CATEGORY);

  // Lieux - toujours envoyer pickup même si vide pour le debug
  if (formData.pickupValue && formData.pickupValue.length > 0) {
    params.set("pickup", formData.pickupValue);
  }
  if (formData.pickupPlaceId && formData.pickupPlaceId.length > 0) {
    params.set("pickupPlaceId", formData.pickupPlaceId);
  }

  // Lieu de retour
  const finalReturnValue = formData.showDifferentReturn
    ? formData.returnValue
    : formData.pickupValue;
  const finalReturnPlaceId = formData.showDifferentReturn
    ? formData.returnPlaceId
    : formData.pickupPlaceId;

  if (finalReturnValue && finalReturnValue.length > 0) {
    params.set("returnLocation", finalReturnValue);
  }
  if (finalReturnPlaceId && finalReturnPlaceId.length > 0) {
    params.set("returnPlaceId", finalReturnPlaceId);
  }

  // Dates
  if (formData.startDate) {
    params.set("startDate", formData.startDate);
  }
  if (formData.endDate) {
    params.set("endDate", formData.endDate);
  }
  if (formData.startTime) {
    params.set("startTime", formData.startTime);
  }
  if (formData.endTime) {
    params.set("endTime", formData.endTime);
  }

  return `/vehicles?${params.toString()}`;
}

