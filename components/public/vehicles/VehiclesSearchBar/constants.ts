export const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

export const AUTocomplete_CONFIG = {
  componentRestrictions: { country: "fr" },
  fields: ["formatted_address", "place_id", "geometry"] as string[],
  types: ["geocode"] as string[],
};

