"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { checkToken, getProfile } from "@/lib/user-services";
import { useRouter } from "next/navigation";
import Image from "next/image";

const DEFAULT_IMAGE = "/assets/UserAccounts.jpeg";

const isSafeImageSrc = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") || trimmed.startsWith("data:")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const toSafeImageSrc = (value: string): string =>
  isSafeImageSrc(value) ? value.trim() : DEFAULT_IMAGE;

const pickString = (obj: Record<string, unknown> | null, keys: string[]): string => {
  if (!obj) return "";
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

export default function ProfilePage() {
  const { push } = useRouter();
  const [loginName, setLoginName] = useState<string>("");
  const [profileName, setProfileName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [image, setImage] = useState<string>(DEFAULT_IMAGE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!checkToken()) {
        push("/pages/Signin");
        return;
      }
      const profile = await getProfile();
      const resolvedLogin = pickString(profile, ["username", "userName", "loginName", "email", "userEmail"]);
      const resolvedProfileName = pickString(profile, ["name", "displayName", "fullName"]);
      const resolvedDescription = pickString(profile, ["bio", "aboutMe", "description"]);
      const resolvedImage = pickString(profile, ["profilePictureUrl", "imageUrl", "avatarUrl"]);
      setLoginName(resolvedLogin || "Not set");
      setProfileName(resolvedProfileName || resolvedLogin || "Not set");
      setDescription(resolvedDescription || "No description added yet.");
      setImage(resolvedImage || DEFAULT_IMAGE);
      setIsLoading(false);
    };
    void load();
  }, [push]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center font-bold text-base sm:text-lg"
        style={{
          background: `
            radial-gradient(ellipse at 15% 15%, #38bdf8 0%, transparent 50%),
            radial-gradient(ellipse at 85% 10%, #818cf8 0%, transparent 45%),
            radial-gradient(ellipse at 80% 85%, #34d399 0%, transparent 50%),
            radial-gradient(ellipse at 10% 80%, #fb923c 0%, transparent 45%),
            linear-gradient(160deg, #e0f2fe 0%, #bae6fd 60%, #7dd3fc 100%)
          `,
          color: "#0369a1",
        }}
      >
        Loading profile...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-3 py-4 sm:px-4 sm:py-6 md:p-8"
      style={{
        background: `
          radial-gradient(ellipse at 15% 15%, #38bdf8 0%, transparent 50%),
          radial-gradient(ellipse at 85% 10%, #818cf8 0%, transparent 45%),
          radial-gradient(ellipse at 80% 85%, #34d399 0%, transparent 50%),
          radial-gradient(ellipse at 10% 80%, #fb923c 0%, transparent 45%),
          linear-gradient(160deg, #e0f2fe 0%, #bae6fd 60%, #7dd3fc 100%)
        `,
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-sm mb-3 sm:mb-4 w-full max-w-sm sm:max-w-md border border-white/50"
        style={{ background: "rgba(255,255,255,0.45)" }}
      >
        <h1
          className="text-sm sm:text-base md:text-xl font-black text-center uppercase tracking-widest"
          style={{ color: "#0369a1" }}
        >
          Profile
        </h1>
      </motion.div>

      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="backdrop-blur-md p-5 sm:p-8 rounded-2xl shadow-md mb-3 sm:mb-4 w-full max-w-sm sm:max-w-md flex flex-col items-center border border-white/50"
        style={{ background: "rgba(255,255,255,0.35)" }}
      >
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
          <Image
            src={toSafeImageSrc(image)}
            alt="Profile"
            fill
            sizes="(max-width: 640px) 96px, 128px"
            unoptimized
            className="object-cover"
          />
        </div>
        <p
          className="mt-3 sm:mt-4 font-black uppercase tracking-[0.2em]"
          style={{ fontSize: "clamp(9px, 2vw, 11px)", color: "#0369a1" }}
        >
          Profile Picture
        </p>
      </motion.div>

    
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-md mb-3 sm:mb-4 w-full max-w-sm sm:max-w-md border border-white/50"
        style={{ background: "rgba(255,255,255,0.35)" }}
      >
        <label
          className="block font-black uppercase mb-1.5 sm:mb-2 ml-1 tracking-[0.2em]"
          style={{ fontSize: "clamp(9px, 2vw, 10px)", color: "#0369a1" }}
        >
          Login Name
        </label>
        <p
          className="w-full p-2.5 sm:p-3 rounded-xl font-bold text-sm sm:text-base"
          style={{ background: "rgba(255,255,255,0.65)", color: "#1e3a5f" }}
        >
          {loginName}
        </p>

        <label
          className="block font-black uppercase mb-1.5 sm:mb-2 ml-1 mt-4 tracking-[0.2em]"
          style={{ fontSize: "clamp(9px, 2vw, 10px)", color: "#0369a1" }}
        >
          Profile Name
        </label>
        <p
          className="w-full p-2.5 sm:p-3 rounded-xl font-bold text-sm sm:text-base"
          style={{ background: "rgba(255,255,255,0.65)", color: "#1e3a5f" }}
        >
          {profileName}
        </p>
      </motion.div>

     
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-md w-full max-w-sm sm:max-w-md border border-white/50"
        style={{ background: "rgba(255,255,255,0.35)" }}
      >
        <label
          className="block font-black uppercase mb-1.5 sm:mb-2 ml-1 tracking-[0.2em]"
          style={{ fontSize: "clamp(9px, 2vw, 10px)", color: "#0369a1" }}
        >
          Description
        </label>
        <p
          className="w-full p-2.5 sm:p-3 rounded-xl min-h-24 sm:min-h-28 font-medium text-sm sm:text-base whitespace-pre-wrap mb-4 sm:mb-6"
          style={{ background: "rgba(255,255,255,0.65)", color: "#1e3a5f" }}
        >
          {description}
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => push("/pages/Edit/update")}
          className="w-full text-white py-3 sm:py-4 rounded-xl font-black shadow-lg uppercase tracking-widest text-xs sm:text-sm"
          style={{ background: "#0369a1" }}
        >
          Edit Information
        </motion.button>
      </motion.div>

      {/* Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full max-w-sm sm:max-w-md px-2"
      >
        <p
          className="mt-8 sm:mt-10 text-center italic font-medium"
          style={{ fontSize: "clamp(18px, 5vw, 40px)", color: "#1e3a5f" }}
        >
          &ldquo;Trade skills, gain time, grow together.&rdquo;
        </p>
      </motion.div>
    </div>
  );
}





