"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import mapboxgl from "mapbox-gl";
import { useMapLocation } from "@/context/context";






mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function VolunteerMap() {
  const { maplocation } = useMapLocation();
  const [showDetails, setShowDetails] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
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
      
        trackResize: true,


        

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
          duration: 2000,  
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

    
      <div className="w-full max-w-5xl h-96 border-8 border-white rounded-[2.5rem] overflow-hidden shadow-2xl bg-white relative z-10">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      </div>

      <AnimatePresence>
        {showDetails && maplocation && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="w-full max-w-5xl bg-white text-black p-8 mt-8 rounded-[2.5rem] border-[6px] border-white shadow-2xl z-20"
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                  Volunteer Found
                </p>
                <h2 className="text-5xl font-black italic uppercase leading-none">
                  {maplocation.name}
                </h2>
                <p className="mt-2 text-zinc-400 font-medium">
                  {maplocation.title}
                </p>
              </div>
              
              <button
                onClick={() => setShowDetails(false)}
                className="px-8 py-3 bg-white border-4 border-black rounded-2xl font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
