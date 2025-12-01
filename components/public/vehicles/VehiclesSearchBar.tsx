"use client";

import { LoadScript } from "@react-google-maps/api";
import { SearchBarContent } from "./VehiclesSearchBar/SearchBarContent";
import { GOOGLE_MAPS_LIBRARIES } from "./VehiclesSearchBar/constants";
import type { VehiclesSearchBarProps } from "./VehiclesSearchBar/types";

export function VehiclesSearchBar(props: VehiclesSearchBarProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return null;
  }

  return (
    <LoadScript 
      googleMapsApiKey={apiKey} 
      libraries={GOOGLE_MAPS_LIBRARIES}
      onError={(error) => {
        if (error?.message?.includes("RefererNotAllowedMapError")) {
          console.error(
            "⚠️ Erreur Google Maps: RefererNotAllowedMapError\n" +
            "Pour résoudre ce problème :\n" +
            "1. Allez dans Google Cloud Console > APIs & Services > Credentials\n" +
            "2. Sélectionnez votre clé API\n" +
            "3. Dans 'Application restrictions', ajoutez :\n" +
            "   - http://localhost:3000/*\n" +
            "   - https://votre-domaine.com/*\n" +
            "4. Consultez docs/google-maps-setup.md pour plus de détails"
          );
        }
      }}
    >
      <SearchBarContent {...props} />
    </LoadScript>
  );
}
