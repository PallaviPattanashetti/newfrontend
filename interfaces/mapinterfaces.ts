import { useState } from "react";
export interface MapLocation {
    id: number
    name:string
    lat: number
    long: number
    title: string
    category: string


}
export interface MapLocationContextType {
    maplocation: MapLocation | null;

    setMapLocation: (location: MapLocation | null) => void;
}
