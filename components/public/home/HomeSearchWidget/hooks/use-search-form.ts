import { useState, useMemo, useRef } from "react";
import type { SearchFormData, SearchFormErrors } from "../types";
import { getTodayDateString } from "../utils/get-today-date-string";
import { getMinTimeForToday } from "../utils/get-min-time-for-today";
import { buildSearchUrl } from "../utils/build-search-url";
import { validateFormSubmission } from "../utils/validate-form-submission";

export function useSearchForm() {
  const todayDateString = getTodayDateString();
  const [formData, setFormData] = useState<SearchFormData>({
    pickupValue: "",
    pickupPlaceId: "",
    returnValue: "",
    returnPlaceId: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    showDifferentReturn: false,
  });

  const [errors, setErrors] = useState<SearchFormErrors>({
    message: null,
  });

  const pickupInputRef = useRef<HTMLInputElement>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);

  // Calculer l'heure minimale pour aujourd'hui
  const isStartDateToday = formData.startDate === todayDateString;
  const minStartTime = useMemo(() => {
    return isStartDateToday ? getMinTimeForToday() : "00:00";
  }, [isStartDateToday]);

  const updateFormData = (updates: Partial<SearchFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleStartDateChange = (newDate: string) => {
    updateFormData({ startDate: newDate });
    setErrors({ message: null });

    // Si la nouvelle date est aujourd'hui et que l'heure sélectionnée est dans le passé, la réinitialiser
    if (newDate === todayDateString) {
      const minTime = getMinTimeForToday();
      if (formData.startTime < minTime) {
        updateFormData({ startTime: minTime });
      }
    }
  };

  const handleStartTimeChange = (newTime: string) => {
    setErrors({ message: null });

    // Valider que l'heure n'est pas dans le passé si la date est aujourd'hui
    if (isStartDateToday && newTime < minStartTime) {
      // Si l'heure est dans le passé, utiliser l'heure minimale
      updateFormData({ startTime: minStartTime });
    } else {
      updateFormData({ startTime: newTime });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    const validationError = validateFormSubmission(formData, todayDateString);
    if (validationError) {
      setErrors({ message: validationError });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Réinitialiser le message d'erreur si la validation passe
    setErrors({ message: null });

    const url = buildSearchUrl(formData);
    console.log("[HomeSearchWidget] Redirecting to:", url);

    // Rediriger vers la page des véhicules avec tous les paramètres
    window.location.href = url;
  };

  const handleErrorDismiss = () => {
    setErrors({ message: null });
  };

  return {
    formData,
    errors,
    updateFormData,
    handleStartDateChange,
    handleStartTimeChange,
    handleSubmit,
    handleErrorDismiss,
    pickupInputRef,
    returnInputRef,
    minStartTime,
    isStartDateToday,
    todayDateString,
  };
}

