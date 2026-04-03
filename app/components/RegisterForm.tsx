"use client";

import React, { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import { useRouter } from "next/navigation";
import { checkToken, createAccount, getApiBaseUrl } from "@/lib/user-services";
import { motion } from "framer-motion";

const RegisterPage = () => {
  const { push } = useRouter();

  const [register, setRegister] = useState({
    usernameOrEmail: "",
    password: "",
  });

  const isLoggedIn = checkToken();

  useEffect(() => {
    if (isLoggedIn) {
      push("/pages/Edit");
    }
  }, [isLoggedIn, push]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const success = await createAccount(register);

      if (success) {
        alert("Account Created! Please Sign In.");
        push("/pages/Signin");
      } else {
        alert("Registration failed. Check API availability or whether account already exists.");
      }
    } catch {
      alert(`Could not reach API at ${getApiBaseUrl()}.`);
    }
  };

  const inputContainer =
    "w-full max-w-[505px] h-[60px] border-2 border-black rounded-[15px] bg-white flex items-center mb-4";
  const inputBase =
    "w-full h-full text-center border-none focus:ring-0 text-black";

  if (isLoggedIn) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-87.5 bg-[#5F4F4F]/50 rounded-xl flex items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
          Register
        </h1>
      </motion.div>

      <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col items-center">
        <div className={inputContainer}>
          <input
            type="text"
            placeholder="Username or Email"
            required
            className={inputBase}
            onChange={(e) =>
              setRegister({ ...register, usernameOrEmail: e.target.value })
            }
          />
        </div>

        <div className={inputContainer}>
          <input
            type="password"
            placeholder="Password"
            required
            className={inputBase}
            onChange={(e) => setRegister({ ...register, password: e.target.value })}
          />
        </div>

        <Button type="submit" className="w-full">Create Account</Button>

        <p className="mt-4">
          Already have an account?
          <span
            className="underline ml-2 cursor-pointer"
            onClick={() => push("/pages/Signin")}
          >
            Sign In
          </span>
        </p>
      </form>

        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-[32px] md:text-[40px] mt-10 text-gray-900 text-center font-light italic">
          &ldquo;"Invest an hour. Change a life."&rdquo;
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;




