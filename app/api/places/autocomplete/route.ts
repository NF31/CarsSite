import { NextResponse } from "next/server";
import { getPlacesAutocomplete } from "@/lib/google-places";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("query");
  const sessionToken = searchParams.get("sessionToken") ?? undefined;
  const language = searchParams.get("language") ?? "fr";
  const components = searchParams.get("components") ?? "country:fr";
  const types = searchParams.get("types") ?? undefined;

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ predictions: [] });
  }

  try {
    const result = await getPlacesAutocomplete({
      input: query,
      sessionToken,
      language,
      components,
      types,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Google Places autocomplete error", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les suggestions." },
      { status: 500 },
    );
  }
}




