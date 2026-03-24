"use client";
import { useMapLocation } from "@/context/context";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchMapLocation } from "@/dataservices/dataservices";

export default function MapPage() {
  const { maplocation, setMapLocation } = useMapLocation();
  const [isMounted, setIsMounted] = useState(false);


  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleEnter = async () => {
    const data = await fetchMapLocation("Manteca");
    if (data && data.length > 0) {
      setMapLocation(data[0]);
    } else {
      console.log("No location found");
    }
  };

  if (!isMounted) return null;

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
     
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[#5F4F4F]/60 rounded-2xl p-6 mt-8 mb-8 border-2 border-black shadow-lg backdrop-blur-sm"
      >
        <h1 className="text-3xl md:text-5xl font-black text-black text-center uppercase tracking-tight">
          {maplocation ? `Welcome to ${maplocation.title}` : "Welcome"}
        </h1>
      </motion.div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-4xl h-96 border-[6px] border-black rounded-2xl overflow-hidden mb-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white"
      >
        <iframe
          title="Map"
          width="100%"
          height="100%"
          src={maplocation 
            ? `https://www.openstreetmap.org/export/embed.html?bbox=${maplocation.long - 0.02}%2C${maplocation.lat - 0.02}%2C${maplocation.long + 0.02}%2C${maplocation.lat + 0.02}&layer=mapnik&marker=${maplocation.lat}%2C${maplocation.long}`
            : "https://www.openstreetmap.org/export/embed.html?bbox=-110%2C-20%2C110%2C70&layer=mapnik"
          }
          className="grayscale-[20%] contrast-[110%]"
          style={{ border: "0" }}
        ></iframe>
      </motion.div>

      <motion.button 
        whileHover={{ scale: 1.05, backgroundColor: "#000", color: "#fff" }}
        whileTap={{ scale: 0.95 }}
        onClick={handleEnter} 
        className="px-12 py-4 bg-[#6F7887]/80 text-2xl font-black border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors"
      >
        ENTER
      </motion.button>

      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-2xl md:text-3xl font-bold text-center italic mt-10 text-black px-4 max-w-2xl">
          {maplocation 
            ? `Now showing: ${maplocation.category}` 
            : "Wherever you are, you have something to give."}
        </p>
      </motion.div>
    </div>
  );
}