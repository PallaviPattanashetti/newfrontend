"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { motion } from "framer-motion";

export default function EditProfile() {
  const [name, setName] = useState<string>("John Doe");
  const [bio, setBio] = useState<string>("I love helping the community!");
  const [image, setImage] = useState<string>("/assets/UserAccounts.jpeg");
  const [isClient, setIsClient] = useState(false);

 
  useEffect(() => {
    setIsClient(true);
  }, []);

  
  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
     
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isClient) return null;

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')", backgroundSize: 'cover' }}
    >
    
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className=" bg-[#6F7887]/80 backdrop-blur-md p-6 rounded-2xl shadow-sm mb-4 w-full max-w-md border border-white/20"
      >
        <h1 className="text-xl font-black text-center text-white uppercase tracking-widest">
          Edit Profile
        </h1>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/30 backdrop-blur-md p-8 rounded-2xl shadow-md mb-4 w-full max-w-md flex flex-col items-center border border-white/20"
      >
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img src={image} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <label className="absolute bottom-0 right-0 bg-[#28a8af] text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-white cursor-pointer shadow-xl hover:scale-110 transition-transform active:scale-95">
            <span className="text-2xl font-bold">+</span>
            <input 
              type="file" 
              className="hidden" 
              onChange={handleImage} 
              accept="image/*" 
            />
          </label>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/30 backdrop-blur-md p-6 rounded-2xl shadow-md mb-4 w-full max-w-md border border-white/20"
      >
        <label className="block text-[10px] font-black text-black uppercase mb-2 ml-1 tracking-[0.2em]">
          Profile Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-white/60 border-none rounded-xl focus:ring-2 focus:ring-[#28a8af] outline-none text-gray-800 font-bold"
        />
      </motion.div>

     
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/30 backdrop-blur-md p-6 rounded-2xl shadow-md w-full max-w-md border border-white/20"
      >
        <label className="block text-[10px] font-black text-black uppercase mb-2 ml-1 tracking-[0.2em]">
          About Me
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full p-3 bg-white/60 border-none rounded-xl focus:ring-2 focus:ring-[#28a8af] outline-none text-gray-800 h-28 resize-none mb-6 font-medium"
        />

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => alert("Changes Saved Successfully!")}
          className="w-full bg-[#28a8af] text-white py-4 rounded-xl font-black shadow-lg uppercase tracking-widest text-sm"
        >
          Save Changes
        </motion.button>
      </motion.div>
    </div>
  );
}