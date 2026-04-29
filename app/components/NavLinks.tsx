"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useCredits } from "@/context/creditcontext";
import { DM_UNREAD_CHANGED_EVENT, getDmUnreadCount } from "@/lib/dm-services";
import { checkToken, clearToken } from "@/lib/user-services";

export function NavLinks() {
  const { push } = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [unreadDmCount, setUnreadDmCount] = useState(0);
  const { credits } = useCredits();
  const displayCredits = Number.isFinite(credits) ? credits.toFixed(2) : "0.00";

  useEffect(() => {
    const refreshAuthState = async () => {
      const loggedIn = checkToken();
      setIsLoggedIn(loggedIn);

      if (!loggedIn) {
        setUnreadDmCount(0);
        return;
      }

      setUnreadDmCount(await getDmUnreadCount());
    };

    void refreshAuthState();
    window.addEventListener("storage", refreshAuthState);
    window.addEventListener("auth-changed", refreshAuthState);
    window.addEventListener(DM_UNREAD_CHANGED_EVENT, refreshAuthState);

    return () => {
      window.removeEventListener("storage", refreshAuthState);
      window.removeEventListener("auth-changed", refreshAuthState);
      window.removeEventListener(DM_UNREAD_CHANGED_EVENT, refreshAuthState);
    };
  }, []);

  const handleLogout = () => {
    clearToken();
    push("/pages/Signin");
  };

  const navItems = useMemo(
    () => [
      { icon: "/assets/icons8-home-100.png", label: "Home", path: "/" },
      {
        icon: "/assets/icons8-login-100.png",
        label: "Login",
        path: "/pages/Register",
      },
      {
        icon: "/assets/icons8-profile-100.png",
        label: "Profile",
        path: "/pages/Edit",
      },
      {
        icon: "/assets/icons8-users-90.png",
        label: "Nearby Users",
        path: "/pages/People",
      },
      {
        icon: "/assets/icons8-categorize-100.png",
        label: "Categories",
        path: "/pages/HelpCategory",
      },
      {
        icon: "/assets/CreatePost.png",
        label: "Help Posts",
        path: "/pages/HelpPosts",
      },
      {
        icon: "/assets/icons8-messages-100.png",
        label: "Messages",
        path: "/pages/Message",
      },
      {
        icon: "/assets/icons8-dollar-coin-100.png",
        label: "Credits",
        path: "/pages/Credit",
      },
      {
        icon: "/assets/icons8-paper-map-100.png",
        label: "Maps",
        path: "/pages/MapBox",
      },
    ],
    [],
  );

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => (isLoggedIn ? item.label !== "Login" : true)),
    [isLoggedIn, navItems],
  );

  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.07 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -8 },
    show: { opacity: 1, y: 0 },
  };

  if (pathname === "/") {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full overflow-x-clip bg-linear-to-r from-[#d8f1f7]/95 via-[#edf9fb]/95 to-white/95 backdrop-blur-sm">
      {isLoggedIn ? (
        <div className="relative px-3 py-3 lg:px-6">
          <div className="flex w-full items-center justify-between lg:hidden">
            <div className="flex min-w-28 flex-col rounded-full border border-black/10 bg-white/45 px-4 py-2 text-black shadow-sm backdrop-blur-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/65">
                Credits
              </span>
              <span className="text-sm font-black leading-none">{displayCredits}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="inline-flex h-9 items-center justify-center rounded-full bg-sky-500 px-4 text-xs font-semibold text-white shadow-md transition hover:bg-sky-600"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 lg:flex">
            <div className="flex min-w-32 flex-col rounded-full border border-black/10 bg-white/45 px-4 py-2 text-black shadow-sm backdrop-blur-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/65">
                Credits
              </span>
              <span className="text-sm font-black leading-none">{displayCredits}</span>
            </div>
          </div>

          <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 items-center gap-2 lg:flex">
            <button
              onClick={handleLogout}
              className="inline-flex h-10 items-center justify-center rounded-full bg-sky-500 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-sky-600"
            >
              Logout
            </button>
          </div>

          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="flex w-full flex-row items-center justify-start gap-1 overflow-x-auto py-3 no-scrollbar sm:justify-center lg:gap-4 lg:overflow-x-visible lg:py-0"
          >
            {visibleNavItems.map((item) => (
              <Link
                key={`${item.path}-${item.label}`}
                href={item.path}
                className="flex shrink-0 items-center justify-center rounded-lg border-none bg-transparent p-0 no-underline shadow-none"
              >
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative origin-center p-2 flex flex-col items-center text-center"
                >
                  {item.label === "Messages" && unreadDmCount > 0 ? (
                    <span className="absolute right-1 top-0 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                      {unreadDmCount}
                    </span>
                  ) : null}
                  <Image
                    src={item.icon}
                    width={48}
                    height={48}
                    unoptimized
                    className={`h-7 w-7 object-contain md:h-9 md:w-9 lg:h-12 lg:w-12 ${
                      item.label === "Nearby Users" ? "translate-x-0.5" : ""
                    }`}
                    alt={item.label}
                  />
                  <span className="mt-1 block leading-tight whitespace-nowrap text-[9px] font-bold text-black md:text-xs lg:text-sm">
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}

