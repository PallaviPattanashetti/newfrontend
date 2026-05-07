

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

const CATEGORY_ICON: Record<string, React.ReactElement> = {
  home: (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" stroke="#0369a1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 20L24 6l18 14v22H30V30h-12v12H6V20z" />
    </svg>
  ),
  learning: (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" stroke="#0369a1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l20-8 20 8-20 8-20-8z" />
      <path d="M44 12v14" />
      <path d="M12 17.5v12c0 4 5.4 7.5 12 7.5s12-3.5 12-7.5v-12" />
    </svg>
  ),
  garden: (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" stroke="#0369a1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 42V24" />
      <path d="M24 24C24 14 34 8 40 10c-2 6-8 12-16 14z" />
      <path d="M24 30C24 20 14 14 8 16c2 6 8 12 16 14z" />
      <path d="M10 42h28" />
    </svg>
  ),
  pet: (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" stroke="#0369a1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="24" cy="28" rx="12" ry="10" />
      <circle cx="12" cy="14" r="4" />
      <circle cx="36" cy="14" r="4" />
      <circle cx="17" cy="14" r="3" />
      <circle cx="31" cy="14" r="3" />
      <path d="M20 32c1 2 7 2 8 0" />
      <circle cx="21" cy="29" r="1" fill="#0369a1" />
      <circle cx="27" cy="29" r="1" fill="#0369a1" />
    </svg>
  ),
  creative: (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" stroke="#0369a1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 34l-4 4 4-14 14-4-4 14z" />
      <path d="M18 30l14-14" />
      <circle cx="36" cy="12" r="4" />
    </svg>
  ),
  fitness: (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" stroke="#0369a1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="20" width="8" height="8" rx="2" />
      <rect x="36" y="20" width="8" height="8" rx="2" />
      <rect x="12" y="16" width="6" height="16" rx="2" />
      <rect x="30" y="16" width="6" height="16" rx="2" />
      <line x1="18" y1="24" x2="30" y2="24" />
    </svg>
  ),
  other: (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" stroke="#0369a1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="18" />
      <path d="M24 16v8l6 4" />
    </svg>
  ),
};

const GET_HELP_ICON = (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 mx-auto mb-3" stroke="#0369a1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="32" cy="20" r="10" />
    <path d="M12 52c0-11 8-18 20-18s20 7 20 18" />
    <path d="M32 36v10M27 42h10" />
  </svg>
);

const OFFER_HELP_ICON = (
  <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 mx-auto mb-3" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="32" cy="20" r="10" />
    <path d="M12 52c0-11 8-18 20-18s20 7 20 18" />
    <path d="M26 42l4 4 8-8" />
  </svg>
);

const titleCase = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1).toLowerCase()}`)
    .join(" ");

const BG = `
  radial-gradient(ellipse at 15% 15%, #38bdf8 0%, transparent 50%),
  radial-gradient(ellipse at 85% 10%, #818cf8 0%, transparent 45%),
  radial-gradient(ellipse at 80% 85%, #34d399 0%, transparent 50%),
  radial-gradient(ellipse at 10% 80%, #fb923c 0%, transparent 45%),
  linear-gradient(160deg, #e0f2fe 0%, #bae6fd 60%, #7dd3fc 100%)
`;

export default function HelpCategory() {
  const router = useRouter();
  const [helpType, setHelpType] = useState<HelpPostType | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const topSectionImages = ["/assets/Get.gif", "/assets/offer.gif"];

  useEffect(() => {
    let isCancelled = false;
    const loadCategories = async () => {
      const apiCategories = await getHelpCategories();
      if (isCancelled) return;
      const merged = [...new Set([...DEFAULT_HELP_CATEGORIES, ...apiCategories.map((item) => item.toLowerCase())])];
      setCategories(merged);
    };
    void loadCategories();
    return () => { isCancelled = true; };
  }, []);

  const selectableCategories = useMemo(() => {
    const base = categories.length > 0 ? categories : [...DEFAULT_HELP_CATEGORIES];
    return [...base, "other"];
  }, [categories]);

  const openCreatePost = (category: string) => {
    if (!helpType) return;
    const params = new URLSearchParams({ postType: helpType, category });
    router.push(`/pages/SubHelpPost?${params.toString()}`);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center px-3 py-4 sm:px-4 sm:py-6 md:p-8"
      style={{ background: BG }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm sm:max-w-lg md:max-w-2xl rounded-2xl flex items-center justify-center my-4 sm:my-6 md:my-8 p-4 sm:p-5 border border-white/50 shadow-sm"
        style={{ background: "rgba(255,255,255,0.45)" }}
      >
        <h1
          className="font-bold tracking-tight text-center"
          style={{ fontSize: "clamp(22px, 5vw, 40px)", color: "#0369a1" }}
        >
          Help Category
        </h1>
      </motion.div>

      {/* Get / Offer  */}
      <div
        className="w-full max-w-sm sm:max-w-2xl md:max-w-3xl border border-white/60 flex flex-col sm:flex-row items-stretch justify-center gap-4 p-4 sm:p-6 rounded-2xl mb-8 sm:mb-12 shadow-md"
        style={{ background: "rgba(255,255,255,0.45)" }}
      >
        {/* Get Help */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setHelpType("request")}
          className={`flex-1 cursor-pointer rounded-xl p-5 flex flex-col items-center justify-center transition-all duration-200 border-2 ${
            helpType === "request"
              ? "border-blue-500 bg-blue-50/80 shadow-lg"
              : "border-white/60 bg-white/40 hover:bg-white/60"
          }`}
        >
          {GET_HELP_ICON}
          <p className="font-black uppercase tracking-widest text-sm" style={{ color: "#0369a1" }}>
            Get Help
          </p>
          <p className="text-xs mt-1 text-center" style={{ color: "#1e3a5f99" }}>
            I need someone to help me
          </p>
        </motion.div>

        {/* Center label */}
        <div className="flex flex-col items-center justify-center px-2 py-2 sm:py-0 min-w-[120px]">
          <p
            className="font-black text-center leading-tight uppercase"
            style={{ fontSize: "clamp(14px, 3vw, 22px)", color: "#1e3a5f" }}
          >
            {helpType === "request"
              ? "I Need Help"
              : helpType === "offer"
                ? "I Want to Help"
                : "Choose\nyour help"}
          </p>
          {helpType && (
            <button
              onClick={() => setHelpType(null)}
              className="text-[10px] font-bold underline mt-2 tracking-widest"
              style={{ color: "#0369a1" }}
            >
              RESET
            </button>
          )}
        </div>

        {/* Offer Help */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setHelpType("offer")}
          className={`flex-1 cursor-pointer rounded-xl p-5 flex flex-col items-center justify-center transition-all duration-200 border-2 ${
            helpType === "offer"
              ? "border-green-500 bg-green-50/80 shadow-lg"
              : "border-white/60 bg-white/40 hover:bg-white/60"
          }`}
        >
          {OFFER_HELP_ICON}
          <p className="font-black uppercase tracking-widest text-sm" style={{ color: "#16a34a" }}>
            Offer Help
          </p>
          <p className="text-xs mt-1 text-center" style={{ color: "#1e3a5f99" }}>
            I want to help someone
          </p>
        </motion.div>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 w-full max-w-sm sm:max-w-2xl lg:max-w-5xl mb-12">
        {selectableCategories.map((category) => (
          <motion.div
            key={category}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: helpType ? 1 : 0.3 }}
            className={`bg-white/50 border border-white/60 rounded-2xl flex flex-col items-center transition-all overflow-hidden shadow-sm ${
              !helpType ? "grayscale pointer-events-none" : "hover:shadow-md"
            }`}
          >
            {/* Icon area */}
            <div
              className="w-full flex items-center justify-center py-6 sm:py-8"
              style={{ background: "rgba(255,255,255,0.6)" }}
            >
              {CATEGORY_ICON[category] ?? CATEGORY_ICON.other}
            </div>

            {/* Label + button */}
            <div className="w-full p-3 sm:p-4 flex flex-col items-center gap-3 border-t border-white/40">
              <h5
                className="font-bold text-center uppercase tracking-wide"
                style={{ fontSize: "clamp(11px, 2.5vw, 15px)", color: "#1e3a5f" }}
              >
                {titleCase(category)}
              </h5>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => openCreatePost(category)}
                className={`w-full py-2.5 sm:py-3 rounded-xl text-white font-bold text-sm sm:text-base transition-colors shadow-sm ${
                  helpType === "request"
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                Select
              </motion.button>
            </div>
          </motion.div>
        ))}

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="col-span-2 lg:col-span-3 flex justify-center w-full px-2 mt-4"
        >
          <p
            className="text-center italic font-medium"
            style={{ fontSize: "clamp(16px, 4vw, 36px)", color: "#1e3a5f" }}
          >
            &ldquo;Redefining wealth, one hour at a time.&rdquo;
          </p>
        </motion.div>
      </div>
    </div>
  );
}
