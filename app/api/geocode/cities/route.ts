type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
};

type CityLookupResult = {
  label: string;
  latitude: number;
  longitude: number;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_USER_AGENT = "frontendtimebank/1.0 (city-search; local-dev)";
const NOMINATIM_REFERER = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

export const GET = async (request: Request) => {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() ?? "";

    if (!query) {
      return Response.json({ data: [] as CityLookupResult[] });
    }

    const upstreamUrl = new URL(NOMINATIM_URL);
    upstreamUrl.searchParams.set("q", query);
    upstreamUrl.searchParams.set("format", "jsonv2");
    upstreamUrl.searchParams.set("addressdetails", "1");
    upstreamUrl.searchParams.set("limit", "7");

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
      const upstreamError = await response
        .text()
        .then((value) => value.slice(0, 200))
        .catch(() => "");

      return Response.json(
        {
          message: `Geocode provider rejected request (${response.status}).`,
          upstreamError,
          data: [] as CityLookupResult[],
        },
        { status: response.status },
      );
    }

    const payload = (await response.json()) as NominatimResult[];

    const results: CityLookupResult[] = payload
      .map((item) => ({
        label: item.display_name,
        latitude: Number(item.lat),
        longitude: Number(item.lon),
      }))
      .filter(
        (item) =>
          item.label.trim().length > 0 &&
          Number.isFinite(item.latitude) &&
          Number.isFinite(item.longitude),
      );

    return Response.json({ data: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to search city locations.";
    return Response.json({ message, data: [] as CityLookupResult[] }, { status: 500 });
  }
};
