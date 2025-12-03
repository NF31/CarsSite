"use client";

import { useMemo } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { SearchBarContent } from "./VehiclesSearchBar/SearchBarContent";
import { GOOGLE_MAPS_LIBRARIES } from "./VehiclesSearchBar/constants";
import type { VehiclesSearchBarProps } from "./VehiclesSearchBar/types";

export function VehiclesSearchBar(props: VehiclesSearchBarProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Mémoriser le tableau de bibliothèques pour éviter les rechargements
  const libraries = useMemo(() => GOOGLE_MAPS_LIBRARIES, []);

  // Utiliser useJsApiLoader au lieu de LoadScript pour éviter les chargements multiples
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
    libraries,
    preventGoogleFontsLoading: true,
  });

  if (!apiKey) {
    return null;
  }

  if (loadError) {
    if (loadError.message?.includes("RefererNotAllowedMapError")) {
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
    return null;
  }

  if (!isLoaded) {
    return null;
  }

  return <SearchBarContent {...props} />;
}
