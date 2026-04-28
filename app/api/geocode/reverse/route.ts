type NominatimReverseResult = {
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
  };
};

type CityResult = {
  city: string;
};

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_USER_AGENT = "frontendtimebank/1.0 (reverse-geocode; local-dev)";
const NOMINATIM_REFERER = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

export const GET = async (request: Request) => {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat")?.trim() ?? "";
    const lon = url.searchParams.get("lon")?.trim() ?? "";

    if (!lat || !lon) {
      return Response.json({ city: "Unknown Location" });
    }

    const upstreamUrl = new URL(NOMINATIM_REVERSE_URL);
    upstreamUrl.searchParams.set("lat", lat);
    upstreamUrl.searchParams.set("lon", lon);
    upstreamUrl.searchParams.set("format", "jsonv2");
    upstreamUrl.searchParams.set("addressdetails", "1");
    upstreamUrl.searchParams.set("zoom", "10");

    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": NOMINATIM_USER_AGENT,
        Referer: NOMINATIM_REFERER,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return Response.json({ city: "Unknown Location" });
    }

    const data = (await response.json()) as NominatimReverseResult;
    const address = data.address || {};

    // Prefer city > town > village > county
    const cityName =
      address.city || address.town || address.village || address.county || "Unknown Location";

    return Response.json({ city: cityName } as CityResult);
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return Response.json({ city: "Unknown Location" });
  }
};
