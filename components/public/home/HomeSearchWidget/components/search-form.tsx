"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { SearchFormData } from "../types";
import { SELECTED_CATEGORY } from "../constants";
import { ErrorAlert } from "./error-alert";
import { LocationInput } from "./location-input";
import { ReturnLocationInput } from "./return-location-input";
import { DateTimeInput } from "./date-time-input";

interface SearchFormProps {
  formData: SearchFormData;
  errors: { message: string | null };
  onFormDataChange: (updates: Partial<SearchFormData>) => void;
  onStartDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onPickupValueChange: (value: string) => void;
  onReturnValueChange: (value: string) => void;
  onErrorDismiss: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  pickupInputRef: React.RefObject<HTMLInputElement | null>;
  returnInputRef: React.RefObject<HTMLInputElement | null>;
  minStartTime: string;
  todayDateString: string;
}

export function SearchForm({
  formData,
  errors,
  onFormDataChange,
  onStartDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onPickupValueChange,
  onReturnValueChange,
  onErrorDismiss,
  onSubmit,
  pickupInputRef,
  returnInputRef,
  minStartTime,
  todayDateString,
}: SearchFormProps) {
  return (
    <div className="w-full rounded-2xl sm:rounded-3xl border border-white/10 bg-white p-4 sm:p-6 md:p-8 text-slate-900 shadow-xl shadow-slate-950/10">
      <ErrorAlert message={errors.message} onDismiss={onErrorDismiss} />

      <form
        className="mt-4 sm:mt-6 space-y-4 sm:space-y-6"
        action="/vehicles"
        method="get"
        onSubmit={onSubmit}
      >
        {/* Champ caché pour la catégorie */}
        <input type="hidden" name="category" value={SELECTED_CATEGORY} />

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-[1.2fr_1fr] md:items-start">
          <div className="space-y-4">
            <LocationInput
              id="pickup"
              name="pickup"
              label="Retrait & retour"
              placeholder="Paris CDG Aéroport Terminal 2"
              value={formData.pickupValue}
              onChange={(value) => {
                onPickupValueChange(value);
                if (!value) {
                  onFormDataChange({ pickupPlaceId: "" });
                }
              }}
              inputRef={pickupInputRef}
              placeId={formData.pickupPlaceId}
              placeIdFieldName="pickupPlaceId"
              required
            />

            {formData.showDifferentReturn ? (
              <ReturnLocationInput
                id="returnLocation"
                name="returnLocation"
                placeholder="Lieu de retour différent"
                value={formData.returnValue}
                onChange={(value) => {
                  onReturnValueChange(value);
                  if (!value.trim()) {
                    onFormDataChange({ returnPlaceId: "" });
                  }
                }}
                inputRef={returnInputRef}
                placeId={formData.returnPlaceId}
                placeIdFieldName="returnPlaceId"
              />
            ) : null}

            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                onFormDataChange({ showDifferentReturn: !formData.showDifferentReturn })
              }
              className="flex items-center gap-2 text-sm font-medium text-primary h-auto p-0"
              aria-label={formData.showDifferentReturn
                ? "Annuler le lieu de retour différent"
                : "Ajouter un lieu de retour différent"}
            >
              <Plus className="h-3.5 w-3.5" />
              {formData.showDifferentReturn
                ? "Annuler le lieu de retour différent"
                : "Lieu de retour différent"}
            </Button>

            <Link
              href="/contact"
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              Appliquer un tarif entreprise
            </Link>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            <DateTimeInput
              dateLabel="Date de départ"
              dateId="start-date"
              dateName="startDate"
              dateValue={formData.startDate}
              dateMin={todayDateString}
              onDateChange={onStartDateChange}
              timeId="start-time"
              timeName="startTime"
              timeValue={formData.startTime}
              timeMin={minStartTime}
              onTimeChange={onStartTimeChange}
              dateRequired
            />

            <DateTimeInput
              dateLabel="Date de retour"
              dateId="end-date"
              dateName="endDate"
              dateValue={formData.endDate}
              dateMin={formData.startDate || todayDateString}
              onDateChange={(value) => {
                onFormDataChange({ endDate: value });
              }}
              timeId="end-time"
              timeName="endTime"
              timeValue={formData.endTime}
              onTimeChange={onEndTimeChange}
              dateRequired
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-11 sm:h-12 w-full rounded-lg sm:rounded-xl bg-primary text-primary-foreground text-sm sm:text-base font-semibold hover:bg-primary/90 md:w-auto md:px-8 lg:px-10"
          aria-label="Voir les véhicules disponibles"
        >
          Voir les véhicules
        </Button>
      </form>
    </div>
  );
}

