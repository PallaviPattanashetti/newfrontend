// "use client";

// import { useMapLocation } from "@/context/context";
// import React, { useState, useEffect, useCallback } from "react";
// import { fetchMapLocation } from "@/lib/dataservices";
// import { useSearchParams } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";

// export default function VolunteerMap() {
//   const searchParams = useSearchParams();
//   const volunteerName = searchParams.get("volunteer");
  
//   const { maplocation, setMapLocation } = useMapLocation();
  
//   const [showDetails, setShowDetails] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isMounted, setIsMounted] = useState(false);


//   useEffect(() => {
//     setIsMounted(true);
//   }, []);

//   const handleAutoSearch = useCallback(async (name: string) => {
//     setIsLoading(true);
//     try {
//       const data = await fetchMapLocation(name);
//       if (data && data.length > 0) {
//         setMapLocation(data[0]);
//         setShowDetails(true);
//       } else {
//         setShowDetails(false);
//       }
//     } catch (error) {
//       console.error("Search failed:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [setMapLocation]);

//   useEffect(() => {
//     if (volunteerName && isMounted) {
//       handleAutoSearch(volunteerName);
//     }
//   }, [volunteerName, isMounted, handleAutoSearch]);

//   if (!isMounted) return null;

//   return (
//     <div 
//       className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-8"
//       style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
//     >
   
//  <motion.div 
//         initial={{ y: -20, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         className="w-full max-w-87.5 bg-[#5F4F4F]/50 rounded-xl flex items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm"
//       >
//         <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
//           Find Here
//         </h1>
//       </motion.div>

//       <div className="w-full max-w-5xl h-80 border-8 border-white rounded-4xl overflow-hidden shadow-xl bg-white mt-6">
//         <iframe
//           title="Volunteer Location"
//           width="100%"
//           height="100%"
//           src={maplocation 
//             ? `}`
//             : ""
//           }
//           className="grayscale-30 contrast-110"
//         />
//       </div>


//       {isLoading && (
//         <div className="mt-4 flex items-center gap-2 text-white font-bold bg-black/50 px-4 py-2 rounded-full">
//           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//           Locating {volunteerName}...
//         </div>
//       )}


//       <AnimatePresence>
//         {showDetails && (
//           <motion.div
//             initial={{ y: 20, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             exit={{ y: 20, opacity: 0 }}
//             className="w-full max-w-5xl bg-white text-white p-8 mt-8 rounded-[2.5rem] border-[6px] border-white shadow-2xl"
//           >
//             <div className="flex flex-col md:flex-row justify-between items-center gap-6">
//               <div className="text-center md:text-left">
//                 <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Volunteer Found</p>
//                 <h2 className="text-5xl font-black italic uppercase">{volunteerName}</h2>
//                 <p className="mt-2 text-zinc-400">Location updated from search query.</p>
//               </div>
              
//               <button 
//                 onClick={() => setShowDetails(false)}
//                 className="px-6 py-2 border-2 border-white rounded-xl hover:bg-white hover:text-black transition-all"
//               >
//                 Close
//               </button>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
      
//     </div>
    
//   );

  
// }