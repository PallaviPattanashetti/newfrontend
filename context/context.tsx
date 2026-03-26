"use client";
import { MapLocation, MapLocationContextType } from "../interfaces/mapinterfaces";
import { useState, useContext, createContext, ReactNode } from "react";

const MapLocationContext = createContext<MapLocationContextType|undefined>(undefined);

export function MapLocationProvider({children}:{children:ReactNode})
{
    const [maplocation, setMapLocation]= useState<MapLocation|null>(null);
    return(
    <MapLocationContext.Provider value={{maplocation, setMapLocation}}>
        {children}
    </MapLocationContext.Provider>
    );
}

export function useMapLocation()
{

    const context = useContext(MapLocationContext);
    if(context===undefined)
    {
        throw new Error("useMapLocation must be used within a MapLocationProvider")
    }
return context;
}