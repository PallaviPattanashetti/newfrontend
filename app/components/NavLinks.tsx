"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Navbar,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
} from "flowbite-react";

export function NavLinks() {

  
  const pathname = usePathname();

  const navItems = [
    { icon: "/assets/HomeHelp.png", label: "Home", path: "/" },

    { icon: "/assets/logIn.png", label: "Login", path: "/pages/Register" },
   
    {
      icon: "/assets/handshake.png",
      label: "Categories",
      path: "/pages/HelpCategory",
    },

  {
      icon: "/assets/UserAccounts.jpeg",
      label: "UserAccount",
      path: "/pages/People",
    },

    {
      icon: "/assets/Chat Icon.png",
      label: "Messages",
      path: "/pages/Message",
    },
   
    {
      icon: "/assets/credit-icon-7.png",
      label: "Credits",
      path: "/pages/Credit",
    },
    { icon: "/assets/Location.png", label: "Maps", path: "/pages/GoogleMap" },
     
  ];

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
    <div className="bg-[#28a8af]/40 w-full">
      <Navbar fluid rounded={false} className="bg-transparent px-6 py-4">
        <div className="flex flex-1 md:flex-none items-center justify-center md:justify-end gap-2 md:gap-4 md:order-2 md:ml-auto">
          <input
            type="text"
            className="h-10 md:h-12 w-40 sm:w-50 md:w-45 lg:w-55 rounded-[45px] bg-[#5F4F4F]/30 placeholder:text-black text-white px-4 border-none focus:ring-0 focus:outline-none transition-all"
            placeholder="Search..."
          />

          <div className="md:hidden absolute right-6">
            <NavbarToggle />
          </div>
        </div>

        <NavbarCollapse className="md:order-1">
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 py-4 md:py-0 w-full"
          >
            {navItems.map((item, index) => (
              <NavbarLink
                key={index}
                as={Link}
                href={item.path}
                className="p-0 border-none"
              >
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={`flex flex-col items-center justify-center rounded-lg transition-colors p-2 ${
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
                  <span className="text-xs md:text-sm mt-1 font-bold text-black whitespace-nowrap">
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






