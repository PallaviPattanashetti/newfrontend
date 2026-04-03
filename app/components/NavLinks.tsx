"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Navbar,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
} from "flowbite-react";
import { checkToken, clearToken } from "@/lib/user-services";

export function NavLinks() {
  const { push } = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const refreshAuthState = () => setIsLoggedIn(checkToken());
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
      { icon: "/assets/Home.gif", label: "Home", path: "/" },
      { icon: "/assets/LogIn.gif", label: "Login", path: "/pages/Register" },
      { icon: "/assets/Edit.gif", label: "Profile", path: "/pages/Edit" },
      {
        icon: "/assets/User.gif",
        label: "Nearby Users",
        path: "/pages/People",
      },
      {
        icon: "/assets/HelpCategory.gif",
        label: "Categories",
        path: "/pages/HelpCategory",
      },

      {
        icon: "/assets/Message.gif",
        label: "Messages",
        path: "/pages/Message",
      },
      {
        icon: "/assets/AnimatedCredit.gif",
        label: "Credits",
        path: "/pages/Credit",
      },
      { icon: "/assets/Map.gif", label: "Maps", path: "/pages/GoogleMap" },
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
    <div className="sticky top-0 z-50 bg-[#28a8af]/40 w-full backdrop-blur-sm">
      <Navbar fluid rounded={false} className="bg-transparent px-6 py-4">
        <div className="flex flex-1 md:flex-none items-center justify-center md:justify-end gap-2 md:gap-4 md:order-2 md:ml-auto">
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

          <div className="md:hidden absolute right-6">
            <NavbarToggle />
          </div>
        </div>

        <NavbarCollapse className="md:order-1">
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="flex flex-row items-center justify-start md:justify-center gap-2 md:gap-4 py-4 md:py-0 w-full overflow-x-auto md:overflow-x-visible no-scrollbar"
          >
            {visibleNavItems.map((item) => (
              <NavbarLink
                key={item.path}
                as={Link}
                href={item.path}
                className="p-0 border-none shrink-0"
              >
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={`flex flex-col items-center justify-center rounded-lg transition-colors p-2 origin-center ${
                    pathname === item.path
                      ? "bg-black/10 border-b-2 border-black"
                      : "hover:bg-black/5"
                  }`}
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
