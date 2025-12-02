export const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

export const AUTocomplete_CONFIG = {
  componentRestrictions: { country: "fr" },
  fields: ["formatted_address", "place_id", "geometry"] as const,
  types: ["geocode"] as const,
} as const;

export const SELECTED_CATEGORY = "cars" as const;

