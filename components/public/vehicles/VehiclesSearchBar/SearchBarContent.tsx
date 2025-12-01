"use client";

import { useRef } from "react";
import type { VehiclesSearchBarProps } from "./types";
import { useSearchForm } from "./hooks/use-search-form";
import { useGoogleMapsAutocomplete } from "./hooks/use-google-maps-autocomplete";
import { SearchFormMobile } from "./components/search-form-mobile";
import { SearchFormDesktop } from "./components/search-form-desktop";

export function SearchBarContent(props: VehiclesSearchBarProps) {
  const form = useSearchForm(props);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);

  useGoogleMapsAutocomplete({
    inputRef: pickupInputRef,
    enabled: true,
    onPlaceSelect: (displayName, placeId) => {
      form.setPickupValue(displayName);
      form.setPickupPlaceId(placeId);
    },
  });

  useGoogleMapsAutocomplete({
    inputRef: returnInputRef,
    enabled: form.showDifferentReturn,
    onPlaceSelect: (displayName, placeId) => {
      form.setReturnValue(displayName);
      form.setReturnPlaceId(placeId);
    },
  });

  const formData = {
    pickupValue: form.pickupValue,
    pickupPlaceId: form.pickupPlaceId,
    returnValue: form.returnValue,
    returnPlaceId: form.returnPlaceId,
    startDate: form.startDate,
    endDate: form.endDate,
    startTime: form.startTime,
    endTime: form.endTime,
    category: form.category,
    showDifferentReturn: form.showDifferentReturn,
  };

  return (
    <form
      onSubmit={form.handleSearch}
      className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm w-full max-w-full overflow-hidden"
    >
      <SearchFormMobile
        formData={formData}
        pickupInputRef={pickupInputRef}
        returnInputRef={returnInputRef}
        onPickupChange={form.setPickupValue}
        onPickupPlaceIdChange={form.setPickupPlaceId}
        onReturnChange={form.setReturnValue}
        onReturnPlaceIdChange={form.setReturnPlaceId}
        onStartDateChange={form.setStartDate}
        onEndDateChange={form.setEndDate}
        onStartTimeChange={form.setStartTime}
        onEndTimeChange={form.setEndTime}
        onToggleDifferentReturn={() => form.setShowDifferentReturn(!form.showDifferentReturn)}
        onSubmit={form.handleSearch}
      />
      <SearchFormDesktop
        formData={formData}
        pickupInputRef={pickupInputRef}
        returnInputRef={returnInputRef}
        onPickupChange={form.setPickupValue}
        onPickupPlaceIdChange={form.setPickupPlaceId}
        onReturnChange={form.setReturnValue}
        onReturnPlaceIdChange={form.setReturnPlaceId}
        onStartDateChange={form.setStartDate}
        onEndDateChange={form.setEndDate}
        onStartTimeChange={form.setStartTime}
        onEndTimeChange={form.setEndTime}
        onToggleDifferentReturn={() => form.setShowDifferentReturn(!form.showDifferentReturn)}
        onSubmit={form.handleSearch}
      />
    </form>
  );
}

