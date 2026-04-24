
"use client";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";

const Page = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); // Track if we are editing
  
  const [posts, setPosts] = useState([
    {
      id: 1,
      user: "Rose.",
      avatar: "https://i.pravatar.cc/150?u=sarah",
      content: "Gardening: Looking for someone to help with gardening this weekend!",
    },
    {
      id: 2,
      user: "Lucas",
      avatar: "https://i.pravatar.cc/150?u=mike",
      content: "Garage: Does anyone available to declutter my garage?",
    }
  ]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

 
  const handleSubmit = () => {
    if (!title || !description) return;

    if (editingId) {
      
      setPosts(posts.map(post => 
        post.id === editingId 
          ? { ...post, content: `${title}: ${description}` } 
          : post
      ));
    } else {
     
      const newPost = {
        id: Date.now(),
        user: "You",
        avatar: "https://i.pravatar.cc/150?u=you",
        content: `${title}: ${description}`,
      };
      setPosts([newPost, ...posts]);
    }

    setTitle("");
    setDescription("");
    setIsFormOpen(false);
    setEditingId(null);
  };


  const handleDelete = (id: number) => {
    setPosts(posts.filter(post => post.id !== id));
  };

  
  const startEdit = (post: any) => {
    const [postTitle, ...rest] = post.content.split(": ");
    setTitle(postTitle);
    setDescription(rest.join(": "));
    setEditingId(post.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-6 space-y-8"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
      <div className="w-full max-w-2xl min-h-24 bg-[#5F4F4F]/25 rounded-2xl flex items-center justify-center p-4 shadow-lg backdrop-blur-sm">
        <h1 className="text-4xl font-extrabold text-white tracking-tight text-center">
          Home Help Feed
        </h1>
      </div>

      
      <div className="w-full max-w-2xl">
        <AnimatePresence>
          {!isFormOpen ? (
            <motion.button 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(true)}
              className="w-full md:w-auto md:px-10 py-3.5 rounded-full bg-[#28a8af] text-white font-bold text-sm shadow-lg hover:bg-[#218e94] active:scale-95 transition-all"
            >
              + Create New Post
            </motion.button>
          ) : (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full bg-[#5F4F4F]/25 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
            >
              <h2 className="text-xl font-bold mb-4 text-white">
                {editingId ? "Edit Request" : "New Request"}
              </h2>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (e.g. Painting)"
                className="w-full p-4 rounded-xl bg-white/10 border border-white/10 mb-4 text-white placeholder-gray-300 outline-none focus:border-[#28a8af]"
              />
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description..."
                className="w-full p-4 rounded-xl bg-white/10 border border-white/10 mb-6 text-white placeholder-gray-300 h-32 resize-none outline-none focus:border-[#28a8af]"
              />
              <div className="flex gap-4">
                <button 
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-[#28a8af] text-white font-bold rounded-xl hover:bg-[#218e94] transition-colors"
                >
                  {editingId ? "Save Changes" : "Submit"}
                </button>
                <button 
                  onClick={() => { setIsFormOpen(false); setEditingId(null); setTitle(""); setDescription(""); }}
                  className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    
      <div className="w-full max-w-2xl space-y-6 pb-20">
        <AnimatePresence initial={false}>
          {posts.map((post) => (
            <motion.div
              key={post.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col md:flex-row items-center justify-between bg-white/40 p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/30 backdrop-blur-md relative group"
            >
              <div className="flex flex-col items-center space-y-3 shrink-0 w-32">
                <div className="relative w-16 h-16 rounded-full border-2 border-[#28a8af] p-1 bg-white/70 overflow-hidden">
                  <img src={post.avatar} alt={post.user} className="w-full h-full object-cover rounded-full" />
                </div>
                <h3 className="text-gray-900 font-bold text-sm text-center">{post.user}</h3>
              </div>

              <div className="flex-1 px-4 md:px-10 py-4 md:py-0">
                <p className="text-gray-800 text-sm md:text-base leading-relaxed text-center md:text-left italic">
                  "{post.content}"
                </p>
              </div>

          
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <button className="w-full md:px-8 py-2 rounded-full bg-[#28a8af] text-white font-bold text-xs hover:scale-105 transition-transform">
                  Message
                </button>
                
               
                {post.user === "You" && (
                  <div className="flex gap-2 justify-center mt-2">
                    <button 
                      onClick={() => startEdit(post)}
                      className="text-xs font-bold text-gray-700 hover:text-[#28a8af] transition-colors"
                    >
                      Edit
                    </button>
                    <span className="text-gray-400">|</span>
                    <button 
                      onClick={() => handleDelete(post.id)}
                      className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
     

         <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center"
        >
          <p className="text-[30px] md:text-[40px] mt-10 text-black text-center italic font-medium">
            &ldquo;The future is in motion, and we're building it with you. Let's GO!.&rdquo;
          </p>
        </motion.div>
    </div>
  );
};

export default Page;













