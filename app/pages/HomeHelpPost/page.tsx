"use client"; 
import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";

const Page = () => {
 
  const [posts, setPosts] = useState([
    {
      id: 1,
      user: "Rose.",
      avatar: "https://i.pravatar.cc/150?u=sarah",
      content: "Looking for someone to help with gardening this weekend! .",
    },
    {
      id: 2,
      user: " Lucas",
      avatar: "https://i.pravatar.cc/150?u=mike",
      content: "Does anyone available to declutter my garage?",
    }
  ]);

  const handleCreatePost = () => {
    const newContent = prompt("What do you need help with?");
    if (newContent) {
      const newPost = {
        id: Date.now(),
        user: "You",
        avatar: "https://i.pravatar.cc/150?u=you",
        content: newContent,
      };
      setPosts([newPost, ...posts]);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-6 space-y-8"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
   
      <div className="w-full max-w-2xl min-h-24 bg-[#5F4F4F]/25 rounded-2xl flex items-center justify-center p-4 shadow-lg backdrop-blur-sm">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
          Home Help Feed
        </h1>
      </div>

      <div className="shrink-0 w-full max-w-2xl">
        <button 
          onClick={handleCreatePost}
          className="w-full md:w-auto md:px-10 py-3.5 rounded-full bg-[#28a8af] text-white font-bold text-sm shadow-lg shadow-[#28a8af]/30 hover:bg-[#218e94] active:scale-95 transition-all"
        >
          + Create Post
        </button>
      </div>

  
      <div className="w-full max-w-2xl space-y-6">
        <AnimatePresence>
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col md:flex-row items-center justify-between bg-white/40 p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/30 backdrop-blur-md"
            >
              
              <div className="flex flex-col items-center space-y-3 shrink-0 w-32">
                <div className="relative w-20 h-20 rounded-full border-2 border-[#28a8af] p-1 shadow-sm bg-white/70 overflow-hidden">
                  <img 
                    src={post.avatar} 
                    alt={post.user} 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <h3 className="text-gray-900 font-bold text-base text-center leading-tight">
                  {post.user}
                </h3>
              </div>

              
              <div className="flex-1 px-4 md:px-12 py-6 md:py-0">
                <p className="text-gray-700 text-sm md:text-base leading-relaxed text-center md:text-left italic">
                  "{post.content}"
                </p>
              </div>

              
              <div className="shrink-0 w-full md:w-auto">
                <button className="w-full md:px-10 py-3.5 rounded-full bg-[#28a8af] text-white font-bold text-sm shadow-lg shadow-[#28a8af]/30 hover:bg-[#218e94] transition-colors">
                  Message
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Page;


















// import { motion } from "framer-motion";
// import React from "react";

// const page = () => {
//   return (
//     <div
//       className="min-h-screen bg-cover bg-center flex flex-col items-center p-6"
//       style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
//     >
//       <div className="w-full max-w-149 min-h-24  bg-[#5F4F4F]/25 rounded-2xl flex items-center justify-center my-8 p-4  shadow-lg backdrop-blur-sm">
//          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
//         Home Help post
//         </h1>
//       </div>

//       <div className="shrink-0 w-full md:w-auto">
//         <button className="w-full md:px-10 py-3.5 rounded-full bg-[#28a8af] text-white font-bold text-sm shadow-lg shadow-[#28a8af]/30 hover:bg-[#218e94] transition-colors">
//           Create Post
//         </button>
//       </div>

//       <div className="flex flex-col md:flex-row items-center justify-between bg-white/30 p-6 md:p-8 rounded-4xl shadow-xl border border-white/20">
//         <div className="flex flex-col items-center space-y-3 shrink-0 w-32">
//           <div className="relative w-20 h-20 rounded-full border-2 border-[#28a8af] p-1 shadow-sm bg-white/70 overflow-hidden"></div>
//           <h3 className="text-gray-900 font-bold text-base text-center leading-tight"></h3>
//         </div>

//         <div className="flex-1 px-4 md:px-12 py-6 md:py-0">
//           <p className="text-gray-500 text-sm md:text-base leading-relaxed text-center md:text-left italic">Help post goes here </p>
//         </div>

//         <div className="shrink-0 w-full md:w-auto">
//           <button className="w-full md:px-10 py-3.5 rounded-full bg-[#28a8af] text-white font-bold text-sm shadow-lg shadow-[#28a8af]/30 hover:bg-[#218e94] transition-colors">
//             Message
//           </button>
//         </div>
//       </div>

      
//     </div>
//   );
// };

// export default page;
