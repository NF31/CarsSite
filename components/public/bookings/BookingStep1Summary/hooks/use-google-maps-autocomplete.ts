import { useEffect } from "react";
import type { BookingData } from "../types";
import { AUTocomplete_CONFIG } from "../constants";

interface UseGoogleMapsAutocompleteProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  autocompleteRef: React.MutableRefObject<google.maps.places.Autocomplete | null>;
  fieldName: "pickup" | "returnLocation";
  placeIdFieldName: "pickupPlaceId" | "returnPlaceId";
  updateBookingData: (updates: Partial<BookingData>) => void;
}

export function useGoogleMapsAutocomplete({
  inputRef,
  autocompleteRef,
  fieldName,
  placeIdFieldName,
  updateBookingData,
}: UseGoogleMapsAutocompleteProps) {
  useEffect(() => {
    if (!inputRef.current || typeof window === "undefined") {
      return;
    }

    if (!window.google?.maps?.places?.Autocomplete) {
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete && inputRef.current) {
          clearInterval(checkGoogleMaps);
          initializeAutocomplete();
        }
      }, 100);
      return () => clearInterval(checkGoogleMaps);
    }

    initializeAutocomplete();

    function initializeAutocomplete() {
      if (!inputRef.current || !window.google?.maps?.places?.Autocomplete) {
        return;
      }

      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: AUTocomplete_CONFIG.componentRestrictions,
          fields: [...AUTocomplete_CONFIG.fields],
          types: [...AUTocomplete_CONFIG.types],
        }
      );

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place) {
          const displayName = place.formatted_address || "";
          const placeId = place.place_id || "";
          if (displayName) {
            updateBookingData({
              [fieldName]: displayName,
              [placeIdFieldName]: placeId,
            });
          }
        }
      });
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [inputRef, autocompleteRef, fieldName, placeIdFieldName, updateBookingData]);
}

