"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  Navbar,
  NavbarLink,
  NavbarToggle,
} from "flowbite-react";
import { DM_UNREAD_CHANGED_EVENT, getDmUnreadCount } from "@/lib/dm-services";
import { checkToken, clearToken, loggedInData } from "@/lib/user-services";

const CREDIT_KEYS = [
  "credits",
  "credit",
  "creditBalance",
  "balance",
  "totalCredits",
  "availableCredits",
];

const resolveCreditValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const readCreditBalance = (): string => {
  const user = loggedInData() as Record<string, unknown> | null;
  if (!user) {
    return "--";
  }

  for (const key of CREDIT_KEYS) {
    const resolvedValue = resolveCreditValue(user[key]);
    if (resolvedValue !== null) {
      return resolvedValue.toFixed(2);
    }
  }

  return "--";
};

export function NavLinks() {
  const { push } = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [creditBalance, setCreditBalance] = useState("--");
  const [unreadDmCount, setUnreadDmCount] = useState(0);

  useEffect(() => {
    const refreshAuthState = async () => {
      const loggedIn = checkToken();
      setIsLoggedIn(loggedIn);
      setCreditBalance(loggedIn ? readCreditBalance() : "--");

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
        label: "Create Post",
        path: "/pages/SubHelpPost",
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
    () =>
      navItems.filter((item) => (isLoggedIn ? item.label !== "Login" : true)),
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
    <div className="sticky top-0 z-50 w-full bg-linear-to-r from-[#d8f1f7]/95 via-[#edf9fb]/95 to-white/95 backdrop-blur-sm">
     { isLoggedIn  ? <Navbar
        fluid
        rounded={false}
        className="relative border-none bg-transparent! px-4 py-4 shadow-none dark:bg-transparent! md:px-6"
      >
        <div className="flex w-full items-center justify-between md:hidden">
          <div className="flex min-w-28 flex-col rounded-full border border-black/10 bg-white/45 px-4 py-2 text-black shadow-sm backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/65">
              Credits
            </span>
            <span className="text-sm font-black leading-none">{creditBalance}</span>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="inline-flex h-9 items-center justify-center rounded-full bg-sky-500 px-4 text-xs font-semibold text-white shadow-md transition hover:bg-sky-600"
              >
                Logout
              </button>
            ) : null}

            <NavbarToggle />
          </div>
        </div>

        <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 md:flex">
          <div className="flex min-w-32 flex-col rounded-full border border-black/10 bg-white/45 px-4 py-2 text-black shadow-sm backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/65">
              Credits
            </span>
            <span className="text-sm font-black leading-none">{creditBalance}</span>
          </div>
        </div>

        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 items-center gap-2 md:flex">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="inline-flex h-10 items-center justify-center rounded-full bg-sky-500 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-sky-600"
            >
              Logout
            </button>
          ) : null}
        </div>

        <div className="md:order-1 md:w-full md:justify-center">
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="flex w-full flex-row items-center justify-center gap-2 overflow-x-auto py-4 no-scrollbar md:gap-4 md:overflow-x-visible md:py-0"
          >
            {visibleNavItems.map((item) => (
              <NavbarLink
                key={item.path}
                as={Link}
                href={item.path}
                className="flex shrink-0 items-center justify-center border-none bg-transparent p-0 no-underline shadow-none"
              >
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative flex flex-col items-center justify-center p-2 origin-center"
                >
                  {item.label === "Messages" && unreadDmCount > 0 ? (
                    <span className="absolute right-1 top-0 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                      {unreadDmCount}
                    </span>
                  ) : null}
                  <img
                    src={item.icon}
                    className="h-8 w-8 md:h-12 md:w-12"
                    alt={item.label}
                  />
                  <span className="text-[10px] md:text-sm mt-1 font-bold text-black whitespace-nowrap">
                    {item.label}
                  </span>
                </motion.div>
              </NavbarLink>
            ))}
          </motion.div>
        </div>
      </Navbar> : ""}
    </div>
  );
}

