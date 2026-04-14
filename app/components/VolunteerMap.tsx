
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import mapboxgl from "mapbox-gl";
import { useMapLocation } from "@/context/context";

import "mapbox-gl/dist/mapbox-gl.css";
import { SearchBox } from "@mapbox/search-js-react";



const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function VolunteerMap() {
  const { maplocation } = useMapLocation();
  const [showDetails, setShowDetails] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
 
  const [accessToken, setAccessToken] = useState<string | null>(MAPBOX_TOKEN);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const activeMarker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-121.216, 37.797],
        zoom: 12,
      });

      map.current.on("load", () => {
        setMapLoaded(true); 
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    } catch (e) {
      console.error("Mapbox init error:", e);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
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
        activeMarker.current = new mapboxgl.Marker({ color: "#000000" })
          .setLngLat([maplocation.long, maplocation.lat])
          .addTo(map.current!);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [maplocation]);

  if (!isMounted) return null;

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-8"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-[#5F4F4F]/50 backdrop-blur-md rounded-xl flex items-center justify-center my-6 md:my-8 p-5 border border-white/20 shadow-sm"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center uppercase">
          Find Here
        </h1>
      </motion.div>

      <div className="w-full max-w-lg flex flex-col items-center mb-4">
       
        <SearchBox
          accessToken={MAPBOX_TOKEN}
          map={map.current as any}
          mapboxgl={mapboxgl}      
          options={{
            language: "en",
            country: "US",
          }}
          marker={true} 
        />
      </div>

      <div className="w-full max-w-5xl h-96 border-8 border-white rounded-[2.5rem] overflow-hidden shadow-2xl bg-white relative z-10">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      </div>

    </div>
  );
}