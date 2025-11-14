"use client";

import { useMemo, useEffect, useState } from "react";
import { useLoadScript } from "@react-google-maps/api";

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const libraries = useMemo(() => GOOGLE_MAPS_LIBRARIES, []);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Vérifier si le script Google Maps est déjà chargé
  useEffect(() => {
    if (typeof window !== "undefined" && window.google?.maps) {
      setIsScriptLoaded(true);
    }
  }, []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || "",
    libraries,
    preventGoogleFontsLoading: true,
  });

  useEffect(() => {
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
    }
  }, [loadError]);

  // Si pas de clé API ou si le script est déjà chargé, retourner les enfants directement
  if (!apiKey || isScriptLoaded) {
    return <>{children}</>;
  }

  // Si le script est en cours de chargement ou chargé, retourner les enfants
  // Les composants enfants utiliseront useLoadScript ou vérifieront window.google
  return <>{children}</>;
}

