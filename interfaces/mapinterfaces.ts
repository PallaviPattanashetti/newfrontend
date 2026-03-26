import { useState } from "react";
export interface MapLocation {
    id: number
    lat: number
    long: number
    title: string
    category: string


}
export interface MapLocationContextType {
    maplocation: MapLocation | null;

    setMapLocation: (location: MapLocation | null) => void;
}
