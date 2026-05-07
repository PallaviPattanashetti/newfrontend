
"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import mapboxgl from "mapbox-gl";
import { useMapLocation } from "@/context/context";
import "mapbox-gl/dist/mapbox-gl.css";
import dynamic from "next/dynamic";
import { getDiscoverableProfiles } from "@/lib/user-services";
import { useRouter } from "next/navigation";

const SearchBox = dynamic(
  () => import("@mapbox/search-js-react").then((mod) => mod.SearchBox),
  { ssr: false },
);

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
mapboxgl.accessToken = MAPBOX_TOKEN;

const BG = `
  radial-gradient(ellipse at 15% 15%, #38bdf8 0%, transparent 50%),
  radial-gradient(ellipse at 85% 10%, #818cf8 0%, transparent 45%),
  radial-gradient(ellipse at 80% 85%, #34d399 0%, transparent 50%),
  radial-gradient(ellipse at 10% 80%, #fb923c 0%, transparent 45%),
  linear-gradient(160deg, #e0f2fe 0%, #bae6fd 60%, #7dd3fc 100%)
`;

const DEFAULT_COORDS: [number, number] = [-121.216, 37.797];

type NearbyUser = {
  id: string;
  profileName: string;
  username: string;
  profilePictureUrl: string;
  latitude: number;
  longitude: number;
  description: string;
};

export default function VolunteerMap() {
  const { maplocation } = useMapLocation();
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [myCoords, setMyCoords] = useState<[number, number] | null>(null);
  const [toCoords, setToCoords] = useState<[number, number] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [routeError, setRouteError] = useState("");
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Default location");

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const activeMarker = useRef<mapboxgl.Marker | null>(null);
  const myMarker = useRef<mapboxgl.Marker | null>(null);
  const toMarker = useRef<mapboxgl.Marker | null>(null);
  const userMarkers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => { setIsMounted(true); }, []);

  // Init map — unchanged
  useEffect(() => {
    if (!isMounted || !mapContainer.current || map.current) return;
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: DEFAULT_COORDS,
        zoom: 12,
      });
      map.current.on("load", () => { setMapLoaded(true); });
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    } catch (e) {
      console.error("Mapbox init error:", e);
    }
    return () => {
      if (map.current) { map.current.remove(); map.current = null; }
    };
  }, [isMounted]);

  
  useEffect(() => {
    if (maplocation && map.current) {
      setShowDetails(true);
      const timer = setTimeout(() => {
        map.current?.flyTo({
          center: [maplocation.long, maplocation.lat],
          zoom: 15,
          essential: true,
        });
        if (activeMarker.current) activeMarker.current.remove();
        activeMarker.current = new mapboxgl.Marker({ color: "#0369a1" })
          .setLngLat([maplocation.long, maplocation.lat])
          .addTo(map.current!);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [maplocation]);


  useEffect(() => {
    if (!isMounted) return;

    const applyCoords = (coords: [number, number], label: string) => {
      setMyCoords(coords);
      setLocationLabel(label);
      map.current?.flyTo({ center: coords, zoom: 13, essential: true });
      const tryPlace = () => {
        if (map.current) {
          placeMyMarker(coords);
          void loadNearbyUsers(coords[1], coords[0]);
        } else {
          setTimeout(tryPlace, 200);
        }
      };
      tryPlace();
    };

    const stored = localStorage.getItem("user-location");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.lat && parsed.long) {
          applyCoords([parsed.long, parsed.lat], "Stored location");
          return;
        }
      } catch {}
    }

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyCoords([pos.coords.longitude, pos.coords.latitude], "Your location"),
        () => applyCoords(DEFAULT_COORDS, "Default location"),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 },
      );
    } else {
      applyCoords(DEFAULT_COORDS, "Default location");
    }
  }, [isMounted]);


  useEffect(() => {
    if (mapLoaded && nearbyUsers.length > 0) placeUserMarkers(nearbyUsers);
  }, [mapLoaded, nearbyUsers]);


  useEffect(() => {
    if (myCoords && toCoords && mapLoaded) void drawRoute(myCoords, toCoords);
  }, [myCoords, toCoords, mapLoaded]);

  const loadNearbyUsers = async (lat: number, long: number) => {
    setIsLoadingUsers(true);
    try {
      const profiles = await getDiscoverableProfiles("", {
        skip: 0, take: 20, random: false, onlyComplete: true,
        latitude: lat, longitude: long,
      });
      const withCoords = profiles.filter(
        (p) => p.latitude !== null && p.latitude !== undefined &&
               p.longitude !== null && p.longitude !== undefined,
      ) as NearbyUser[];
      setNearbyUsers(withCoords);
      if (mapLoaded) placeUserMarkers(withCoords);
    } catch (e) {
      console.error("Failed to load nearby users", e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const placeMyMarker = (coords: [number, number]) => {
    if (!map.current) return;
    myMarker.current?.remove();
    const el = document.createElement("div");
    el.innerHTML = `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:#16a34a;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 10px rgba(0,0,0,0.3);"></div>`;
    myMarker.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
      .setLngLat(coords)
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText("You are here"))
      .addTo(map.current);
  };

  const placeToMarker = (coords: [number, number], label: string) => {
    if (!map.current) return;
    toMarker.current?.remove();
    const el = document.createElement("div");
    el.innerHTML = `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:#e11d48;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 10px rgba(0,0,0,0.3);"></div>`;
    toMarker.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
      .setLngLat(coords)
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(label))
      .addTo(map.current);
  };

  const placeUserMarkers = (users: NearbyUser[]) => {
    if (!map.current) return;
    userMarkers.current.forEach((m) => m.remove());
    userMarkers.current = [];

    users.forEach((user) => {
      const el = document.createElement("div");
      el.style.cssText = `width:40px;height:40px;border-radius:50%;border:3px solid #0369a1;overflow:hidden;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.25);background:#e0f2fe;`;

      if (user.profilePictureUrl) {
        const img = document.createElement("img");
        img.src = user.profilePictureUrl;
        img.style.cssText = "width:100%;height:100%;object-fit:cover;";
        el.appendChild(img);
      } else {
        el.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:#0369a1;">${(user.profileName || "?").slice(0, 2).toUpperCase()}</div>`;
      }

      el.addEventListener("click", () => {
        const dest: [number, number] = [user.longitude, user.latitude];
        setSelectedUser(user);
        setToCoords(dest);
        placeToMarker(dest, user.profileName);
        if (myCoords) void drawRoute(myCoords, dest);
        map.current?.flyTo({ center: dest, zoom: 14, essential: true });
      });

      
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="font-family:sans-serif;padding:4px;">
            <p style="font-weight:900;font-size:13px;margin:0;color:#1e3a5f;">${user.profileName}</p>
            <p style="font-size:11px;margin:2px 0 0;color:#0369a1;">@${user.username}</p>
            <p style="font-size:11px;margin:4px 0 0;color:#16a34a;font-weight:700;">Tap to get route</p>
          </div>
        `);

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([user.longitude, user.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      userMarkers.current.push(marker);
    });
  };

  const drawRoute = async (start: [number, number], end: [number, number]) => {
    setRouteError("");
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) { setRouteError("No route found."); return; }

      const route = data.routes[0];
      const distKm = `${(route.distance / 1000).toFixed(1)} km`;
      const durMin = `${Math.round(route.duration / 60)} min`;
      setRouteInfo({ distance: distKm, duration: durMin });

  
      if (selectedUser) {
        const markerIndex = nearbyUsers.findIndex((u) => u.id === selectedUser.id);
        const marker = userMarkers.current[markerIndex];
        if (marker) {
          marker.setPopup(
            new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
              <div style="font-family:sans-serif;padding:4px;">
                <p style="font-weight:900;font-size:13px;margin:0;color:#1e3a5f;">${selectedUser.profileName}</p>
                <p style="font-size:11px;margin:2px 0 0;color:#0369a1;">@${selectedUser.username}</p>
                <p style="font-size:11px;margin:4px 0 0;color:#16a34a;font-weight:700;">🚗 ${durMin} · 📏 ${distKm}</p>
              </div>
            `),
          );
          marker.togglePopup();
        }
      }

      if (!map.current) return;
      if (map.current.getLayer("route-outline")) map.current.removeLayer("route-outline");
      if (map.current.getLayer("route-line")) map.current.removeLayer("route-line");
      if (map.current.getSource("route")) map.current.removeSource("route");

      map.current.addSource("route", {
        type: "geojson",
        data: { type: "Feature", geometry: route.geometry, properties: {} },
      });
      map.current.addLayer({
        id: "route-outline", type: "line", source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.8 },
      });
      map.current.addLayer({
        id: "route-line", type: "line", source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#0369a1", "line-width": 5 },
      });

      const coords = route.geometry.coordinates as [number, number][];
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(coords[0], coords[0]),
      );
      map.current.fitBounds(bounds, { padding: 80, maxZoom: 15 });
    } catch (err) {
      console.error("Route error:", err);
      setRouteError("Failed to fetch route.");
    }
  };

  const clearRoute = () => {
    toMarker.current?.remove();
    toMarker.current = null;
    setToCoords(null);
    setRouteInfo(null);
    setRouteError("");
    setSelectedUser(null);
    if (map.current) {
      if (map.current.getLayer("route-outline")) map.current.removeLayer("route-outline");
      if (map.current.getLayer("route-line")) map.current.removeLayer("route-line");
      if (map.current.getSource("route")) map.current.removeSource("route");
    }
  };

  if (!isMounted) return null;

  return (
    <div
      className="min-h-screen flex flex-col items-center px-3 py-4 sm:px-4 sm:py-6 md:p-8"
      style={{ background: BG }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm sm:max-w-lg md:max-w-2xl backdrop-blur-md rounded-2xl flex flex-col items-center justify-center my-4 sm:my-6 md:my-8 p-4 sm:p-5 border border-white/50 shadow-sm gap-1"
        style={{ background: "rgba(255,255,255,0.45)" }}
      >
        <h1
          className="font-bold tracking-tight text-center uppercase"
          style={{ fontSize: "clamp(22px, 5vw, 40px)", color: "#0369a1" }}
        >
          Find Here
        </h1>
        <p className="text-[10px] sm:text-xs font-medium" style={{ color: "#1e3a5f80" }}>
          📍 {locationLabel}
        </p>
      </motion.div>

      <div
        className="w-full max-w-sm sm:max-w-lg md:max-w-3xl flex flex-col items-center mb-4 px-1 py-3 rounded-2xl border border-white/50 shadow-sm"
        style={{ background: "rgba(255,255,255,0.45)" }}
      >
        <SearchBox
          accessToken={MAPBOX_TOKEN}
          map={map.current as any}
          mapboxgl={mapboxgl}
          options={{ language: "en", country: "US" }}
          marker={true}
        />
      </div>

     
      <div
        className="w-full max-w-sm sm:max-w-2xl md:max-w-5xl border-4 sm:border-6 md:border-8 border-white rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl bg-white relative z-10"
        style={{ height: "clamp(280px, 50vw, 520px)" }}
      >
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        {isLoadingUsers && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full text-xs font-bold shadow-md"
            style={{ background: "rgba(255,255,255,0.92)", color: "#0369a1" }}
          >
            Loading nearby users...
          </div>
        )}
      </div>

    
      {(routeInfo || routeError || selectedUser) && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm sm:max-w-2xl md:max-w-5xl mt-3 rounded-2xl border border-white/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          style={{ background: "rgba(255,255,255,0.55)" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {selectedUser && (
              <div className="flex items-center gap-2">
                {/* Mini avatar */}
                <div
                  className="w-8 h-8 rounded-full overflow-hidden border-2 shrink-0"
                  style={{ borderColor: "#0369a1", background: "#e0f2fe" }}
                >
                  {selectedUser.profilePictureUrl ? (
                    <img src={selectedUser.profilePictureUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black" style={{ color: "#0369a1" }}>
                      {(selectedUser.profileName || "?").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold" style={{ color: "#1e3a5f" }}>
                  {selectedUser.profileName}
                </span>
              </div>
            )}
            {routeInfo && (
              <>
                <span className="px-3 py-1.5 rounded-full text-xs font-bold border border-white/60"
                  style={{ background: "rgba(3,105,161,0.1)", color: "#0369a1" }}>
                  🚗 {routeInfo.duration}
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-bold border border-white/60"
                  style={{ background: "rgba(3,105,161,0.1)", color: "#0369a1" }}>
                  📏 {routeInfo.distance}
                </span>
              </>
            )}
            {routeError && (
              <span className="text-xs font-semibold" style={{ color: "#dc2626" }}>{routeError}</span>
            )}
          </div>
          <div className="flex gap-2">
            {selectedUser && (
              <button
                onClick={() => router.push(`/pages/Message?contact=${encodeURIComponent(selectedUser.username)}`)}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white transition hover:opacity-90"
                style={{ background: "#0369a1" }}
              >
                Message
              </button>
            )}
            <button
              onClick={clearRoute}
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-white/50 transition hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.6)", color: "#1e3a5f" }}
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}

     
      <div
        className="w-full max-w-sm sm:max-w-lg md:max-w-3xl mt-4 rounded-xl border border-white/50 px-4 py-3 flex items-center gap-4 sm:gap-6 flex-wrap mb-4"
        style={{ background: "rgba(255,255,255,0.45)" }}
      >
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs font-bold" style={{ color: "#1e3a5f" }}>You</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-xs font-bold" style={{ color: "#1e3a5f" }}>Destination</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full border-2" style={{ borderColor: "#0369a1", background: "#e0f2fe" }} />
          <span className="text-xs font-bold" style={{ color: "#1e3a5f" }}>Nearby User</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-8 h-1 rounded-full" style={{ background: "#0369a1" }} />
          <span className="text-xs font-bold" style={{ color: "#1e3a5f" }}>Route</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] font-medium" style={{ color: "#1e3a5f80" }}>
            {nearbyUsers.length} nearby · tap a pin for route
          </span>
        </div>
      </div>
    </div>
  );
}









