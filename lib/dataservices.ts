
import { MapLocation } from "@/interfaces/mapinterfaces";



export const fetchMapLocation = async (maplocation: string) => {
    console.log(maplocation);
    const response = await fetch("")
    const data: MapLocation[] = await response.json();
    return data;







}