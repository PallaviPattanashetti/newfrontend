"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  DEFAULT_HELP_CATEGORIES,
  type HelpPost,
  type HelpPostType,
} from "@/interfaces/help-post-interfaces";
import {
  closeHelpPost,
  createHelpPost,
  deleteHelpPost,
  getHelpCategories,
  getHelpPosts,
  getMyHelpPosts,
  startHelpChat,
  updateHelpPost,
} from "@/lib/help-post-services";
import { checkToken } from "@/lib/user-services";

type CityLookupResult = {
  label: string;
  latitude: number;
  longitude: number;
};

const HELP_TYPE_LABELS: Record<HelpPostType, string> = {
  request: "Request Help",
  offer: "Offer Help",
};

const formatCategoryLabel = (category: string) =>
  category
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1).toLowerCase()}`)
    .join(" ");

const normalizePostType = (value: string | null): HelpPostType =>
  value === "offer" ? "offer" : "request";

const toNumberOrUndefined = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatDistance = (distanceKm: number | null) => {
  if (distanceKm === null || !Number.isFinite(distanceKm)) {
    return "Distance unavailable";
  }

  return `${distanceKm.toFixed(1)} km away`;
};

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function SubHelpPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryPostType = normalizePostType(searchParams.get("postType"));
  const rawQueryCategory = searchParams.get("category")?.trim().toLowerCase() ?? "home";
  const queryCategory = rawQueryCategory || "home";
  const isKnownCategory = DEFAULT_HELP_CATEGORIES.includes(
    queryCategory as (typeof DEFAULT_HELP_CATEGORIES)[number],
  );
  const initialSelectedCategory = isKnownCategory ? queryCategory : "other";
  const initialOtherCategory = !isKnownCategory && queryCategory !== "other" ? queryCategory : "";

  const [postType, setPostType] = useState<HelpPostType>(queryPostType);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialSelectedCategory);
  const [otherCategory, setOtherCategory] = useState(initialOtherCategory);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [categories, setCategories] = useState<string[]>([]);
  const [communityPosts, setCommunityPosts] = useState<HelpPost[]>([]);
  const [myPosts, setMyPosts] = useState<HelpPost[]>([]);

  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [cityResults, setCityResults] = useState<CityLookupResult[]>([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [citySearchError, setCitySearchError] = useState("");
  const [locationStatusMessage, setLocationStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectableCategories = useMemo(() => {
    const base = categories.length > 0 ? categories : [...DEFAULT_HELP_CATEGORIES];
    const unique = [...new Set(base.map((item) => item.toLowerCase()))];
    return [...unique, "other"];
  }, [categories]);

  const customOtherCategory = otherCategory.trim();
  const resolvedCategory = selectedCategory === "other" ? "other" : selectedCategory;

  const captureCurrentLocation = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationStatusMessage("Geolocation is not supported in this browser.");
      return;
    }

    setIsDetectingLocation(true);
    setLocationStatusMessage("Detecting your location...");

    const applyPosition = (position: GeolocationPosition) => {
      setLatitude(String(position.coords.latitude));
      setLongitude(String(position.coords.longitude));
      setLocationStatusMessage("Location captured.");
      setIsDetectingLocation(false);
    };

    const mapGeolocationError = (error: GeolocationPositionError) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          return "Location permission denied. Enable it in browser site settings.";
        case error.POSITION_UNAVAILABLE:
          return "Location unavailable. Check device/location services and try again.";
        case error.TIMEOUT:
          return "Location request timed out. Please retry.";
        default:
          return "Unable to detect location right now. Please retry.";
      }
    };

    const handleSecondaryFailure = (error: GeolocationPositionError) => {
      setLocationStatusMessage(mapGeolocationError(error));
      setIsDetectingLocation(false);
    };

    const handlePrimaryFailure = () => {
      // Retry with less strict options for devices/browsers that fail high-accuracy quickly.
      navigator.geolocation.getCurrentPosition(applyPosition, handleSecondaryFailure, {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 300000,
      });
    };

    navigator.geolocation.getCurrentPosition(
      applyPosition,
      handlePrimaryFailure,
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      },
    );
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLatitude("");
    setLongitude("");
    setEditingPostId(null);
    setErrorMessage("");
  };

  const syncQueryString = useCallback(
    (nextType: HelpPostType, nextCategory: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("postType", nextType);
      params.set("category", nextCategory);
      router.replace(`/pages/SubHelpPost?${params.toString()}`);
    },
    [router, searchParams],
  );

  const loadPosts = useCallback(async () => {
    setIsLoading(true);

    const [feed, mine] = await Promise.all([
      getHelpPosts({
        postType,
        category: resolvedCategory || undefined,
      }),
      getMyHelpPosts(),
    ]);

    setCommunityPosts(feed);
    setMyPosts(mine);
    setIsLoading(false);
  }, [postType, resolvedCategory]);

  useEffect(() => {
    if (!checkToken()) {
      router.push("/pages/Signin");
    }
  }, [router]);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPosts();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadPosts]);

  useEffect(() => {
    if (!latitude.trim() || !longitude.trim()) {
      const timer = window.setTimeout(() => {
        captureCurrentLocation();
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [captureCurrentLocation, latitude, longitude]);

  useEffect(() => {
    const query = citySearch.trim();
    if (query.length < 2) {
      setCityResults([]);
      setCitySearchError("");
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearchingCities(true);
      setCitySearchError("");

      const response = await fetch(`/api/geocode/cities?q=${encodeURIComponent(query)}`, {
        method: "GET",
      });

      if (!response.ok) {
        setIsSearchingCities(false);
        setCitySearchError("Unable to search cities right now.");
        setCityResults([]);
        return;
      }

      const payload = (await response.json()) as { data?: CityLookupResult[] };
      setCityResults(Array.isArray(payload.data) ? payload.data : []);
      setIsSearchingCities(false);
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [citySearch]);

  const startEditingPost = (post: HelpPost) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setDescription(post.description);
    setLatitude(post.latitude !== null ? String(post.latitude) : "");
    setLongitude(post.longitude !== null ? String(post.longitude) : "");
    setCitySearch("");
    setCityResults([]);
    setErrorMessage("");
    setSuccessMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectCityResult = (city: CityLookupResult) => {
    setCitySearch(city.label);
    setLatitude(String(city.latitude));
    setLongitude(String(city.longitude));
    setCityResults([]);
    setCitySearchError("");
    setLocationStatusMessage("Location set from selected city.");
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setErrorMessage("Title and description are required.");
      return;
    }

    if (!resolvedCategory) {
      setErrorMessage("Please select a category. For Other, enter a category name.");
      return;
    }

    if (selectedCategory === "other" && !customOtherCategory) {
      setErrorMessage("Please enter a custom category name when selecting Other.");
      return;
    }

    const latitudeValue = toNumberOrUndefined(latitude);
    const longitudeValue = toNumberOrUndefined(longitude);

    if (latitude.trim() && latitudeValue === undefined) {
      setErrorMessage("Latitude must be a valid number.");
      return;
    }

    if (longitude.trim() && longitudeValue === undefined) {
      setErrorMessage("Longitude must be a valid number.");
      return;
    }

    if (latitudeValue === undefined || longitudeValue === undefined) {
      setErrorMessage("Location is required. Please allow location access and retry.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (editingPostId) {
      const updatedPost = await updateHelpPost(editingPostId, {
        title: title.trim(),
        description: description.trim(),
        latitude: latitudeValue,
        longitude: longitudeValue,
      });

      setIsSubmitting(false);

      if (!updatedPost) {
        setErrorMessage("Unable to update this post.");
        return;
      }

      setSuccessMessage("Post updated.");
      resetForm();
      await loadPosts();
      return;
    }

    const descriptionForApi =
      selectedCategory === "other"
        ? `${description.trim()}\n\nCustom category: ${customOtherCategory}`
        : description.trim();

    const createResult = await createHelpPost({
      category: resolvedCategory,
      postType,
      title: title.trim(),
      description: descriptionForApi,
      latitude: latitudeValue,
      longitude: longitudeValue,
    });

    setIsSubmitting(false);

    if (!createResult.post) {
      const prefix = createResult.status ? `Create failed (${createResult.status}). ` : "";
      setErrorMessage(
        `${prefix}${createResult.message || "Unable to create your post. Please check your input and try again."}`,
      );
      return;
    }

    setSuccessMessage(`${HELP_TYPE_LABELS[postType]} post created.`);
    resetForm();
    router.push(`/pages/HelpPosts?postType=${postType}&category=${selectedCategory}`);
  };

  const handleDelete = async (postId: number) => {
    const success = await deleteHelpPost(postId);
    if (!success) {
      setErrorMessage("Could not delete this post.");
      return;
    }

    setSuccessMessage("Post deleted.");
    await loadPosts();
  };

  const handleClosePost = async (postId: number) => {
    const success = await closeHelpPost(postId);
    if (!success) {
      setErrorMessage("Could not close this post.");
      return;
    }

    setSuccessMessage("Post closed.");
    await loadPosts();
  };

  const handleMessageCreator = async (post: HelpPost) => {
    if (!post.creatorUsername) {
      setErrorMessage("Creator username missing. Cannot open chat.");
      return;
    }

    const response = await startHelpChat({
      helpPostId: post.id,
    });

    if (!response.thread) {
      setErrorMessage(response.message || "Unable to start chat for this post.");
      return;
    }

    router.push(`/pages/Message?contact=${encodeURIComponent(post.creatorUsername)}`);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-6"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-5xl bg-[#5F4F4F]/50 rounded-xl flex flex-col items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
          Help Posts
        </h1>
        <p className="mt-2 text-sm md:text-base text-white/90 text-center">
          Choose a type, choose a category, create your post, then manage it below.
        </p>
      </motion.div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-black/20 bg-white/55 p-4 backdrop-blur-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-3">Post Type</p>
          <div className="grid grid-cols-2 gap-3">
            {(["request", "offer"] as HelpPostType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setPostType(type);
                  syncQueryString(type, selectedCategory);
                }}
                className={`rounded-xl border px-3 py-3 text-sm font-bold transition-colors ${
                  postType === type
                    ? "bg-[#28a8af] text-white border-[#28a8af]"
                    : "bg-white/80 text-black border-black/25 hover:bg-white"
                }`}
              >
                {HELP_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/20 bg-white/55 p-4 backdrop-blur-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-3">Category</p>
          <div className="grid grid-cols-2 gap-2">
            {selectableCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setSelectedCategory(category);
                  syncQueryString(postType, category);
                }}
                className={`rounded-lg border px-2 py-2 text-xs md:text-sm font-semibold transition-colors ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white/80 text-black border-black/20 hover:bg-white"
                }`}
              >
                {formatCategoryLabel(category)}
              </button>
            ))}
          </div>
          {selectedCategory === "other" ? (
            <input
              value={otherCategory}
              onChange={(event) => setOtherCategory(event.target.value)}
              placeholder="Type your custom category"
              className="mt-3 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-blue-400"
            />
          ) : null}
        </div>
      </div>

      <div className="w-full max-w-5xl rounded-2xl bg-white/45 border border-black/20 p-5 md:p-6 backdrop-blur-sm mb-7">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
          {editingPostId ? "Edit Your Post" : "Create a New Post"}
        </h2>

        <div className="grid grid-cols-1 gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Post title"
            className="w-full rounded-xl border border-black/20 bg-white px-4 py-3 text-sm text-black outline-none focus:ring-2 focus:ring-[#28a8af]"
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe what you need or what you can offer"
            className="w-full h-32 rounded-xl border border-black/20 bg-white px-4 py-3 text-sm text-black outline-none resize-none focus:ring-2 focus:ring-[#28a8af]"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={latitude}
              readOnly
              placeholder="Latitude (required)"
              className="w-full rounded-xl border border-black/20 bg-white px-4 py-3 text-sm text-black outline-none focus:ring-2 focus:ring-[#28a8af]"
            />
            <input
              value={longitude}
              readOnly
              placeholder="Longitude (required)"
              className="w-full rounded-xl border border-black/20 bg-white px-4 py-3 text-sm text-black outline-none focus:ring-2 focus:ring-[#28a8af]"
            />
          </div>

          <div className="rounded-xl border border-black/15 bg-white/70 p-3">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-2">
              City Search (fills lat/lon)
            </label>
            <input
              value={citySearch}
              onChange={(event) => setCitySearch(event.target.value)}
              placeholder="Search city (e.g. San Jose, CA)"
              className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-blue-400"
            />

            {isSearchingCities ? <p className="mt-2 text-xs text-gray-600">Searching cities...</p> : null}
            {citySearchError ? <p className="mt-2 text-xs font-semibold text-red-700">{citySearchError}</p> : null}

            {cityResults.length > 0 ? (
              <ul className="mt-2 max-h-44 overflow-auto rounded-lg border border-black/15 bg-white">
                {cityResults.map((city) => (
                  <li key={`${city.label}-${city.latitude}-${city.longitude}`}>
                    <button
                      type="button"
                      onClick={() => selectCityResult(city)}
                      className="w-full px-3 py-2 text-left text-xs text-gray-800 hover:bg-blue-50"
                    >
                      {city.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={captureCurrentLocation}
              disabled={isDetectingLocation}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDetectingLocation ? "Detecting..." : "Use Current Location"}
            </button>
            <p className="text-xs font-medium text-gray-700">{locationStatusMessage || "Location is required for every post."}</p>
          </div>
        </div>

        {errorMessage ? <p className="mt-3 text-sm font-semibold text-red-700">{errorMessage}</p> : null}
        {successMessage ? <p className="mt-3 text-sm font-semibold text-green-700">{successMessage}</p> : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-[#28a8af] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#218e94] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : editingPostId ? "Save Changes" : "Submit Post"}
          </button>

          {editingPostId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl bg-gray-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-5 pb-12">
        <section className="rounded-2xl bg-white/45 border border-black/20 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Community Feed ({HELP_TYPE_LABELS[postType]} - {formatCategoryLabel(selectedCategory === "other" ? "other" : selectedCategory)})
          </h3>

          {isLoading ? <p className="text-sm text-gray-700">Loading posts...</p> : null}

          {!isLoading && communityPosts.length === 0 ? (
            <p className="text-sm text-gray-700">No open posts found for this filter yet.</p>
          ) : null}

          <AnimatePresence initial={false}>
            {communityPosts.map((post) => (
              <motion.article
                key={post.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-xl bg-white/80 border border-black/15 p-4 mb-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{post.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatCategoryLabel(post.category)} | {post.creatorName || post.creatorUsername} | {formatDistance(post.distanceKm)}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                      post.postType === "offer" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {post.postType === "offer" ? "OFFER" : "REQUEST"}
                  </span>
                </div>

                <p className="text-sm text-gray-800 mt-3">{post.description}</p>
                <p className="text-[11px] text-gray-600 mt-2">Posted {formatDateTime(post.createdAtUtc)}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleMessageCreator(post)}
                    className="rounded-lg bg-[#28a8af] px-3 py-2 text-xs font-bold text-white hover:bg-[#218e94]"
                  >
                    Message Creator
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </section>

        <section className="rounded-2xl bg-white/45 border border-black/20 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">My Posts</h3>

          {isLoading ? <p className="text-sm text-gray-700">Loading your posts...</p> : null}

          {!isLoading && myPosts.length === 0 ? (
            <p className="text-sm text-gray-700">You have not created any help posts yet.</p>
          ) : null}

          <AnimatePresence initial={false}>
            {myPosts.map((post) => (
              <motion.article
                key={post.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-xl bg-white/80 border border-black/15 p-4 mb-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{post.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatCategoryLabel(post.category)} | {post.isOpen ? "Open" : "Closed"}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                      post.postType === "offer" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {post.postType === "offer" ? "OFFER" : "REQUEST"}
                  </span>
                </div>

                <p className="text-sm text-gray-800 mt-3">{post.description}</p>
                <p className="text-[11px] text-gray-600 mt-2">Posted {formatDateTime(post.createdAtUtc)}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEditingPost(post)}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDelete(post.id)}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
                  >
                    Delete
                  </button>

                  {post.isOpen ? (
                    <button
                      type="button"
                      onClick={() => void handleClosePost(post.id)}
                      className="rounded-lg bg-gray-700 px-3 py-2 text-xs font-bold text-white hover:bg-gray-800"
                    >
                      Close Post
                    </button>
                  ) : null}
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
