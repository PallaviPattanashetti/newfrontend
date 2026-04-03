"use client";

import React, { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import { useRouter } from "next/navigation";
import { checkToken, getApiBaseUrl, login } from "@/lib/user-services";
import { motion } from "framer-motion";

const SigninPage = () => {
  const { push } = useRouter();

  const [signin, setSignin] = useState({
    usernameOrEmail: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isLoggedIn = checkToken();

  useEffect(() => {
    if (isLoggedIn) {
      push("/pages/Edit");
    }
  }, [isLoggedIn, push]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const token = await login({
        usernameOrEmail: signin.usernameOrEmail,
        password: signin.password,
      });

      if (token) {
        push("/pages/Edit");
      } else {
        setErrorMessage("Sign in failed. Check credentials or API availability.");
      }
    } catch {
      setErrorMessage(`Could not reach API at ${getApiBaseUrl()}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputContainer =
    "w-full max-w-[505px] h-[60px] border-2 border-black rounded-[15px] bg-white flex items-center overflow-hidden mb-4 shadow-sm focus-within:ring-2 focus-within:ring-black transition-all";
  const inputBase =
    "w-full h-full text-center border-none focus:ring-0 text-black placeholder-black/50 font-medium bg-transparent";

  if (isLoggedIn) {
    return null;
  }

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
        <motion.div className={inputContainer}>
          <input
            type="text"
            placeholder="Username or Email"
            required
            className={inputBase}
            onChange={(e) =>
              setSignin({ ...signin, usernameOrEmail: e.target.value })
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

        <Button type="submit" className="w-full">
          {isSubmitting ? "Signing in..." : "Login"}
        </Button>

        {errorMessage ? (
          <p className="mt-3 text-sm text-red-200 bg-black/30 px-3 py-2 rounded-md">
            {errorMessage}
          </p>
        ) : null}

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



