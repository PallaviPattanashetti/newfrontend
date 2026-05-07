"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  DiscoverableProfile,
  checkToken,
  getProfile,
  getDiscoverableProfiles,
} from "@/lib/user-services";
import { useRouter, useSearchParams } from "next/navigation";
import { getCityFromCoordinates } from "@/lib/mapServices";

const DEFAULT_IMAGE = "/assets/UserAccounts.jpeg";

const isSafeImageSrc = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") || trimmed.startsWith("data:")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const toKey = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const getCurrentUserIdentityKeys = (profile: Record<string, unknown> | null) => {
  if (!profile) return [] as string[];
  const candidates = [
    profile.id, profile.userId, profile.profileId, profile.username,
    profile.userName, profile.loginName, profile.email, profile.userEmail,
    profile.name, profile.displayName, profile.fullName, profile.profileName,
  ];
  const keys = candidates.map((value) => toKey(value)).filter((value) => Boolean(value));
  return [...new Set(keys)];
};

const filterOutCurrentUser = (profiles: DiscoverableProfile[], identityKeys: string[]) => {
  if (identityKeys.length === 0) return profiles;
  return profiles.filter((profile) => {
    const profileKeys = [toKey(profile.id), toKey(profile.profileName)].filter(Boolean);
    return !profileKeys.some((key) => identityKeys.includes(key));
  });
};

const loadDefaultProfiles = async (coords: { lat: number; long: number } | null) => {
  const nearbyProfiles = await getDiscoverableProfiles("", {
    skip: 0, take: 6, random: false, onlyComplete: true,
    latitude: coords?.lat, longitude: coords?.long,
  });
  if (nearbyProfiles.length > 0) return nearbyProfiles;
  return await getDiscoverableProfiles("", { skip: 0, take: 6, random: false, onlyComplete: true });
};

const BG = `
  radial-gradient(ellipse at 15% 15%, #38bdf8 0%, transparent 50%),
  radial-gradient(ellipse at 85% 10%, #818cf8 0%, transparent 45%),
  radial-gradient(ellipse at 80% 85%, #34d399 0%, transparent 50%),
  radial-gradient(ellipse at 10% 80%, #fb923c 0%, transparent 45%),
  linear-gradient(160deg, #e0f2fe 0%, #bae6fd 60%, #7dd3fc 100%)
`;

function PeoplePageContent() {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const querySearch = searchParams.get("q")?.trim() ?? "";
  const skipNextEmptySearchRef = useRef(false);
  const [visibleProfiles, setVisibleProfiles] = useState<DiscoverableProfile[]>([]);
  const [currentUserKeys, setCurrentUserKeys] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState(querySearch);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; long: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [profileCities, setProfileCities] = useState<Map<string, string>>(new Map());

  const hasQuery = useMemo(() => searchTerm.trim().length > 0, [searchTerm]);

  const requestLocation = () =>
    new Promise<{ lat: number; long: number } | null>((resolve) => {
      if (typeof window === "undefined" || !("geolocation" in navigator)) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const snapshot = { lat: position.coords.latitude, long: position.coords.longitude };
          localStorage.setItem("user-location", JSON.stringify({ ...snapshot, accuracy: position.coords.accuracy, capturedAt: Date.now() }));
          resolve(snapshot);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
      );
    });

  useEffect(() => {
    const initialize = async () => {
      if (!checkToken()) { push("/pages/Signin"); return; }
      setIsLoading(true);
      const currentProfile = await getProfile();
      const identityKeys = getCurrentUserIdentityKeys(currentProfile);
      setCurrentUserKeys(identityKeys);
      const coords = await requestLocation();
      setLocationCoords(coords);
      setError("");
      const profiles = await loadDefaultProfiles(coords);
      skipNextEmptySearchRef.current = true;
      setVisibleProfiles(filterOutCurrentUser(profiles, identityKeys));
      setIsLoading(false);
    };
    void initialize();
  }, [push]);

  useEffect(() => {
    if (querySearch) setSearchTerm(querySearch);
  }, [querySearch]);

  useEffect(() => {
    const debounceId = window.setTimeout(async () => {
      if (isLoading) return;
      if (!searchTerm.trim() && skipNextEmptySearchRef.current) {
        skipNextEmptySearchRef.current = false;
        return;
      }
      setIsRefreshing(true);
      setError("");
      const profiles = searchTerm.trim()
        ? await getDiscoverableProfiles(searchTerm, { skip: 0, take: 20, random: false, onlyComplete: true, latitude: locationCoords?.lat, longitude: locationCoords?.long })
        : await loadDefaultProfiles(locationCoords);
      setVisibleProfiles(filterOutCurrentUser(profiles, currentUserKeys));
      setIsRefreshing(false);
    }, 280);
    return () => window.clearTimeout(debounceId);
  }, [searchTerm, isLoading, locationCoords, currentUserKeys]);

  useEffect(() => {
    let isCancelled = false;
    const fetchCities = async () => {
      const newCities = new Map<string, string>();
      for (const profile of visibleProfiles) {
        if (profile.latitude !== undefined && profile.longitude !== undefined && profile.latitude !== null && profile.longitude !== null) {
          const city = await getCityFromCoordinates(profile.latitude, profile.longitude);
          if (!isCancelled) newCities.set(profile.id, city);
        }
      }
      if (!isCancelled) setProfileCities(newCities);
    };
    void fetchCities();
    return () => { isCancelled = true; };
  }, [visibleProfiles]);

  const refreshRandomUsers = async () => {
    setIsRefreshing(true);
    setError("");
    const profiles = await getDiscoverableProfiles("", { skip: 0, take: 6, random: true, onlyComplete: true });
    setVisibleProfiles(filterOutCurrentUser(profiles, currentUserKeys));
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center font-bold text-base sm:text-lg"
        style={{ background: BG, color: "#0369a1" }}
      >
        Loading nearby users...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-3 py-4 sm:px-4 sm:py-6 md:p-12 font-sans"
      style={{ background: BG }}
    >
      {/* Header */}
      <div
        className="w-full max-w-sm sm:max-w-lg md:max-w-3xl rounded-xl flex items-center justify-center my-4 sm:my-6 md:my-8 p-4 sm:p-5 border border-white/50 shadow-sm"
        style={{ background: "rgba(255,255,255,0.45)" }}
      >
        <h1
          className="font-bold tracking-tight text-center"
          style={{ fontSize: "clamp(22px, 5vw, 40px)", color: "#0369a1" }}
        >
          Nearby Users
        </h1>
      </div>

      {/* Search */}
      <div
        className="w-full max-w-sm sm:max-w-xl md:max-w-5xl p-3 sm:p-4 md:p-5 rounded-4xl shadow-xl border border-white/50 mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3"
        style={{ background: "rgba(255,255,255,0.35)" }}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by profile name or username..."
          className="w-full p-2.5 sm:p-3 border-none rounded-xl outline-none font-medium text-sm sm:text-base focus:ring-2 focus:ring-sky-400"
          style={{ background: "rgba(255,255,255,0.65)", color: "#1e3a5f" }}
        />
        <button
          onClick={refreshRandomUsers}
          className="w-full sm:w-auto sm:px-6 md:px-8 py-3 rounded-full font-bold text-sm shadow-lg transition-colors text-white hover:opacity-90"
          style={{ background: "#0369a1" }}
        >
          Refresh Users
        </button>
      </div>

      {error ? (
        <p className="px-4 py-2 rounded-xl mb-4 text-sm sm:text-base"
          style={{ background: "rgba(255,255,255,0.5)", color: "#dc2626" }}>
          {error}
        </p>
      ) : null}

      {isRefreshing ? (
        <p className="font-semibold mb-3 text-sm sm:text-base" style={{ color: "#0369a1" }}>
          Refreshing users...
        </p>
      ) : null}

      {/* Cards */}
      <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-sm sm:max-w-xl md:max-w-5xl">
        {visibleProfiles.length === 0 ? (
          <div
            className="p-6 sm:p-8 rounded-4xl shadow-xl border border-white/50 text-center font-semibold text-sm sm:text-base"
            style={{ background: "rgba(255,255,255,0.35)", color: "#1e3a5f" }}
          >
            {hasQuery
              ? "No users found for that profile name yet."
              : "No complete profiles found yet. Add profile name, image, and description."}
          </div>
        ) : (
          visibleProfiles.map((person, index) => (
            <motion.div
              key={`${person.id}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-center justify-between p-5 sm:p-6 md:p-8 rounded-4xl shadow-xl border border-white/50 gap-4 sm:gap-0"
              style={{ background: "rgba(255,255,255,0.35)" }}
            >
              {/* Avatar */}
              <div className="flex flex-col items-center space-y-2 sm:space-y-3 shrink-0 sm:w-32">
                <div
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 p-1 shadow-sm overflow-hidden"
                  style={{ borderColor: "#0369a1", background: "rgba(255,255,255,0.7)" }}
                >
                  <Image
                    src={isSafeImageSrc(person.profilePictureUrl) ? person.profilePictureUrl : DEFAULT_IMAGE}
                    alt={person.profileName}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 64px, 80px"
                    className="rounded-full object-cover"
                  />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-center leading-tight" style={{ color: "#1e3a5f" }}>
                  {person.profileName}
                </h3>
                <p className="text-xs text-center" style={{ color: "#0369a1" }}>
                  @{person.username}
                </p>
                {profileCities.get(person.id) && (
                  <p className="text-xs text-center" style={{ color: "#0369a1" }}>
                    📍 {profileCities.get(person.id)}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="flex-1 px-3 sm:px-6 md:px-12 py-0">
                <p
                  className="text-sm sm:text-base leading-relaxed text-center sm:text-left italic"
                  style={{ color: "#1e3a5f" }}
                >
                  &ldquo;{person.description}&rdquo;
                </p>
              </div>

              {/* Message button */}
              <div className="shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => push(`/pages/Message?contact=${encodeURIComponent(person.username)}`)}
                  className="w-full sm:px-8 md:px-10 py-3 rounded-full font-bold text-sm shadow-lg transition-colors text-white hover:opacity-90"
                  style={{ background: "#0369a1" }}
                >
                  Message
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full max-w-sm sm:max-w-xl md:max-w-4xl px-2"
      >
        <p
          className="mt-8 sm:mt-10 text-center italic font-medium"
          style={{ fontSize: "clamp(18px, 5vw, 40px)", color: "#1e3a5f" }}
        >
          &ldquo;Time is the longest distance between two people—let&apos;s bridge it.&rdquo;
        </p>
      </motion.div>
    </div>
  );
}

export default function People() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center font-bold text-base sm:text-lg"
          style={{ background: BG, color: "#0369a1" }}
        >
          Loading nearby users...
        </div>
      }
    >
      <PeoplePageContent />
    </Suspense>
  );
}





