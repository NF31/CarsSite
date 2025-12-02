import { useEffect, useRef } from "react";
import { AUTocomplete_CONFIG } from "../constants";

interface UseGoogleMapsAutocompleteProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  enabled: boolean;
  onPlaceSelect: (displayName: string, placeId: string) => void;
  fieldName: string;
  placeIdFieldName: string;
}

export function useGoogleMapsAutocomplete({
  inputRef,
  enabled,
  onPlaceSelect,
  fieldName,
  placeIdFieldName,
}: UseGoogleMapsAutocompleteProps) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!enabled || !inputRef.current || typeof window === "undefined") {
      // Nettoyer l'autocomplete si désactivé
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      return;
    }

    // Vérifier si Google Maps est chargé
    if (!window.google?.maps?.places?.Autocomplete) {
      // Attendre que Google Maps soit chargé
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

      // Nettoyer l'autocomplete existant si présent
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      // Créer l'Autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: AUTocomplete_CONFIG.componentRestrictions,
          fields: [...AUTocomplete_CONFIG.fields],
          types: [...AUTocomplete_CONFIG.types],
        }
      );

      autocompleteRef.current = autocomplete;

      // Écouter la sélection d'un lieu
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place) {
          const displayName = place.formatted_address || "";
          const placeId = place.place_id || "";
          console.log(`[HomeSearchWidget] 🎯 Place selected for ${fieldName}:`, {
            displayName,
            placeId,
          });

          if (displayName) {
            onPlaceSelect(displayName, placeId);

            // Mettre à jour le champ caché
            const form = inputRef.current?.closest("form");
            if (form) {
              const hiddenInput = form.querySelector(
                `input[name="${fieldName}"]`
              ) as HTMLInputElement;
              if (hiddenInput) {
                hiddenInput.value = displayName;
              }
              const hiddenPlaceIdInput = form.querySelector(
                `input[name="${placeIdFieldName}"]`
              ) as HTMLInputElement;
              if (hiddenPlaceIdInput && placeId) {
                hiddenPlaceIdInput.value = placeId;
              }
            }
          }
        }
      });

      console.log(`[HomeSearchWidget] ✅ Autocomplete initialized for ${fieldName}`);
    }

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [enabled, inputRef, onPlaceSelect, fieldName, placeIdFieldName]);

  return autocompleteRef;
}

