
"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DEFAULT_HELP_CATEGORIES, type HelpPostType } from "@/interfaces/help-post-interfaces";
import { getHelpCategories } from "@/lib/help-post-services";

const CATEGORY_IMAGE_BY_KEY: Record<string, string> = {
  home: "/assets/HomeHelp.gif",
  learning: "/assets/LearningHelp.gif",
  garden: "/assets/GardenHelp.gif",
  pet: "/assets/PetHelp.gif",
  creative: "/assets/CreativeHelp.gif",
  fitness: "/assets/FitnessHelp.gif",
  other: "/assets/offer.gif",
};

const titleCase = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1).toLowerCase()}`)
    .join(" ");

export default function HelpCategory() {
  const router = useRouter();
  const [helpType, setHelpType] = useState<HelpPostType | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const topSectionImages = ["/assets/Get.gif", "/assets/offer.gif"];

  useEffect(() => {
    let isCancelled = false;

    const loadCategories = async () => {
      const apiCategories = await getHelpCategories();
      if (isCancelled) {
        return;
      }

      const merged = [...new Set([...DEFAULT_HELP_CATEGORIES, ...apiCategories.map((item) => item.toLowerCase())])];
      setCategories(merged);
    };

    void loadCategories();

    return () => {
      isCancelled = true;
    };
  }, []);

  const selectableCategories = useMemo(() => {
    const base = categories.length > 0 ? categories : [...DEFAULT_HELP_CATEGORIES];
    return [...base, "other"];
  }, [categories]);

  const openCreatePost = (category: string) => {
    if (!helpType) {
      return;
    }

    const params = new URLSearchParams({
      postType: helpType,
      category,
    });

    router.push(`/pages/SubHelpPost?${params.toString()}`);
  };

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
          onClick={() => setHelpType("request")}
          className={`w-56 h-50.5 cursor-pointer transition-all duration-300 border-4 rounded-lg bg-white overflow-hidden flex flex-col ${
            helpType === "request" ? "border-blue-600 shadow-xl" : "border-black"
          }`}
        >
          <div className="w-full h-35 overflow-hidden bg-gray-100">
            <img 
              src={topSectionImages[0]} 
              alt="Get Help" 
              className="w-full h-full object-cover object-center" 
            />
          </div>
          <div className="grow flex items-center justify-center bg-[#6F7887]/80 border-t-2 border-black font-bold uppercase text-black">
            Get Help
          </div>
        </motion.div>

        <div className="flex flex-col items-center justify-center">
          <p className="text-4xl md:text-[60px] font-bold text-black text-center px-4 leading-tight uppercase">
            {helpType === "request"
              ? "I Need Help"
              : helpType === "offer"
                ? "I Want to Help"
                : "Choose your help"}
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
          <div className="w-full h-35 overflow-hidden bg-gray-100">
            <img 
              src={topSectionImages[1]} 
              alt="Offer Help" 
              className="w-full h-full object-cover object-center" 
            />
          </div>
          <div className="grow flex items-center justify-center bg-[#6F7887]/80 border-t-2 border-black font-bold uppercase text-black">
            Offer Help
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 gap-y-12 w-full max-w-250 justify-items-center mb-12">
        {selectableCategories.map((category) => (
          <motion.div
            key={category}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: helpType ? 1 : 0.3 }}
            className={`w-75 h-108 bg-[#F4F4F4]/50 border-2 rounded-2xl border-black flex flex-col transition-all overflow-hidden ${
              !helpType ? "grayscale pointer-events-none" : ""
            }`}
          >
           
            <div className="w-full h-51.5 border-b-2 border-black overflow-hidden bg-white">
              <img 
                src={CATEGORY_IMAGE_BY_KEY[category] ?? "/assets/Get.gif"}
                alt={`${titleCase(category)} help`}
                className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-110" 
              />
            </div>
            
            <div className="p-4 flex flex-col items-center justify-between grow">
              <h5 className="text-xl font-bold text-gray-900 text-center uppercase">{titleCase(category)} Help</h5>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openCreatePost(category)}
                className={`w-47.5 h-15 border-[3px] border-black rounded-2xl text-black font-bold text-[36px] flex items-center justify-center transition-colors ${
                  helpType === "request" ? "bg-blue-400 hover:bg-blue-500" : "bg-green-400 hover:bg-green-500"
                }`}
              >
                Select
              </motion.button>
            </div>

            
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center"
        >
          <p className="text-[30px] md:text-[40px] mt-10 text-black text-center italic font-medium">
            &ldquo;Redefining wealth, one hour at a time.&rdquo;
          </p>
        </motion.div>
        
      </div>
      
    </div>
  );
}



