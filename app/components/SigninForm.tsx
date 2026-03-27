"use client";

import React, { useState } from "react";
import { Button } from "flowbite-react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/user-services";
import { AnimatePresence, motion } from "framer-motion";

const SigninPage = () => {
  const { push } = useRouter();

  const [signin, setSignin] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = await login({
      UserEmail: signin.email,
      password: signin.password,
    });

    if (token) {
      localStorage.setItem("token", token.token);
      push("/pages/");
    } else {
      alert("Invalid credentials");
    }
  };

  const inputContainer =
    "w-full max-w-[505px] h-[60px] border-2 border-black rounded-[15px] bg-white flex items-center overflow-hidden mb-4 shadow-sm focus-within:ring-2 focus-within:ring-black transition-all";
  const inputBase =
    "w-full h-full text-center border-none focus:ring-0 text-black placeholder-black/50 font-medium bg-transparent";

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-8"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-87.5 bg-[#5F4F4F]/50 rounded-xl flex items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
          Sign In
        </h1>
      </motion.div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg flex flex-col items-center"
      >
        <AnimatePresence mode="wait">
          <motion.div className={inputContainer}>
            <input
              type="email"
              placeholder="Email"
              required
              className={inputBase}
              onChange={(e) =>
                setSignin({ ...signin, email: e.target.value })
              }
            />
          </motion.div>

          <div className={inputContainer}>
            <input
              type="password"
              placeholder="Password"
              required
              className={inputBase}
              onChange={(e) =>
                setSignin({ ...signin, password: e.target.value })
              }
            />
          </div>
        </AnimatePresence>

        <Button type="submit" className="w-full">
          Login
        </Button>

        <p className="mt-4">
          New user?
          <span
            className="underline ml-2 cursor-pointer"
            onClick={() => push("/pages/Register")}
          >
            Register
          </span>
        </p>
      </form>
    </div>
  );
};

export default SigninPage;
