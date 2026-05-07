
"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
  if (Number.isNaN(parsed.getTime())) return "Unknown date";
  return parsed.toLocaleString([], {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
};

const BG = `
  radial-gradient(ellipse at 15% 15%, #38bdf8 0%, transparent 50%),
  radial-gradient(ellipse at 85% 10%, #818cf8 0%, transparent 45%),
  radial-gradient(ellipse at 80% 85%, #34d399 0%, transparent 50%),
  radial-gradient(ellipse at 10% 80%, #fb923c 0%, transparent 45%),
  linear-gradient(160deg, #e0f2fe 0%, #bae6fd 60%, #7dd3fc 100%)
`;

function HelpPostsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryPostType = normalizePostType(searchParams.get("postType"));
  const isViewingAll = searchParams.get("viewAll") === "true";
  const rawQueryCategory = searchParams.get("category")?.trim().toLowerCase() ?? "home";
  const queryCategory = rawQueryCategory || "home";
  const isKnownCategory = DEFAULT_HELP_CATEGORIES.includes(queryCategory as (typeof DEFAULT_HELP_CATEGORIES)[number]);

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
    if (!normalizedSearch) return communityPosts;
    return communityPosts.filter((post) => post.title.toLowerCase().includes(normalizedSearch));
  }, [communityPosts, normalizedSearch]);

  const filteredMyPosts = useMemo(() => {
    if (!normalizedSearch) return myPosts;
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
      getHelpPosts({ postType, category: selectedCategory === "*" ? undefined : selectedCategory || undefined }),
      getMyHelpPosts(),
    ]);
    setCommunityPosts(feed);
    setMyPosts(mine);
    setIsLoading(false);
  }, [postType, selectedCategory]);

  useEffect(() => {
    if (!checkToken()) router.push("/pages/Signin");
  }, [router]);

  useEffect(() => {
    const queryPostType = normalizePostType(searchParams.get("postType"));
    const isViewingAll = searchParams.get("viewAll") === "true";
    const rawQueryCategory = searchParams.get("category")?.trim().toLowerCase() ?? "home";
    const queryCategory = rawQueryCategory || "home";
    const isKnownCategory = DEFAULT_HELP_CATEGORIES.includes(queryCategory as (typeof DEFAULT_HELP_CATEGORIES)[number]);
    setPostType(queryPostType);
    setSelectedCategory(isViewingAll ? "*" : isKnownCategory ? queryCategory : "other");
  }, [searchParams]);

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

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadPosts(); }, 0);
    return () => { window.clearTimeout(timer); };
  }, [loadPosts]);

  useEffect(() => {
    let isCancelled = false;
    const fetchCities = async () => {
      const allPosts = [...communityPosts, ...myPosts];
      const newCities = new Map<number, string>();
      for (const post of allPosts) {
        if (post.latitude !== null && post.longitude !== null) {
          const city = await getCityFromCoordinates(post.latitude, post.longitude);
          if (!isCancelled) newCities.set(post.id, city);
        }
      }
      if (!isCancelled) setPostCities(newCities);
    };
    void fetchCities();
    return () => { isCancelled = true; };
  }, [communityPosts, myPosts]);

  const handleDelete = async (postId: number) => {
    const success = await deleteHelpPost(postId);
    if (!success) { setErrorMessage("Could not delete this post."); return; }
    setSuccessMessage("Post deleted.");
    setErrorMessage("");
    await loadPosts();
  };

  const handleClosePost = async (postId: number) => {
    const success = await closeHelpPost(postId);
    if (!success) { setErrorMessage("Could not close this post."); return; }
    setSuccessMessage("Post closed.");
    setErrorMessage("");
    await loadPosts();
  };

  const handleMessageCreator = async (post: HelpPost) => {
    if (!post.creatorUsername) { setErrorMessage("Creator username missing. Cannot open chat."); return; }
    const response = await startHelpChat({ helpPostId: post.id });
    if (!response.thread) { setErrorMessage(response.message || "Unable to start chat for this post."); return; }
    router.push(`/pages/Message?contact=${encodeURIComponent(post.creatorUsername)}`);
  };

  const openCreatorProfile = (post: HelpPost) => {
    const query = post.creatorName || post.creatorUsername || "";
    router.push(`/pages/People?q=${encodeURIComponent(query)}`);
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
        className="w-full max-w-sm sm:max-w-2xl md:max-w-5xl rounded-2xl flex flex-col items-center justify-center my-4 sm:my-6 md:my-8 p-4 sm:p-5 border border-white/50 shadow-sm"
        style={{ background: "rgba(255,255,255,0.45)" }}
      >
        <h1
          className="font-bold tracking-tight text-center"
          style={{ fontSize: "clamp(22px, 5vw, 40px)", color: "#0369a1" }}
        >
          Help Posts
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-center" style={{ color: "#1e3a5f99" }}>
          Browse community posts and manage your own posts.
        </p>
      </motion.div>

      {/* Filters */}
      <div
        className="w-full max-w-sm sm:max-w-2xl md:max-w-5xl rounded-2xl border border-white/50 p-4 sm:p-5 backdrop-blur-sm mb-4 sm:mb-6"
        style={{ background: "rgba(255,255,255,0.45)" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Post type */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-3" style={{ color: "#0369a1" }}>
              Post Type
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {(["request", "offer"] as HelpPostType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setPostType(type); syncQueryString(type, selectedCategory); }}
                  className="rounded-xl px-3 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-colors border"
                  style={{
                    background: postType === type ? "#0369a1" : "rgba(255,255,255,0.7)",
                    color: postType === type ? "#fff" : "#1e3a5f",
                    borderColor: postType === type ? "#0369a1" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {HELP_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-3" style={{ color: "#0369a1" }}>
              Category
            </p>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {selectedCategory !== "*" && selectableCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => { setSelectedCategory(category); syncQueryString(postType, category); }}
                  className="rounded-lg px-1.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold transition-colors border"
                  style={{
                    background: selectedCategory === category ? "#0369a1" : "rgba(255,255,255,0.7)",
                    color: selectedCategory === category ? "#fff" : "#1e3a5f",
                    borderColor: selectedCategory === category ? "#0369a1" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {formatCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search posts by title..."
            className="w-full rounded-xl border-none px-4 py-2.5 sm:py-3 text-sm outline-none focus:ring-2 focus:ring-sky-400"
            style={{ background: "rgba(255,255,255,0.7)", color: "#1e3a5f" }}
          />
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => router.push(`/pages/SubHelpPost?postType=${postType}&category=${selectedCategory === "*" ? "home" : selectedCategory}`)}
            className="rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: "#0369a1" }}
          >
            + Create New Post
          </button>
          <button
            type="button"
            onClick={() => router.push("/pages/HelpPosts?viewAll=true")}
            className="rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white transition hover:opacity-90"
            style={{
              background: selectedCategory === "*" ? "#1e3a5f" : "#64748b",
              outline: selectedCategory === "*" ? "2px solid #94a3b8" : "none",
              outlineOffset: "2px",
            }}
          >
            View All Posts
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage ? (
        <p className="w-full max-w-sm sm:max-w-2xl md:max-w-5xl mb-3 text-xs sm:text-sm font-semibold" style={{ color: "#dc2626" }}>
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="w-full max-w-sm sm:max-w-2xl md:max-w-5xl mb-3 text-xs sm:text-sm font-semibold" style={{ color: "#16a34a" }}>
          {successMessage}
        </p>
      ) : null}

      <div className="w-full max-w-sm sm:max-w-2xl md:max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 pb-12">

       
        <section
          className="rounded-2xl border border-white/50 p-4 sm:p-5 backdrop-blur-sm"
          style={{ background: "rgba(255,255,255,0.45)" }}
        >
          <h3
            className="font-bold mb-3 sm:mb-4 text-sm sm:text-base md:text-lg"
            style={{ color: "#0369a1" }}
          >
            Community Feed
            <span className="ml-1 text-xs font-medium" style={{ color: "#1e3a5f99" }}>
              ({HELP_TYPE_LABELS[postType]} · {formatCategoryLabel(selectedCategory)})
            </span>
          </h3>

          {isLoading ? (
            <p className="text-xs sm:text-sm" style={{ color: "#1e3a5f99" }}>Loading posts...</p>
          ) : null}
          {!isLoading && filteredCommunityPosts.length === 0 ? (
            <p className="text-xs sm:text-sm" style={{ color: "#1e3a5f99" }}>No open posts found for this filter yet.</p>
          ) : null}

          <AnimatePresence initial={false}>
            {filteredCommunityPosts.map((post) => (
              <motion.article
                key={post.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-xl border border-white/60 p-3 sm:p-4 mb-3"
                style={{ background: "rgba(255,255,255,0.7)" }}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="flex items-start gap-2 sm:gap-3">
                    {post.creatorProfilePictureUrl ? (
                      <img
                        src={post.creatorProfilePictureUrl}
                        alt={post.creatorName || post.creatorUsername || "User"}
                        className="h-9 w-9 sm:h-11 sm:w-11 rounded-full object-cover border border-white/60 shrink-0"
                      />
                    ) : (
                      <div
                        className="h-9 w-9 sm:h-11 sm:w-11 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold shrink-0 border border-white/60"
                        style={{ background: "rgba(3,105,161,0.12)", color: "#0369a1" }}
                      >
                        {(post.creatorName || post.creatorUsername || "?").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm sm:text-base" style={{ color: "#1e3a5f" }}>
                        {post.title}
                      </h4>
                      <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: "#0369a1" }}>
                        {formatCategoryLabel(post.category)} · {post.creatorName || post.creatorUsername} · {postCities.get(post.id) || "Loading location..."}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shrink-0"
                    style={{
                      background: post.postType === "offer" ? "#dcfce7" : "#dbeafe",
                      color: post.postType === "offer" ? "#16a34a" : "#1d4ed8",
                    }}
                  >
                    {post.postType === "offer" ? "OFFER" : "REQUEST"}
                  </span>
                </div>

                <p className="text-xs sm:text-sm mt-2 sm:mt-3" style={{ color: "#1e3a5f" }}>
                  {post.description}
                </p>
                <p className="text-[10px] sm:text-[11px] mt-1.5 sm:mt-2" style={{ color: "#1e3a5f80" }}>
                  Posted {formatDateTime(post.createdAtUtc)}
                </p>

                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => void handleMessageCreator(post)}
                    className="rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white transition hover:opacity-90"
                    style={{ background: "#0369a1" }}
                  >
                    Message Creator
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreatorProfile(post)}
                    className="rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white transition hover:opacity-90"
                    style={{ background: "#6366f1" }}
                  >
                    View Profile
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </section>

        {/* My Posts */}
        <section
          className="rounded-2xl border border-white/50 p-4 sm:p-5 backdrop-blur-sm"
          style={{ background: "rgba(255,255,255,0.45)" }}
        >
          <h3
            className="font-bold mb-3 sm:mb-4 text-sm sm:text-base md:text-lg"
            style={{ color: "#0369a1" }}
          >
            My Posts
          </h3>

          {isLoading ? (
            <p className="text-xs sm:text-sm" style={{ color: "#1e3a5f99" }}>Loading your posts...</p>
          ) : null}
          {!isLoading && filteredMyPosts.length === 0 ? (
            <p className="text-xs sm:text-sm" style={{ color: "#1e3a5f99" }}>You have not created any help posts yet.</p>
          ) : null}

          <AnimatePresence initial={false}>
            {filteredMyPosts.map((post) => (
              <motion.article
                key={post.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-xl border border-white/60 p-3 sm:p-4 mb-3"
                style={{ background: "rgba(255,255,255,0.7)" }}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="flex items-start gap-2 sm:gap-3">
                    {post.creatorProfilePictureUrl ? (
                      <img
                        src={post.creatorProfilePictureUrl}
                        alt={post.creatorName || post.creatorUsername || "User"}
                        className="h-9 w-9 sm:h-11 sm:w-11 rounded-full object-cover border border-white/60 shrink-0"
                      />
                    ) : (
                      <div
                        className="h-9 w-9 sm:h-11 sm:w-11 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold shrink-0 border border-white/60"
                        style={{ background: "rgba(3,105,161,0.12)", color: "#0369a1" }}
                      >
                        {(post.creatorName || post.creatorUsername || "?").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm sm:text-base" style={{ color: "#1e3a5f" }}>
                        {post.title}
                      </h4>
                      <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: "#0369a1" }}>
                        {formatCategoryLabel(post.category)} · {post.isOpen ? "Open" : "Closed"}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shrink-0"
                    style={{
                      background: post.postType === "offer" ? "#dcfce7" : "#dbeafe",
                      color: post.postType === "offer" ? "#16a34a" : "#1d4ed8",
                    }}
                  >
                    {post.postType === "offer" ? "OFFER" : "REQUEST"}
                  </span>
                </div>

                <p className="text-xs sm:text-sm mt-2 sm:mt-3" style={{ color: "#1e3a5f" }}>
                  {post.description}
                </p>
                <p className="text-[10px] sm:text-[11px] mt-1.5 sm:mt-2" style={{ color: "#1e3a5f80" }}>
                  Posted {formatDateTime(post.createdAtUtc)}
                </p>

                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => openCreatorProfile(post)}
                    className="rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white transition hover:opacity-90"
                    style={{ background: "#6366f1" }}
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(post.id)}
                    className="rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white transition hover:opacity-90"
                    style={{ background: "#dc2626" }}
                  >
                    Delete
                  </button>
                  {post.isOpen ? (
                    <button
                      type="button"
                      onClick={() => void handleClosePost(post.id)}
                      className="rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white transition hover:opacity-90"
                      style={{ background: "#475569" }}
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

export default function HelpPostsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center font-bold text-base sm:text-lg"
          style={{ background: BG, color: "#0369a1" }}
        >
          Loading help posts...
        </div>
      }
    >
      <HelpPostsPageContent />
    </Suspense>
  );
}









