export const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

export const PLACEHOLDER_IMAGE = "/placeholder-car.jpg";

export const GOOGLE_MAPS_ERROR_MESSAGE = `⚠️ Erreur Google Maps: RefererNotAllowedMapError
Pour résoudre ce problème :
1. Allez dans Google Cloud Console > APIs & Services > Credentials
2. Sélectionnez votre clé API
3. Dans 'Application restrictions', ajoutez :
   - http://localhost:3000/*
   - https://votre-domaine.com/*
4. Consultez docs/google-maps-setup.md pour plus de détails`;

export const AUTocomplete_CONFIG = {
  componentRestrictions: { country: "fr" },
  fields: ["formatted_address", "place_id", "geometry"] as const,
  types: ["geocode"] as const,
};

export const AVAILABILITY_ERROR_MESSAGES = {
  booking_conflict: (reference?: string) =>
    `Ce véhicule est déjà réservé pour cette période (référence: ${reference || "N/A"})`,
  maintenance_conflict: "Ce véhicule est en maintenance pour cette période",
  vehicle_unavailable: "Ce véhicule n'est pas disponible pour le moment",
  default: "Ce véhicule n'est pas disponible pour cette période",
} as const;

