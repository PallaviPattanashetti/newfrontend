"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  if (!profile) {
    return [] as string[];
  }

  const candidates = [
    profile.id,
    profile.userId,
    profile.profileId,
    profile.username,
    profile.userName,
    profile.loginName,
    profile.email,
    profile.userEmail,
    profile.name,
    profile.displayName,
    profile.fullName,
    profile.profileName,
  ];

  const keys = candidates
    .map((value) => toKey(value))
    .filter((value) => Boolean(value));

  return [...new Set(keys)];
};

const filterOutCurrentUser = (
  profiles: DiscoverableProfile[],
  identityKeys: string[],
) => {
  if (identityKeys.length === 0) {
    return profiles;
  }

  return profiles.filter((profile) => {
    const profileKeys = [toKey(profile.id), toKey(profile.profileName)].filter(Boolean);
    return !profileKeys.some((key) => identityKeys.includes(key));
  });
};

const loadDefaultProfiles = async (
  coords: { lat: number; long: number } | null,
) => {
  const nearbyProfiles = await getDiscoverableProfiles("", {
    skip: 0,
    take: 6,
    random: false,
    onlyComplete: true,
    latitude: coords?.lat,
    longitude: coords?.long,
  });

  if (nearbyProfiles.length > 0) {
    return nearbyProfiles;
  }

  return await getDiscoverableProfiles("", {
    skip: 0,
    take: 6,
    random: false,
    onlyComplete: true,
  });
};

export default function People() {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const querySearch = searchParams.get("q")?.trim() ?? "";
  const skipNextEmptySearchRef = useRef(false);
  const [visibleProfiles, setVisibleProfiles] = useState<DiscoverableProfile[]>(
    [],
  );
  const [currentUserKeys, setCurrentUserKeys] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState(querySearch);
  const [locationCoords, setLocationCoords] = useState<{
    lat: number;
    long: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [profileCities, setProfileCities] = useState<Map<string, string>>(new Map());

  const hasQuery = useMemo(() => searchTerm.trim().length > 0, [searchTerm]);

  const requestLocation = () =>
    new Promise<{ lat: number; long: number } | null>((resolve) => {
      if (typeof window === "undefined" || !("geolocation" in navigator)) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const snapshot = {
            lat: position.coords.latitude,
            long: position.coords.longitude,
          };
          localStorage.setItem(
            "user-location",
            JSON.stringify({
              ...snapshot,
              accuracy: position.coords.accuracy,
              capturedAt: Date.now(),
            }),
          );
          resolve(snapshot);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
      );
    });

  useEffect(() => {
    const initialize = async () => {
      if (!checkToken()) {
        push("/pages/Signin");
        return;
      }

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
    if (querySearch) {
      setSearchTerm(querySearch);
    }
  }, [querySearch]);

  useEffect(() => {
    const debounceId = window.setTimeout(async () => {
      if (isLoading) {
        return;
      }

      if (!searchTerm.trim() && skipNextEmptySearchRef.current) {
        skipNextEmptySearchRef.current = false;
        return;
      }

      setIsRefreshing(true);
      setError("");
      const profiles = searchTerm.trim()
        ? await getDiscoverableProfiles(searchTerm, {
            skip: 0,
            take: 20,
            random: false,
            onlyComplete: true,
            latitude: locationCoords?.lat,
            longitude: locationCoords?.long,
          })
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
          if (!isCancelled) {
            newCities.set(profile.id, city);
          }
        }
      }

      if (!isCancelled) {
        setProfileCities(newCities);
      }
    };

    void fetchCities();

    return () => {
      isCancelled = true;
    };
  }, [visibleProfiles]);

  const refreshRandomUsers = async () => {
    setIsRefreshing(true);
    setError("");
    const profiles = await getDiscoverableProfiles("", {
      skip: 0,
      take: 6,
      random: true,
      onlyComplete: true,
    });
    setVisibleProfiles(filterOutCurrentUser(profiles, currentUserKeys));
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-white font-bold"
        style={{
          backgroundImage: "url('/assets/TBBackround.jpeg')",
          backgroundSize: "cover",
        }}
      >
        Loading nearby users...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-12 font-sans"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
      <div className="w-full max-w-87.5 bg-[#5F4F4F]/50 rounded-xl flex items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
          Nearby Users
        </h1>
      </div>

      <div className="w-full max-w-5xl bg-white/30 p-4 md:p-5 rounded-4xl shadow-xl border border-white/20 mb-6 flex flex-col md:flex-row gap-3 md:gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by profile name or username..."
          className="w-full p-3 bg-white/60 border-none rounded-xl focus:ring-2 focus:ring-[#28a8af] outline-none text-gray-800 font-medium"
        />
        <button
          onClick={refreshRandomUsers}
          className="w-full md:w-auto md:px-8 py-3.5 rounded-full bg-[#28a8af] text-white font-bold text-sm shadow-lg shadow-[#28a8af]/30 hover:bg-[#218e94] transition-colors"
        >
          Refresh Users
        </button>
      </div>

      {error ? (
        <p className="text-red-100 bg-black/30 px-4 py-2 rounded-xl mb-4">
          {error}
        </p>
      ) : null}

      {isRefreshing ? (
        <p className="text-white/90 font-semibold mb-3">Refreshing users...</p>
      ) : null}

      <div className="flex flex-col gap-6 w-full max-w-5xl">
        {visibleProfiles.length === 0 ? (
          <div className="bg-white/30 p-8 rounded-4xl shadow-xl border border-white/20 text-center text-gray-800 font-semibold">
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
              className="flex flex-col md:flex-row items-center justify-between bg-white/30 p-6 md:p-8 rounded-4xl shadow-xl border border-white/20"
            >
              <div className="flex flex-col items-center space-y-3 shrink-0 w-32">
                <div className="relative w-20 h-20 rounded-full border-2 border-[#28a8af] p-1 shadow-sm bg-white/70 overflow-hidden">
                  <Image
                    src={
                      isSafeImageSrc(person.profilePictureUrl)
                        ? person.profilePictureUrl
                        : DEFAULT_IMAGE
                    }
                    alt={person.profileName}
                    fill
                    unoptimized
                    sizes="80px"
                    className="rounded-full object-cover"
                  />
                </div>
                <h3 className="text-gray-900 font-bold text-base text-center leading-tight">
                  {person.profileName}
                </h3>
                <p className="text-gray-500 text-xs text-center">@{person.username}</p>
                {profileCities.get(person.id) && (
                  <p className="text-gray-600 text-xs text-center">
                    📍 {profileCities.get(person.id)}
                  </p>
                )}
              </div>

              <div className="flex-1 px-4 md:px-12 py-6 md:py-0">
                <p className="text-gray-500 text-sm md:text-base leading-relaxed text-center md:text-left italic">
                  &ldquo;{person.description}&rdquo;
                </p>
              </div>

              <div className="shrink-0 w-full md:w-auto">
                <button className="w-full md:px-10 py-3.5 rounded-full bg-[#28a8af] text-white font-bold text-sm shadow-lg shadow-[#28a8af]/30 hover:bg-[#218e94] transition-colors">
                  Message
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
     
        <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <p className="text-[30px] md:text-[40px] mt-10 text-black text-center italic font-medium">
                &ldquo; Time is the longest distance between two people—let’s bridge it.&rdquo;
              </p>
            </motion.div>
    </div>
  );
}
