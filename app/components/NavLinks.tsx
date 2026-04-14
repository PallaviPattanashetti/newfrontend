"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Navbar,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
} from "flowbite-react";
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [creditBalance, setCreditBalance] = useState("--");

  useEffect(() => {
    const refreshAuthState = () => {
      const loggedIn = checkToken();
      setIsLoggedIn(loggedIn);
      setCreditBalance(loggedIn ? readCreditBalance() : "--");
    };

    refreshAuthState();
    window.addEventListener("storage", refreshAuthState);
    window.addEventListener("auth-changed", refreshAuthState);
    return () => {
      window.removeEventListener("storage", refreshAuthState);
      window.removeEventListener("auth-changed", refreshAuthState);
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

  return (
    <div className="sticky top-0 z-50 w-full bg-linear-to-r from-[#d8f1f7]/95 via-[#edf9fb]/95 to-white/95 backdrop-blur-sm">
      <Navbar
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
              <Button
                size="xs"
                color="dark"
                onClick={handleLogout}
                className="rounded-full px-4"
              >
                Logout
              </Button>
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
            <Button
              size="xs"
              color="dark"
              onClick={handleLogout}
              className="rounded-full px-4"
            >
              Logout
            </Button>
          ) : null}
        </div>

        <NavbarCollapse className="border-none bg-transparent! dark:bg-transparent! md:order-1 md:w-full md:justify-center">
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
                  className="flex flex-col items-center justify-center p-2 origin-center"
                >
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
        </NavbarCollapse>
      </Navbar>
    </div>
  );
}
