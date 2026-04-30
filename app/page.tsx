
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
      className="relative min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8 overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 15% 15%, #38bdf8 0%, transparent 50%),
          radial-gradient(ellipse at 85% 10%, #818cf8 0%, transparent 45%),
          radial-gradient(ellipse at 80% 85%, #34d399 0%, transparent 50%),
          radial-gradient(ellipse at 10% 80%, #fb923c 0%, transparent 45%),
          radial-gradient(ellipse at 50% 50%, #e0f2fe 0%, #bae6fd 60%, #7dd3fc 100%)
        `,
      }}
    >
  
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(255,255,255,0.22)" }}
      />

    
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-lg rounded-2xl flex items-center justify-center mt-8 sm:mt-10 border border-white/60 backdrop-blur-md shadow-xl px-4 py-5 sm:py-6 md:py-8"
        style={{ background: "rgba(255,255,255,0.35)" }}
      >
        <h1 className="text-3xl sm:text-5xl md:text-[64px] font-bold tracking-tight drop-shadow"
          style={{ color: "#0369a1" }}
        >
          TimeBank
        </h1>
      </motion.div>

      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="visible"
        className={`${inriaSerif.className} relative z-10 mt-8 sm:mt-12 md:mt-16 text-center max-w-xs sm:max-w-xl md:max-w-3xl px-4 sm:px-6`}
      >
        <h2
          className="text-lg sm:text-2xl md:text-[40px] lg:text-[48px] leading-snug flex flex-wrap justify-center drop-shadow"
          style={{ color: "#1e3a5f" }}
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              variants={wordVars}
              className="inline-block mr-1.5 sm:mr-2 md:mr-3"
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
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push("/pages/Edit")}
        className="relative z-10 w-full max-w-[280px] sm:max-w-sm md:max-w-md h-14 sm:h-16 md:h-20 rounded-3xl flex items-center justify-center text-xl sm:text-2xl md:text-[36px] font-bold mt-12 sm:mt-16 md:mt-20 shadow-xl backdrop-blur-sm cursor-pointer border border-white/50 transition-all"
        style={{ background: "rgba(3,105,161,0.75)", color: "#ffffff" }}
      >
        Get Started
      </motion.button>


      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="relative z-10 mt-auto mb-6 font-bold italic text-sm sm:text-base md:text-lg text-center px-4"
        style={{ color: "#1e3a5f" }}
      >
        &ldquo;The bank where everyone is equally wealthy.&rdquo;
      </motion.p>
    </div>
  );
};

export default Page;



