
import { MapLocation } from "@/interfaces/mapinterfaces";

const MAP_LOCATION_API = process.env.NEXT_PUBLIC_MAP_LOCATION_API?.trim();

const FALLBACK_LOCATIONS: MapLocation[] = [
    { id: 1, name: "Jose", lat: 37.797, long: -121.216, title: "Community Decor", category: "Home Help" },
    { id: 2, name: "Ken", lat: 37.800, long: -121.220, title: "Debug Mentor", category: "Learning Help" }
];

export const fetchMapLocation = async (queryText: string = ""): Promise<MapLocation[]> => {
    if (!MAP_LOCATION_API) return FALLBACK_LOCATIONS;

    try {
        const endpoint = `${MAP_LOCATION_API}?q=${encodeURIComponent(queryText)}`;
        const response = await fetch(endpoint, { cache: "no-store" });
        
        if (!response.ok) return FALLBACK_LOCATIONS;

        return await response.json();
    } catch (error) {
        console.error("API connection failed:", error);
        return FALLBACK_LOCATIONS; 
    }
};