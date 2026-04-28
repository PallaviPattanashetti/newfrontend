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
  deleteHelpPost,
  getHelpCategories,
  getHelpPosts,
  getMyHelpPosts,
  startHelpChat,
} from "@/lib/help-post-services";
import { checkToken } from "@/lib/user-services";
import { getCityFromCoordinates } from "@/lib/mapServices";

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

export default function HelpPostsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryPostType = normalizePostType(searchParams.get("postType"));
  const isViewingAll = searchParams.get("viewAll") === "true";
  const rawQueryCategory = searchParams.get("category")?.trim().toLowerCase() ?? "home";
  const queryCategory = rawQueryCategory || "home";
  const isKnownCategory = DEFAULT_HELP_CATEGORIES.includes(
    queryCategory as (typeof DEFAULT_HELP_CATEGORIES)[number],
  );

  const [postType, setPostType] = useState<HelpPostType>(queryPostType);
  const [selectedCategory, setSelectedCategory] = useState<string>(isViewingAll ? "*" : isKnownCategory ? queryCategory : "other");
  const [categories, setCategories] = useState<string[]>([]);
  const [communityPosts, setCommunityPosts] = useState<HelpPost[]>([]);
  const [myPosts, setMyPosts] = useState<HelpPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [postCities, setPostCities] = useState<Map<number, string>>(new Map());

  const selectableCategories = useMemo(() => {
    const base = categories.length > 0 ? categories : [...DEFAULT_HELP_CATEGORIES];
    const unique = [...new Set(base.map((item) => item.toLowerCase()))];
    return [...unique, "other"];
  }, [categories]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredCommunityPosts = useMemo(() => {
    if (!normalizedSearch) {
      return communityPosts;
    }

    return communityPosts.filter((post) => post.title.toLowerCase().includes(normalizedSearch));
  }, [communityPosts, normalizedSearch]);

  const filteredMyPosts = useMemo(() => {
    if (!normalizedSearch) {
      return myPosts;
    }

    return myPosts.filter((post) => post.title.toLowerCase().includes(normalizedSearch));
  }, [myPosts, normalizedSearch]);

  const syncQueryString = useCallback(
    (nextType: HelpPostType, nextCategory: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("postType", nextType);
      params.set("category", nextCategory);
      router.replace(`/pages/HelpPosts?${params.toString()}`);
    },
    [router, searchParams],
  );

  const loadPosts = useCallback(async () => {
    setIsLoading(true);

    const [feed, mine] = await Promise.all([
      getHelpPosts({
        postType,
        category: selectedCategory === "*" ? undefined : selectedCategory || undefined,
      }),
      getMyHelpPosts(),
    ]);

    setCommunityPosts(feed);
    setMyPosts(mine);
    setIsLoading(false);
  }, [postType, selectedCategory]);

  useEffect(() => {
    if (!checkToken()) {
      router.push("/pages/Signin");
    }
  }, [router]);

  useEffect(() => {
    const queryPostType = normalizePostType(searchParams.get("postType"));
    const isViewingAll = searchParams.get("viewAll") === "true";
    const rawQueryCategory = searchParams.get("category")?.trim().toLowerCase() ?? "home";
    const queryCategory = rawQueryCategory || "home";
    const isKnownCategory = DEFAULT_HELP_CATEGORIES.includes(
      queryCategory as (typeof DEFAULT_HELP_CATEGORIES)[number],
    );

    setPostType(queryPostType);
    setSelectedCategory(isViewingAll ? "*" : isKnownCategory ? queryCategory : "other");
  }, [searchParams]);

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
    let isCancelled = false;

    const fetchCities = async () => {
      const allPosts = [...communityPosts, ...myPosts];
      const newCities = new Map<number, string>();

      for (const post of allPosts) {
        if (post.latitude !== null && post.longitude !== null) {
          const city = await getCityFromCoordinates(post.latitude, post.longitude);
          if (!isCancelled) {
            newCities.set(post.id, city);
          }
        }
      }

      if (!isCancelled) {
        setPostCities(newCities);
      }
    };

    void fetchCities();

    return () => {
      isCancelled = true;
    };
  }, [communityPosts, myPosts]);

  const handleDelete = async (postId: number) => {
    const success = await deleteHelpPost(postId);
    if (!success) {
      setErrorMessage("Could not delete this post.");
      return;
    }

    setSuccessMessage("Post deleted.");
    setErrorMessage("");
    await loadPosts();
  };

  const handleClosePost = async (postId: number) => {
    const success = await closeHelpPost(postId);
    if (!success) {
      setErrorMessage("Could not close this post.");
      return;
    }

    setSuccessMessage("Post closed.");
    setErrorMessage("");
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

  const openCreatorProfile = (post: HelpPost) => {
    const query = post.creatorName || post.creatorUsername || "";
    router.push(`/pages/People?q=${encodeURIComponent(query)}`);
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
          Browse community posts and manage your own posts.
        </p>
      </motion.div>

      <div className="w-full max-w-5xl rounded-2xl border border-black/20 bg-white/55 p-4 backdrop-blur-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-3">Category</p>
            <div className="grid grid-cols-2 gap-2">
              {selectedCategory !== "*" && selectableCategories.map((category) => (
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
          </div>
        </div>

        <div className="mt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search posts by title..."
            className="w-full rounded-xl border border-black/20 bg-white px-4 py-3 text-sm text-black outline-none focus:ring-2 focus:ring-[#28a8af]"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push(`/pages/SubHelpPost?postType=${postType}&category=${selectedCategory === "*" ? "home" : selectedCategory}`)}
            className="rounded-xl bg-[#28a8af] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#218e94]"
          >
            Create New Post
          </button>
          <button
            type="button"
            onClick={() => router.push("/pages/HelpPosts?viewAll=true")}
            className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
              selectedCategory === "*"
                ? "bg-gray-600 text-white border-2 border-white outline outline-2 outline-offset-2 outline-gray-400"
                : "bg-gray-600 text-white hover:bg-gray-700"
            }`}
          >
            View All Posts
          </button>
        </div>
      </div>

      {errorMessage ? <p className="w-full max-w-5xl mb-3 text-sm font-semibold text-red-700">{errorMessage}</p> : null}
      {successMessage ? <p className="w-full max-w-5xl mb-3 text-sm font-semibold text-green-700">{successMessage}</p> : null}

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-5 pb-12">
        <section className="rounded-2xl bg-white/45 border border-black/20 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Community Feed ({HELP_TYPE_LABELS[postType]} - {formatCategoryLabel(selectedCategory)})
          </h3>

          {isLoading ? <p className="text-sm text-gray-700">Loading posts...</p> : null}

          {!isLoading && filteredCommunityPosts.length === 0 ? (
            <p className="text-sm text-gray-700">No open posts found for this filter yet.</p>
          ) : null}

          <AnimatePresence initial={false}>
            {filteredCommunityPosts.map((post) => (
              <motion.article
                key={post.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-xl bg-white/80 border border-black/15 p-4 mb-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {post.creatorProfilePictureUrl ? (
                      <img
                        src={post.creatorProfilePictureUrl}
                        alt={post.creatorName || post.creatorUsername || "User"}
                        className="h-11 w-11 rounded-full object-cover border border-black/10"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-[#5F4F4F]/20 border border-black/10 flex items-center justify-center text-[11px] font-bold text-gray-700">
                        {(post.creatorName || post.creatorUsername || "?").slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div>
                    <h4 className="font-bold text-gray-900">{post.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatCategoryLabel(post.category)} | {post.creatorName || post.creatorUsername} | {postCities.get(post.id) || "Loading location..."}
                    </p>
                    </div>
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
                    onClick={() => void handleMessageCreator(post)}
                    className="rounded-lg bg-[#28a8af] px-3 py-2 text-xs font-bold text-white hover:bg-[#218e94]"
                  >
                    Message Creator
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreatorProfile(post)}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    View Profile
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </section>

        <section className="rounded-2xl bg-white/45 border border-black/20 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">My Posts</h3>

          {isLoading ? <p className="text-sm text-gray-700">Loading your posts...</p> : null}

          {!isLoading && filteredMyPosts.length === 0 ? (
            <p className="text-sm text-gray-700">You have not created any help posts yet.</p>
          ) : null}

          <AnimatePresence initial={false}>
            {filteredMyPosts.map((post) => (
              <motion.article
                key={post.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-xl bg-white/80 border border-black/15 p-4 mb-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {post.creatorProfilePictureUrl ? (
                      <img
                        src={post.creatorProfilePictureUrl}
                        alt={post.creatorName || post.creatorUsername || "User"}
                        className="h-11 w-11 rounded-full object-cover border border-black/10"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-[#5F4F4F]/20 border border-black/10 flex items-center justify-center text-[11px] font-bold text-gray-700">
                        {(post.creatorName || post.creatorUsername || "?").slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div>
                    <h4 className="font-bold text-gray-900">{post.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatCategoryLabel(post.category)} | {post.isOpen ? "Open" : "Closed"}
                    </p>
                    </div>
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
                    onClick={() => openCreatorProfile(post)}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    View Profile
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
