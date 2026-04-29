"use client";

import { Inria_Serif } from "next/font/google";
import { useRouter } from "next/navigation";

import { motion } from "framer-motion";

const inriaSerif = Inria_Serif({
  subsets: ["latin"],
  weight: "400",
});

const Page = () => {
  const router = useRouter();

  const sloganText =
    "Exchange time for time: one hour given, one hour gained purely on credits, no cash!";
  const words = sloganText.split(" ");

  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.3 },
    },
  };

  const wordVars = {
    hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.5 },
    },
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-8"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-125 min-h-22.5 md:min-h-27.5 bg-[#CD9238]/40 rounded-2xl flex items-center justify-center mt-10 border border-black/10 backdrop-blur-md shadow-xl"
      >
        <h1 className="text-[40px] md:text-[64px] font-bold text-black tracking-tight">
          TimeBank
        </h1>
      </motion.div>

      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="visible"
        className={`${inriaSerif.className} mt-12 md:mt-16 text-center max-w-200 px-6`}
      >
        <h2 className="text-[28px] md:text-[48px] leading-tight text-black flex flex-wrap justify-center">
          {words.map((word, i) => (
            <motion.span
              key={i}
              variants={wordVars}
              className="inline-block mr-2 md:mr-3"
            >
              {word}
            </motion.span>
          ))}
        </h2>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        whileHover={{ scale: 1.03, backgroundColor: "rgba(95, 79, 79, 0.4)" }}
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push("/pages/Edit")}
        className="w-full max-w-87.5 md:max-w-100 h-20 rounded-3xl bg-[#5F4F4F]/30 border-2 border-black flex items-center justify-center text-[28px] md:text-[36px] font-bold text-black mt-20 shadow-2xl backdrop-blur-sm transition-colors cursor-pointer"
      >
        Get Started
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="mt-auto mb-6 text-black font-bold italic text-lg text-center"
      >
        &ldquo;The bank where everyone is equally wealthy.&rdquo;
      </motion.p>
    </div>
  );
};

export default Page;
