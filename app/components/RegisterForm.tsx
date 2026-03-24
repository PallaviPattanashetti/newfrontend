
"use client";

import React, { useState } from "react";
import { Button, Checkbox, Label } from "flowbite-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createAccount, login } from "@/lib/user-services"; 

const UnifiedAuthForm = () => {
  const { push } = useRouter();

 
  const [switchBool, setSwitchBool] = useState(false); 


  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    skill: "",
  });

  const handleSwitch = () => setSwitchBool(!switchBool);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!switchBool) {
   
      const success = await createAccount(formData);
      if (success) {
        alert("Account Created! Please Sign In.");
        setSwitchBool(true); 
      } else {
        alert("Registration failed. Email might already exist.");
      }
    } else {
      // LOGIN LOGIC
    //   const token = await login({ 
    //     UserEmail: formData.email, 
    //     password: formData.password 
    //   });

//       if (token) {
//         localStorage.setItem("token", token.token);
//         push("/HelpCategory");
//       } else {
//         alert("LOGIN NO GOOD!");
//       }
    }
  };

 
  const inputContainer = "w-full max-w-[505px] h-[60px] border-2 border-black rounded-[15px] bg-white flex items-center overflow-hidden mb-4 shadow-sm focus-within:ring-2 focus-within:ring-black transition-all";
  const inputBase = "w-full h-full text-center border-none focus:ring-0 text-black placeholder-black/50 font-medium bg-transparent";

  return (
    <div className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-8"
         style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}>
 
      <motion.div layout className="w-full max-w-[600px] bg-[#5F4F4F]/60 rounded-2xl flex items-center justify-center my-10 p-6 border border-black/10">
        <h1 className="text-[40px] md:text-[64px] font-extrabold text-black uppercase tracking-tighter">
          {switchBool ? "Sign In" : "Register"}
        </h1>
      </motion.div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-lg flex-col items-center">
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={switchBool ? "login" : "register"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
     
            {!switchBool && (
              <>
                <div className={inputContainer}>
                  <input 
                    type="text" placeholder="Full Name" className={inputBase} required
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className={inputContainer}>
                  <input 
                    type="text" placeholder="Your City" className={inputBase} required
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div className={inputContainer}>
                  <input 
                    type="text" placeholder="Your Primary Skill" className={inputBase} required
                    onChange={(e) => setFormData({...formData, skill: e.target.value})}
                  />
                </div>
              </>
            )}

          
            <div className={inputContainer}>
              <input 
                type="email" placeholder="Email Address" className={inputBase} required
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className={inputContainer}>
              <input 
                type="password" placeholder="Password" className={inputBase} required
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </motion.div>
        </AnimatePresence>

  
        {!switchBool && (
          <div className="flex items-center gap-3 bg-white/60 px-4 py-2 rounded-lg border border-black/10 mb-4">
            <Checkbox id="agree" className="border-2 border-black" required />
            <Label htmlFor="agree" className="font-bold text-black">I accept the terms</Label>
          </div>
        )}

     
        <Button 
          type="submit" 
          className="w-full max-w-[400px] h-[70px] md:h-[90px] bg-[#5F4F4F]/80 border-2 border-black rounded-[30px] hover:bg-black transition-all"
        >
          <span className="text-white text-2xl font-black uppercase tracking-widest">
            {switchBool ? "Login" : "Create Account"}
          </span>
        </Button>

     
        <div className="mt-8 text-center text-black font-bold">
          {switchBool ? "New to TimeBank?" : "Already have an account?"}{" "}
          <button 
            type="button" 
            className="underline font-black text-xl ml-2 hover:text-blue-900"
            onClick={handleSwitch}
          >
            {switchBool ? 'Register Here' : "Sign in here"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UnifiedAuthForm;