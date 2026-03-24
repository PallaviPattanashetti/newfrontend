"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
  const [selectedPerson, setSelectedPerson] = useState("Jose");

  const contacts = [
    { id: 1, name: "Ken", status: "Online", avatar: "KM" },
    { id: 2, name: "Jose", status: "Away", avatar: "JM" },
    { id: 3, name: "Jacob", status: "Online", avatar: "JD" },
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-6 font-sans"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
   
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-87.5 bg-[#5F4F4F]/50 rounded-xl flex items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
          Messages
        </h1>
      </motion.div>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-225 h-150 border border-gray-200 bg-[#28a8af]/40 backdrop-blur-md flex flex-col md:flex-row shadow-xl rounded-2xl overflow-hidden"
      >
      
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-gray-100 bg-white/60 p-4 overflow-y-auto">
          <h2 className="text-gray-500 font-semibold text-xs uppercase tracking-wider mb-4 px-2">
            Contacts
          </h2>
          <div className="flex flex-col gap-1">
            {contacts.map((person) => (
              <motion.button
                key={person.id}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPerson(person.name)}
                className={`p-3 rounded-lg flex items-center gap-3 transition-colors ${
                  selectedPerson === person.name
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-white/50"
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                  selectedPerson === person.name ? "bg-white text-blue-600" : "bg-gray-200 text-gray-500"
                }`}>
                  {person.avatar}
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{person.name}</p>
                  <p className="text-[10px] opacity-70">{person.status}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

    
        <div className="flex-1 flex flex-col bg-white/30">
          <div className="p-4 border-b border-gray-100/20 flex items-center gap-3 bg-white/40">
            <motion.div 
              key={selectedPerson}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 bg-green-500 rounded-full" 
            />
            <span className="font-bold text-gray-800">{selectedPerson}</span>
          </div>

          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPerson} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="bg-blue-600 text-white p-3 px-4 rounded-2xl rounded-tr-none self-end max-w-[80%] text-sm shadow-sm">
                  Hi {selectedPerson}! Are you free for a quick chat about the skill swap?
                </div>
                <div className="bg-white text-gray-800 p-3 px-4 rounded-2xl rounded-tl-none self-start max-w-[80%] text-sm shadow-sm">
                  Hey! Yes, I'm available. What did you have in mind?
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

         
          <div className="p-4 bg-white/50 border-t border-gray-100/20 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full h-11 px-4 rounded-full border border-gray-200 bg-white/80 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm"
              />
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-[32px] md:text-[40px] mt-10 text-gray-900 text-center font-light italic">
          "A community is just a collection of shared hours."
        </p>
      </motion.div>
    </div>
  );
}