"use client";

import { Button } from "@/components/ui/button";
import { LocationInput } from "./location-input";
import { DateTimeInput } from "./date-time-input";
import type { RefObject } from "react";
import type { SearchFormData } from "../types";
import { getTodayDateString } from "../utils/date-helpers";

type SearchFormMobileProps = {
  formData: SearchFormData;
  pickupInputRef: RefObject<HTMLInputElement | null>;
  returnInputRef: RefObject<HTMLInputElement | null>;
  onPickupChange: (value: string) => void;
  onPickupPlaceIdChange: (placeId: string) => void;
  onReturnChange: (value: string) => void;
  onReturnPlaceIdChange: (placeId: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onToggleDifferentReturn: () => void;
  onSubmit: (e?: React.FormEvent) => void;
};

export function SearchFormMobile({
  formData,
  pickupInputRef,
  returnInputRef,
  onPickupChange,
  onPickupPlaceIdChange,
  onReturnChange,
  onReturnPlaceIdChange,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onToggleDifferentReturn,
  onSubmit,
}: SearchFormMobileProps) {
  const todayDateString = getTodayDateString();
  const returnValue = formData.showDifferentReturn ? formData.returnValue : formData.pickupValue;
  const returnPlaceId = formData.showDifferentReturn ? formData.returnPlaceId : formData.pickupPlaceId;

  return (
    <div className="flex flex-col md:hidden space-y-4 w-full">
      {/* Lieu de retrait */}
      <div className="w-full min-w-0 flex-shrink-0">
        <LocationInput
          label="Lieu de retrait"
          placeholder="Paris CDG Aéroport"
          value={formData.pickupValue}
          onChange={onPickupChange}
          onPlaceIdChange={onPickupPlaceIdChange}
          inputRef={pickupInputRef}
          required
          labelClassName="text-sm text-muted-foreground mb-2 block font-semibold"
        />
        <input type="hidden" value={formData.pickupPlaceId} />
      </div>

      {/* Lieu de retour */}
      <div className="w-full min-w-0 flex-shrink-0">
        <LocationInput
          label="Lieu de retour"
          placeholder={formData.showDifferentReturn ? "Lieu de retour" : formData.pickupValue || "Même lieu que le retrait"}
          value={returnValue}
          onChange={onReturnChange}
          onPlaceIdChange={onReturnPlaceIdChange}
          inputRef={returnInputRef}
          disabled={!formData.showDifferentReturn}
          showHint={!formData.showDifferentReturn}
          hintText="(identique au retrait)"
          labelClassName="text-sm text-muted-foreground mb-2 block font-semibold"
          className="w-full"
        />
        <input type="hidden" value={returnPlaceId} />
      </div>

      {/* Dates */}
      <div className="w-full grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
        <DateTimeInput
          label="Départ"
          dateValue={formData.startDate}
          timeValue={formData.startTime}
          onDateChange={onStartDateChange}
          onTimeChange={onStartTimeChange}
          minDate={todayDateString}
          required
          labelClassName="text-sm text-muted-foreground mb-2 block font-semibold"
          className="w-full min-w-0 flex flex-col flex-shrink-0"
          isMobile
        />
        <DateTimeInput
          label="Retour"
          dateValue={formData.endDate}
          timeValue={formData.endTime}
          onDateChange={onEndDateChange}
          onTimeChange={onEndTimeChange}
          minDate={formData.startDate || todayDateString}
          required
          labelClassName="text-sm text-muted-foreground mb-2 block font-semibold"
          className="w-full min-w-0 flex flex-col flex-shrink-0"
          isMobile
        />
      </div>

      {/* Boutons */}
      <div className="w-full flex flex-col gap-2.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleDifferentReturn}
          className="text-sm h-10 text-primary w-full font-medium"
          aria-label={formData.showDifferentReturn ? "Utiliser le même lieu pour le retour" : "Utiliser un lieu différent pour le retour"}
        >
          {formData.showDifferentReturn ? "Même lieu" : "Lieu différent"}
        </Button>
        <Button type="submit" onClick={onSubmit} className="h-11 w-full text-sm font-semibold" size="sm" aria-label="Rechercher des véhicules disponibles">
          Rechercher
        </Button>
      </div>
    </div>
  );
}

