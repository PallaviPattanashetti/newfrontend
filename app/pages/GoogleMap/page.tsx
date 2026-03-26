

// "use client";
// import { useMapLocation } from "@/context/context";
// import React, { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { fetchMapLocation } from "@/dataservices/dataservices";

// export default function VolunteerMap() {
//   const { maplocation, setMapLocation } = useMapLocation();
//   const [isMounted, setIsMounted] = useState(false);
//   const [showDetails, setShowDetails] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [arrivalTime, setArrivalTime] = useState("");

  
//   const volunteer = {
//     name: "Ken Martinez",
//     phone: "1-800-829-1040",
//     etaMins: 18
//   };

//   useEffect(() => {
//     setIsMounted(true);
    
//     const now = new Date();
//     now.setMinutes(now.getMinutes() + volunteer.etaMins);
//     setArrivalTime(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
//   }, [showDetails]);

//   const handleLocate = async () => {
//     setIsLoading(true);
//     setTimeout(async () => {
//       const data = await fetchMapLocation("Manteca");
//       if (data && data.length > 0) {
//         setMapLocation(data[0]);
//         setShowDetails(true);
//       }
//       setIsLoading(false);
//     }, 1200);
//   };

//   if (!isMounted) return null;

//   return (
//     <div className="min-h-screen flex flex-col items-center p-4 bg-zinc-100 font-sans">
      
 
//       <div className="w-full max-w-5xl h-80 border-[8px] border-white rounded-[2rem] overflow-hidden shadow-xl bg-white mt-6">
//         <iframe
//           title="Map"
//           width="100%"
//           height="100%"
//           src={maplocation 
//             ? `https://www.openstreetmap.org/export/embed.html?bbox=${maplocation.long - 0.01}%2C${maplocation.lat - 0.01}%2C${maplocation.long + 0.01}%2C${maplocation.lat + 0.01}&layer=mapnik&marker=${maplocation.lat}%2C${maplocation.long}`
//             : "https://www.openstreetmap.org/export/embed.html?bbox=-121.3%2C37.7%2C-121.1%2C37.9&layer=mapnik"
//           }
//           className="grayscale-[30%] contrast-[110%]"
//         ></iframe>
//       </div>

     
//       <AnimatePresence>
//         {showDetails && (
//           <motion.div
//             initial={{ y: 30, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             className="w-full max-w-5xl bg-black text-white p-8 mt-8 rounded-[2.5rem] border-[6px] border-white shadow-2xl"
//           >
//             <div className="flex flex-col md:flex-row justify-between items-center gap-6">
//               <div className="text-center md:text-left">
//                 <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Volunteer Assigned</p>
//                 <h2 className="text-5xl font-black italic uppercase">{volunteer.name}</h2>
//                 <div className="inline-flex items-center gap-2 mt-3 bg-white text-black px-4 py-1 rounded-lg font-black text-lg">
//                   ETA: {volunteer.etaMins} MINS ({arrivalTime})
//                 </div>
//               </div>

//               <div className="flex gap-4 w-full md:w-auto">
          
//                 <a href={`tel:${volunteer.phone}`} className="flex-1 md:w-28 h-28 flex flex-col items-center justify-center bg-zinc-800 rounded-2xl border-2 border-white hover:bg-white hover:text-black transition-all">
//                   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
//                   <span className="text-[10px] font-bold mt-2 uppercase">Call</span>
//                 </a>

        
//                 <a 
//                   href={maplocation ? `https://www.google.com/maps/dir/?api=1&destination=${maplocation.lat},${maplocation.long}` : "#"} 
//                   target="_blank"
//                   className="flex-1 md:w-28 h-28 flex flex-col items-center justify-center bg-white text-black rounded-2xl border-2 border-white hover:bg-zinc-200 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]"
//                 >
//                   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
//                   <span className="text-[10px] font-bold mt-2 uppercase">Directions</span>
//                 </a>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

     
//       {!showDetails && (
//         <button 
//           onClick={handleLocate}
//           disabled={isLoading}
//           className="mt-10 px-12 py-5 bg-white text-black text-2xl font-black rounded-2xl border-b-[8px] border-zinc-400 active:translate-y-1 active:border-b-[2px] transition-all flex items-center gap-3"
//         >
//           {isLoading ? <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" /> : "Check Volunteer"}
//         </button>
//       )}
//     </div>
//   );
// }




"use client";

import { useMapLocation } from "@/context/context";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchMapLocation } from "@/lib/dataservices";

export default function VolunteerMap() {
  const { maplocation, setMapLocation } = useMapLocation();
  const [isMounted, setIsMounted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [arrivalTime, setArrivalTime] = useState("");

  const volunteer = {
    name: "Ken Martinez",
    phone: "1-800-829-1040",
    etaMins: 18
  };


  useEffect(() => {
    setIsMounted(true);
  }, []);


  useEffect(() => {
    if (showDetails) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + volunteer.etaMins);
      setArrivalTime(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    }
  }, [showDetails, volunteer.etaMins]);

  const handleLocate = async () => {
    setIsLoading(true);
    try {
    
      const data = await fetchMapLocation("Manteca");
      
      if (data && data.length > 0) {
        
        setMapLocation(data[0]);
        setShowDetails(true);
      } else {
        console.warn("No location data found.");
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-8"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}>
      
    
      <div className="w-full max-w-5xl h-80 border-8 border-white rounded-4xl overflow-hidden shadow-xl bg-white mt-6">
        <iframe
          title="Map"
          width="100%"
          height="100%"
          src={maplocation 
            ? `https://www.openstreetmap.org/export/embed.html?bbox=${maplocation.long - 0.01}%2C${maplocation.lat - 0.01}%2C${maplocation.long + 0.01}%2C${maplocation.lat + 0.01}&layer=mapnik&marker=${maplocation.lat}%2C${maplocation.long}`
            : "https://www.openstreetmap.org/export/embed.html?bbox=-121.3%2C37.7%2C-121.1%2C37.9&layer=mapnik"
          }
          className="grayscale-30 contrast-110"
        ></iframe>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="w-full max-w-5xl bg-black text-white p-8 mt-8 rounded-[2.5rem] border-[6px] border-white shadow-2xl"
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Volunteer Assigned</p>
                <h2 className="text-5xl font-black italic uppercase">{volunteer.name}</h2>
                <div className="inline-flex items-center gap-2 mt-3 bg-white text-black px-4 py-1 rounded-lg font-black text-lg">
                  ETA: {volunteer.etaMins} MINS ({arrivalTime})
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto">
               
                <a href={`tel:${volunteer.phone}`} className="flex-1 md:w-28 h-28 flex flex-col items-center justify-center bg-zinc-800 rounded-2xl border-2 border-white hover:bg-white hover:text-black transition-all">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span className="text-[10px] font-bold mt-2 uppercase">Call</span>
                </a>

              
                <a 
                  href={maplocation ? `https://www.google.com/maps/dir/?api=1&destination=${maplocation.lat},${maplocation.long}` : "#"} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:w-28 h-28 flex flex-col items-center justify-center bg-white text-black rounded-2xl border-2 border-white hover:bg-zinc-200 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                  <span className="text-[10px] font-bold mt-2 uppercase">Directions</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      
      {!showDetails && (
        <button 
          onClick={handleLocate}
          disabled={isLoading}
          className="mt-10 px-12 py-5 bg-white text-black text-2xl font-black rounded-2xl border-b-[8px] border-zinc-400 active:translate-y-1 active:border-b-[2px] transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {isLoading ? <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" /> : "Check Volunteer"}
        </button>
      )}
    </div>
  );
}