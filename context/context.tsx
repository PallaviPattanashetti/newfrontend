"use client";

import React, { useState, useContext, createContext, ReactNode } from "react";
import {
  MapLocation,
  MapLocationContextType,
} from "../interfaces/mapinterfaces";

const MapLocationContext = createContext<MapLocationContextType | undefined>(
  undefined,
);

export function MapLocationProvider({ children }: { children: ReactNode }) {
  const [maplocation, setMapLocation] = useState<MapLocation | null>(null);

  const contextValue: MapLocationContextType = {
    maplocation,
    setMapLocation,
  };

  return (
    <MapLocationContext.Provider value={contextValue}>
      {children}
    </MapLocationContext.Provider>
  );
}

export function useMapLocation() {
  const context = useContext(MapLocationContext);
  if (!context) {
    throw new Error("useMapLocation must be used within a MapLocationProvider");
  }

  return context;
}
