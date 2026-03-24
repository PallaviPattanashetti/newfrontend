"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion"; 

const Page = () => {
  const router = useRouter();

  const bottomCardData = [
    { title: "Computer", img: "/assets/Computer.jpeg", slug: "computer-skills" },
    { title: "Caption Writing", img: "/assets/caption write.png", slug: "caption-writing" },
    { title: "Communication", img: "/assets/communications.jpeg", slug: "communication" },
    { title: "Kids Tutoring", img: "/assets/kidstutor.jpeg", slug: "kids-tutoring" },
    { title: "Speech Writing", img: "/assets/speech.jpeg", slug: "speech-writing" },
    { title: "Reading Buddy", img: "/assets/readingbuddy.jpeg", slug: "reading-buddy" },
    { title: "Creative Writing", img: "/assets/caption write.png", slug: "creative-writing" }, 
    { title: "Homework Help", img: "/assets/homework .jpeg", slug: "homework-help" },
    { title: "Resume or Bio Polishing", img: "/assets/resume.jpeg", slug: "resume-polishing" },
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
        className="w-full max-w-149 min-h-24 bg-[#5F4F4F]/25 rounded-2xl flex items-center justify-center my-8 p-4 border-2 border-black backdrop-blur-sm"
      >
        <h1 className="text-4xl md:text-[64px] font-extrabold text-black tracking-tight text-center">
          Learning Help
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
            whileHover={{ y: -10 }}
            className="w-full max-w-70 min-h-95 bg-[#F4F4F4]/60 border-2 rounded-2xl border-black flex flex-col overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="w-full h-45 border-b-2 border-black overflow-hidden relative">
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>

            <div className="p-5 flex flex-col items-center grow justify-between bg-white/40">
              <div className="w-full">
                <h5 className="text-xl font-black text-black mb-2 text-center leading-tight uppercase tracking-tighter">
                  {item.title}
                </h5>
              </div>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#000", color: "#fff" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/learning-help/${item.slug}`)}
                className="w-full max-w-45 py-3 border-2 border-black bg-[#6F7887]/80 rounded-xl text-black font-bold text-[18px] sm:text-[20px] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
        transition={{ duration: 1 }}
      >
        <p className="text-[30px] md:text-[40px] mt-10 text-black text-center italic font-medium">
          "Redefining wealth, one hour at a time."
        </p>
      </motion.div>
    </div>
  );
};

export default Page;