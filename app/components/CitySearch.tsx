"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type CityOption = {
  label: string;
  latitude: number;
  longitude: number;
};

type CitySearchProps = {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_USER_AGENT = "frontendtimebank/1.0 (city-search)";

export default function CitySearch({
  value,
  onChange,
  placeholder = "Search for a city...",
  className = "",
}: CitySearchProps) {
  const [suggestions, setSuggestions] = useState<CityOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: value,
          format: "jsonv2",
          featuretype: "city",
          addressdetails: "1",
          limit: "5",
        });

        const response = await fetch(`/api/geocode/cities?${params.toString()}`, {
          cache: "no-store",
        });

        if (response.ok) {
          const data = (await response.json()) as { data: CityOption[] };
          setSuggestions(data.data || []);
          setIsOpen(data.data && data.data.length > 0);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("City search error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handleSelectCity = (city: CityOption) => {
    onChange(city.label);
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`w-full p-3 bg-white/60 border-none rounded-xl focus:ring-2 focus:ring-[#28a8af] outline-none text-gray-800 font-medium ${className}`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#28a8af] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white/90 border border-black/10 rounded-xl shadow-lg z-50 overflow-hidden"
          >
            {suggestions.map((city, index) => (
              <button
                key={`${city.label}-${index}`}
                type="button"
                onClick={() => handleSelectCity(city)}
                className="w-full text-left px-4 py-3 hover:bg-[#28a8af]/10 transition-colors text-gray-800 font-medium text-sm border-b border-black/5 last:border-b-0"
              >
                {city.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
