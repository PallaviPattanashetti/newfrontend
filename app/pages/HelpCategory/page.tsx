
"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export default function HelpCategory() {
  const router = useRouter();
  
  const [helpType, setHelpType] = useState<"get" | "offer" | null>(null);

  const topSectionImages = ["/assets/Offer.gif", "/assets/Get.gif"];

  const bottomCardData = [
    { img: "/assets/HomeHelp.gif", title: "Home Help", path: "./SubHelp" },
    { img: "/assets/LearningHelp.gif", title: "Learning Help", path: "./SubLearning" },
    { img: "/assets/GardenHelp.gif", title: "Garden Help", path: "./SubGarden" },
    { img: "/assets/PetHelp.gif", title: "Pet Help", path: "./SubPet" },
    { img: "/assets/creativeHelp.gif", title: "Creative Help", path: "./SubCreative" },
    { img: "/assets/FitnessHelp.gif", title: "Fitness Help", path: "./SubFitness" },
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-87.5 bg-[#5F4F4F]/50 rounded-xl flex items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
          Help Category
        </h1>
      </motion.div>

      <div
        className="w-full max-w-290 border-4 border-black flex flex-col md:flex-row items-center justify-center md:justify-between p-6 md:px-10 rounded-xl gap-8 mb-12"
        style={{ backgroundColor: "rgba(205, 146, 56, 0.08)" }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setHelpType("get")}
          className={`w-56 h-50.5 cursor-pointer transition-all duration-300 border-4 rounded-lg bg-white overflow-hidden flex flex-col ${
            helpType === "get" ? "border-blue-600 shadow-xl" : "border-black"
          }`}
        >
          <img src={topSectionImages[0]} alt="Get Help" className="w-full h-35 object-cover" />
          <div className="grow flex items-center justify-center bg-[#6F7887]/80 border-t-2 border-black font-bold uppercase text-black">
            Get Help
          </div>
        </motion.div>

        <div className="flex flex-col items-center justify-center">
          <p className="text-4xl md:text-[60px] font-bold text-black text-center px-4 leading-tight uppercase">
            {helpType === "get" ? "I Need Help" : helpType === "offer" ? "I Want to Help" : "Choose your help"}
          </p>
          {helpType && (
            <button onClick={() => setHelpType(null)} className="text-xs font-bold underline mt-2 text-black/60">
              BACK TO CHOOSE
            </button>
          )}
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setHelpType("offer")}
          className={`w-56 h-50.5 cursor-pointer transition-all duration-300 border-4 rounded-lg bg-white overflow-hidden flex flex-col ${
            helpType === "offer" ? "border-green-600 shadow-xl" : "border-black"
          }`}
        >
          <img src={topSectionImages[1]} alt="Offer Help" className="w-full h-35 object-cover" />
          <div className="grow flex items-center justify-center bg-[#6F7887]/80 border-t-2 border-black font-bold uppercase text-black">
            Offer Help
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 gap-y-12 w-full max-w-250 justify-items-center mb-12">
        {bottomCardData.map((item) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: helpType ? 1 : 0.3 }}
            className={`w-75 h-108 bg-[#F4F4F4]/50 border-2 rounded-2xl border-black flex flex-col transition-all ${
              !helpType ? "grayscale pointer-events-none" : ""
            }`}
          >
            <div className="w-full h-51.5 border-b-2 border-black overflow-hidden">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 flex flex-col items-center justify-between grow">
              <h5 className="text-xl font-bold text-gray-900 text-center uppercase">{item.title}</h5>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(item.path)}
                className={`w-47.5 h-15 border-[3px] border-black rounded-2xl text-black font-bold text-[36px] flex items-center justify-center ${
                  helpType === "get" ? "bg-blue-400" : "bg-green-400"
                }`}
              >
                Click
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
