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
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
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
      const resolvedLogin = pickString(profile, [
        "username",
        "userName",
        "loginName",
        "email",
        "userEmail",
      ]);
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
        className="min-h-screen flex items-center justify-center text-white font-bold"
        style={{ backgroundImage: "url('/assets/TBBackround.jpeg')", backgroundSize: "cover" }}
      >
       
        Loading profile...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')", backgroundSize: "cover" }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#6F7887]/80 backdrop-blur-md p-6 rounded-2xl shadow-sm mb-4 w-full max-w-md border border-white/20"
      >
        <h1 className="text-xl font-black text-center text-white uppercase tracking-widest">
          Profile
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/30 backdrop-blur-md p-8 rounded-2xl shadow-md mb-4 w-full max-w-md flex flex-col items-center border border-white/20"
      >
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
          <Image src={toSafeImageSrc(image)} alt="Profile" fill sizes="128px" unoptimized className="object-cover" />
        </div>
        <p className="mt-4 text-xs font-black text-black uppercase tracking-[0.2em]">Profile Picture</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/30 backdrop-blur-md p-6 rounded-2xl shadow-md mb-4 w-full max-w-md border border-white/20"
      >
        <label className="block text-[10px] font-black text-black uppercase mb-2 ml-1 tracking-[0.2em]">
          Login Name
        </label>
        <p className="w-full p-3 bg-white/60 border-none rounded-xl text-gray-800 font-bold">
          {loginName}
        </p>

        <label className="block text-[10px] font-black text-black uppercase mb-2 ml-1 mt-4 tracking-[0.2em]">
          Profile Name
        </label>
        <p className="w-full p-3 bg-white/60 border-none rounded-xl text-gray-800 font-bold">
          {profileName}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/30 backdrop-blur-md p-6 rounded-2xl shadow-md w-full max-w-md border border-white/20"
      >
        <label className="block text-[10px] font-black text-black uppercase mb-2 ml-1 tracking-[0.2em]">
          Description
        </label>
        <p className="w-full p-3 bg-white/60 border-none rounded-xl text-gray-800 min-h-28 font-medium whitespace-pre-wrap mb-6">
          {description}
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => push("/pages/Edit/update")}
          className="w-full bg-[#28a8af] text-white py-4 rounded-xl font-black shadow-lg uppercase tracking-widest text-sm"
        >
          Edit Information
        </motion.button>
      </motion.div>
      <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <p className="text-[30px] md:text-[40px] mt-10 text-black text-center italic font-medium">
                &ldquo;Trade skills, gain time, grow together.&rdquo;
              </p>
            </motion.div>
    </div>
  );
}







