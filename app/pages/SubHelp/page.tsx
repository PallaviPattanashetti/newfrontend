"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion"; 

const Page = () => {
  const router = useRouter();

  const bottomCardData = [
    { title: "Decor", img: "/assets/Decor.jpeg", slug: "decor", path: "../Pages/DecorPage" },
    { title: "Cleaning", img: "/assets/cleaning.jpeg", slug: "cleaning", path: "../Pages/CleaningPage" },
    { title: "Organizing/ Decluttering", img: "/assets/Org:decl.jpeg", slug: "organizing-decluttering", path: "/home-help/organizing" },
    { title: "Elder Support", img: "/assets/Eldersupport.jpeg", slug: "elder-support" },
    { title: "Meal Prep", img: "/assets/mealpre.jpeg", slug: "meal-prep" },
    { title: "Grocery Shopping", img: "/assets/Groceryshop.jpeg", slug: "grocery-shopping" },
    { title: "Laundry", img: "/assets/laundry.jpeg", slug: "laundry" },
    { title: "Home safety Checks", img: "/assets/Home safety.jpeg", slug: "home-safety-checks" },
    { title: "Childcare", img: "/assets/Childcare.jpeg", slug: "childcare" },
  ];

 
  const containerVars = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  const cardVars = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-6"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
 
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-149 min-h-24 border-black bg-[#5F4F4F]/25 rounded-2xl flex items-center justify-center my-8 p-4 border-2 shadow-lg backdrop-blur-sm"
      >
        <h1 className="text-4xl md:text-[64px] font-extrabold text-black tracking-tight text-center">
          Home Help
        </h1>
      </motion.div>

      <motion.div 
        variants={containerVars}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl justify-items-center mb-12"
      >
        {bottomCardData.map((item) => (
          <motion.div
            key={item.title}
            variants={cardVars}
            whileHover={{ y: -10, transition: { duration: 0.2 } }}
            className="w-full max-w-70 min-h-95 bg-[#F4F4F4]/70 border-2 rounded-2xl border-black flex flex-col overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="w-full h-45 border-b-2 border-black overflow-hidden relative">
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>

            <div className="p-5 flex flex-col items-center grow justify-between">
              <div className="w-full">
                <h5 className="text-xl font-black text-black mb-2 text-center leading-tight uppercase tracking-tighter">
                  {item.title}
                </h5>
              </div>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#000", color: "#fff" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const destination = item.path || `/home-help/${item.slug}`;
                  router.push(destination);
                }}
                className="w-full max-w-45 py-3 border-2 border-black bg-[#6F7887]/80 rounded-xl text-black font-bold text-[18px] sm:text-[20px] transition-colors"
              >
                Click Here
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <p className="text-[30px] md:text-[40px] mt-10 text-black text-center font-medium italic drop-shadow-sm">
          "Trade skills, gain time, grow together."
        </p>
      </motion.div>
    </div>
  );
};

export default Page;