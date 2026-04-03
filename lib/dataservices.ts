
import { MapLocation } from "@/interfaces/mapinterfaces";

const MAP_LOCATION_API = process.env.NEXT_PUBLIC_MAP_LOCATION_API?.trim();

const FALLBACK_LOCATIONS: MapLocation[] = [
    {
        id: 1,
        name: "Jose",
        lat: 34.0522,
        long: -118.2437,
        title: "Community Decor Helper",
        category: "Home Help",
    },
    {
        id: 2,
        name: "Ken",
        lat: 37.7749,
        long: -122.4194,
        title: "Debug Mentor",
        category: "Learning Help",
    },
    {
        id: 3,
        name: "Jacob",
        lat: 40.7128,
        long: -74.006,
        title: "Event Planning",
        category: "Creative Help",
    },
    {
        id: 4,
        name: "Isaiah",
        lat: 41.8781,
        long: -87.6298,
        title: "Community Organizer",
        category: "Home Help",
    },
];


export const fetchMapLocation = async (maplocation: string) => {
        const query = maplocation.trim().toLowerCase();

        if (!MAP_LOCATION_API) {
            return FALLBACK_LOCATIONS.filter((location) =>
                location.name.toLowerCase().includes(query)
            );
        }

        const endpoint = `${MAP_LOCATION_API}?q=${encodeURIComponent(maplocation)}`;
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Failed to fetch map location. HTTP ${response.status}`);
        }

        const data: MapLocation[] = await response.json();
        return query
            ? data.filter((location) => location.name.toLowerCase().includes(query))
            : data;







}