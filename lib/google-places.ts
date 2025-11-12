const NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
  throw new Error("Missing environment variable NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.");
}

export interface PlacesAutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
}

interface GetPlacesAutocompleteOptions {
  input: string;
  sessionToken?: string;
  language?: string;
  components?: string;
  types?: string;
}

export async function getPlacesAutocomplete({
  input,
  sessionToken,
  language = "fr",
  components = "country:fr",
  types,
}: GetPlacesAutocompleteOptions): Promise<{
  predictions: PlacesAutocompletePrediction[];
}> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");

  url.searchParams.set("input", input);
  url.searchParams.set("key", NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  url.searchParams.set("language", language);
  url.searchParams.set("components", components);
  url.searchParams.set("radius", "25000");

  if (sessionToken) {
    url.searchParams.set("sessiontoken", sessionToken);
  }

  if (types) {
    url.searchParams.set("types", types);
  }

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error("[Google Places] HTTP error", response.status, await response.text());
    return { predictions: [] };
  }

  const data: {
    predictions?: PlacesAutocompletePrediction[];
    status?: string;
    error_message?: string;
  } = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("[Google Places] API error", data.status, data.error_message);
    return { predictions: [] };
  }

  return {
    predictions: data.predictions ?? [],
  };
}




