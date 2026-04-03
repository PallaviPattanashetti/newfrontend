"use client";
import React, { ChangeEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { checkToken, getProfile, saveProfile } from "@/lib/user-services";
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

export default function UpdateProfilePage() {
  const { push } = useRouter();
  const [name, setName] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [image, setImage] = useState<string>(DEFAULT_IMAGE);
  const [imageUrlInput, setImageUrlInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!checkToken()) {
        push("/pages/Signin");
        return;
      }

      const profile = await getProfile();
      const resolvedName = pickString(profile, ["name", "displayName", "userName", "fullName"]);
      const resolvedBio = pickString(profile, ["bio", "aboutMe", "description"]);
      const resolvedImage = pickString(profile, ["profilePictureUrl", "imageUrl", "avatarUrl"]);

      setName(resolvedName || "");
      setBio(resolvedBio || "");
      setImage(resolvedImage || DEFAULT_IMAGE);
      setImageUrlInput(
        resolvedImage && !resolvedImage.startsWith("data:") ? resolvedImage : ""
      );
      setIsLoading(false);
    };

    void load();
  }, [push]);

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage("Please choose an image smaller than 2MB for now.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImage(dataUrl);
      setImageUrlInput("");
      setStatusMessage("Image attached. Save changes to persist it.");
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (nextValue: string) => {
    setImageUrlInput(nextValue);

    const trimmed = nextValue.trim();
    if (!trimmed) {
      setImage(DEFAULT_IMAGE);
      setStatusMessage("");
      return;
    }

    if (isSafeImageSrc(trimmed)) {
      setImage(trimmed);
      setStatusMessage("");
      return;
    }

    setStatusMessage("Please enter a full image URL starting with http:// or https://.");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage("");

    const success = await saveProfile({
      name: name.trim(),
      bio: bio.trim(),
      profilePictureUrl: toSafeImageSrc(image),
    });

    setIsSaving(false);

    if (success) {
      push("/pages/Edit");
      return;
    }

    setStatusMessage("Could not save profile. Please verify your API DTO field names.");
  };

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
        className="bg-[#6F7887]/80 backdrop-blur-md p-6 rounded-2xl shadow-sm mb-4 w-full max-w-md border border-white/20 relative"
      >
        <button
          onClick={() => push("/pages/Edit")}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-2xl font-black"
          aria-label="Back to profile"
        >
          ←
        </button>
        <h1 className="text-xl font-black text-center text-white uppercase tracking-widest">
          Edit Information
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/30 backdrop-blur-md p-8 rounded-2xl shadow-md mb-4 w-full max-w-md flex flex-col items-center border border-white/20"
      >
        <div className="relative">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <Image src={toSafeImageSrc(image)} alt="Profile" fill sizes="128px" unoptimized className="object-cover" />
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

        <input
          type="url"
          value={imageUrlInput}
          onChange={(e) => handleImageUrlChange(e.target.value)}
          placeholder="Or paste profile picture URL"
          className="mt-5 w-full p-3 bg-white/60 border-none rounded-xl focus:ring-2 focus:ring-[#28a8af] outline-none text-gray-800 font-medium"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/30 backdrop-blur-md p-6 rounded-2xl shadow-md w-full max-w-md border border-white/20"
      >
        <label className="block text-[10px] font-black text-black uppercase mb-2 ml-1 tracking-[0.2em]">
          Username
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-white/60 border-none rounded-xl focus:ring-2 focus:ring-[#28a8af] outline-none text-gray-800 font-bold mb-6"
        />

        <label className="block text-[10px] font-black text-black uppercase mb-2 ml-1 tracking-[0.2em]">
          Description
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full p-3 bg-white/60 border-none rounded-xl focus:ring-2 focus:ring-[#28a8af] outline-none text-gray-800 h-28 resize-none mb-6 font-medium"
        />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-[#28a8af] text-white py-4 rounded-xl font-black shadow-lg uppercase tracking-widest text-sm"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </motion.button>

        {statusMessage ? (
          <p className="mt-4 text-sm text-black/80 text-center">{statusMessage}</p>
        ) : null}
      </motion.div>
    </div>
  );
}
