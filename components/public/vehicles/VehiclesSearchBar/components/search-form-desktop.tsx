"use client";

import { Button } from "@/components/ui/button";
import { LocationInput } from "./location-input";
import { DateTimeInput } from "./date-time-input";
import type { RefObject } from "react";
import type { SearchFormData } from "../types";
import { getTodayDateString } from "../utils/date-helpers";

type SearchFormDesktopProps = {
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

export function SearchFormDesktop({
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
}: SearchFormDesktopProps) {
  const todayDateString = getTodayDateString();
  const returnValue = formData.showDifferentReturn ? formData.returnValue : formData.pickupValue;
  const returnPlaceId = formData.showDifferentReturn ? formData.returnPlaceId : formData.pickupPlaceId;

  return (
    <div className="hidden md:grid md:grid-cols-12 md:gap-3 md:items-end w-full">
      {/* Lieu de retrait */}
      <div className={formData.showDifferentReturn ? "md:col-span-3" : "md:col-span-4"}>
        <LocationInput
          label="Lieu de retrait"
          placeholder="Paris CDG Aéroport"
          value={formData.pickupValue}
          onChange={onPickupChange}
          onPlaceIdChange={onPickupPlaceIdChange}
          inputRef={pickupInputRef}
          required
          labelClassName="text-xs text-muted-foreground mb-1 block"
        />
        <input type="hidden" value={formData.pickupPlaceId} />
      </div>

      {/* Lieu de retour */}
      <div className={formData.showDifferentReturn ? "md:col-span-3" : "md:col-span-4"}>
        <LocationInput
          label="Lieu de retour"
          placeholder={formData.showDifferentReturn ? "Lieu de retour" : formData.pickupValue || "Même lieu que le retrait"}
          value={returnValue}
          onChange={onReturnChange}
          onPlaceIdChange={onReturnPlaceIdChange}
          inputRef={returnInputRef}
          disabled={!formData.showDifferentReturn}
          showHint={!formData.showDifferentReturn}
          hintText="(identique)"
          labelClassName="text-xs text-muted-foreground mb-1 block"
        />
        <input type="hidden" value={returnPlaceId} />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2 lg:gap-3 md:col-span-4 min-w-0">
        <DateTimeInput
          label="Départ"
          dateValue={formData.startDate}
          timeValue={formData.startTime}
          onDateChange={onStartDateChange}
          onTimeChange={onStartTimeChange}
          minDate={todayDateString}
          required
          labelClassName="text-xs text-muted-foreground mb-1 block"
          className="min-w-0 flex flex-col flex-shrink-0"
        />
        <DateTimeInput
          label="Retour"
          dateValue={formData.endDate}
          timeValue={formData.endTime}
          onDateChange={onEndDateChange}
          onTimeChange={onEndTimeChange}
          minDate={formData.startDate || todayDateString}
          required
          labelClassName="text-xs text-muted-foreground mb-1 block"
          className="min-w-0 flex flex-col flex-shrink-0"
        />
      </div>

      {/* Boutons */}
      <div className={formData.showDifferentReturn ? "md:col-span-2" : "md:col-span-4 lg:col-span-2"}>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleDifferentReturn}
            className="text-xs h-9 text-primary w-full"
          >
            {formData.showDifferentReturn ? "Même lieu" : "Lieu différent"}
          </Button>
          <Button type="submit" onClick={onSubmit} className="h-10 w-full" size="sm">
            Rechercher
          </Button>
        </div>
      </div>
    </div>
  );
}

