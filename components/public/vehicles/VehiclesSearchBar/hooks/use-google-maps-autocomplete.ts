import { useEffect, useRef } from "react";
import { AUTocomplete_CONFIG } from "../constants";

type UseGoogleMapsAutocompleteOptions = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  enabled: boolean;
  onPlaceSelect: (displayName: string, placeId: string) => void;
};

export function useGoogleMapsAutocomplete({
  inputRef,
  enabled,
  onPlaceSelect,
}: UseGoogleMapsAutocompleteOptions) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!enabled || !inputRef.current || typeof window === "undefined") {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
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
        AUTocomplete_CONFIG
      );

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place) {
          const displayName = place.formatted_address || "";
          const placeId = place.place_id || "";
          if (displayName) {
            onPlaceSelect(displayName, placeId);
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
  }, [enabled, inputRef, onPlaceSelect]);

  return autocompleteRef;
}

