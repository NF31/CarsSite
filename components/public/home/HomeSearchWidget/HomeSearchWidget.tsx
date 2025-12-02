"use client";

import { useMemo } from "react";
import { LoadScript } from "@react-google-maps/api";
import { GOOGLE_MAPS_LIBRARIES } from "./constants";
import { useSearchForm } from "./hooks/use-search-form";
import { useGoogleMapsAutocomplete } from "./hooks/use-google-maps-autocomplete";
import { SearchForm } from "./components/search-form";

function SearchWidgetContent() {
  const form = useSearchForm();

  // Initialiser Autocomplete pour le pickup
  useGoogleMapsAutocomplete({
    inputRef: form.pickupInputRef,
    enabled: true,
    onPlaceSelect: (displayName, placeId) => {
      form.updateFormData({
        pickupValue: displayName,
        pickupPlaceId: placeId,
      });
    },
    fieldName: "pickup",
    placeIdFieldName: "pickupPlaceId",
  });

  // Initialiser Autocomplete pour le retour quand showDifferentReturn est true
  useGoogleMapsAutocomplete({
    inputRef: form.returnInputRef,
    enabled: form.formData.showDifferentReturn,
    onPlaceSelect: (displayName, placeId) => {
      form.updateFormData({
        returnValue: displayName,
        returnPlaceId: placeId,
      });
    },
    fieldName: "returnLocation",
    placeIdFieldName: "returnPlaceId",
  });

  return (
    <SearchForm
      formData={form.formData}
      errors={form.errors}
      onFormDataChange={form.updateFormData}
      onStartDateChange={form.handleStartDateChange}
      onStartTimeChange={form.handleStartTimeChange}
      onEndTimeChange={(value) => form.updateFormData({ endTime: value })}
      onPickupValueChange={(value) => form.updateFormData({ pickupValue: value })}
      onReturnValueChange={(value) => form.updateFormData({ returnValue: value })}
      onErrorDismiss={form.handleErrorDismiss}
      onSubmit={form.handleSubmit}
      pickupInputRef={form.pickupInputRef}
      returnInputRef={form.returnInputRef}
      minStartTime={form.minStartTime}
      todayDateString={form.todayDateString}
    />
  );
}

export function HomeSearchWidget() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Mémoriser le tableau de bibliothèques pour éviter les rechargements
  const libraries = useMemo(() => GOOGLE_MAPS_LIBRARIES, []);

  if (!apiKey) {
    return (
      <div className="w-full rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-xl shadow-slate-950/10 md:p-8">
        <p className="text-center text-muted-foreground">
          Clé API Google Maps non configurée. Veuillez configurer NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          dans votre fichier .env
        </p>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
      <SearchWidgetContent />
    </LoadScript>
  );
}

