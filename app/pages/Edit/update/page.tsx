
"use client";
import React, { ChangeEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  checkToken,
  getProfile,
  saveProfile,
  uploadProfileImage,
} from "@/lib/user-services";
import { useRouter } from "next/navigation";
import Image from "next/image";

const DEFAULT_IMAGE = "/assets/UserAccounts.jpeg";
const ALLOWED_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

const isPersistableImageSrc = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const toSafeImageSrc = (value: string): string =>
  isSafeImageSrc(value) ? value.trim() : DEFAULT_IMAGE;

const toPersistableImageSrc = (value: string): string =>
  isPersistableImageSrc(value) ? value.trim() : DEFAULT_IMAGE;

const pickString = (
  obj: Record<string, unknown> | null,
  keys: string[],
): string => {
  if (!obj) return "";
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

export default function UpdateProfilePage() {
  const { push } = useRouter();
  const [name, setName] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [image, setImage] = useState<string>(DEFAULT_IMAGE);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
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
      setSelectedImageFile(null);
      setImageUrlInput(resolvedImage && !resolvedImage.startsWith("data:") ? resolvedImage : "");
      setIsLoading(false);
    };
    void load();
  }, [push]);

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
      setStatusMessage("Only JPEG, PNG, and WEBP are supported.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage("Please choose an image smaller than 2MB for now.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImage(dataUrl);
      setSelectedImageFile(file);
      setImageUrlInput("");
      setStatusMessage("Image attached. Save changes to persist it.");
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (nextValue: string) => {
    setImageUrlInput(nextValue);
    setSelectedImageFile(null);
    const trimmed = nextValue.trim();
    if (!trimmed) { setImage(DEFAULT_IMAGE); setStatusMessage(""); return; }
    if (isPersistableImageSrc(trimmed)) { setImage(trimmed); setStatusMessage(""); return; }
    setStatusMessage("Please enter a full image URL starting with http:// or https://.");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage("");
    let profilePictureUrl = toPersistableImageSrc(image);
    if (selectedImageFile) {
      setStatusMessage("Uploading image to blob storage...");
      const uploadResult = await uploadProfileImage(selectedImageFile);
      if (uploadResult.imageUrl) {
        profilePictureUrl = uploadResult.imageUrl;
      } else {
        setIsSaving(false);
        setStatusMessage(uploadResult.error || "Image upload failed.");
        return;
      }
    }
    const success = await saveProfile({ name: name.trim(), bio: bio.trim(), profilePictureUrl });
    setIsSaving(false);
    if (success) { push("/pages/Edit"); return; }
    setStatusMessage("Could not save profile. Verify API DTO names and blob upload endpoint configuration.");
  };

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
        className="backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-sm mb-3 sm:mb-4 w-full max-w-sm sm:max-w-md border border-white/50 relative"
        style={{ background: "rgba(255,255,255,0.45)" }}
      >
        <button
          onClick={() => push("/pages/Edit")}
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-xl sm:text-2xl font-black"
          style={{ color: "#0369a1" }}
          aria-label="Back to profile"
        >
          ←
        </button>
        <h1
          className="text-sm sm:text-base md:text-xl font-black text-center uppercase tracking-widest"
          style={{ color: "#0369a1" }}
        >
          Edit Information
        </h1>
      </motion.div>

     
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="backdrop-blur-md p-5 sm:p-8 rounded-2xl shadow-md mb-3 sm:mb-4 w-full max-w-sm sm:max-w-md flex flex-col items-center border border-white/50"
        style={{ background: "rgba(255,255,255,0.35)" }}
      >
        <div className="relative">
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
          <label className="absolute bottom-0 right-0 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-4 border-white cursor-pointer shadow-xl hover:scale-110 transition-transform active:scale-95"
            style={{ background: "#0ea5e9" }}
          >
            <span className="text-lg sm:text-2xl font-bold">+</span>
            <input
              type="file"
              className="hidden"
              onChange={handleImage}
              accept="image/jpeg,image/png,image/webp"
            />
          </label>
        </div>

        <input
          type="url"
          value={imageUrlInput}
          onChange={(e) => handleImageUrlChange(e.target.value)}
          placeholder="Or paste profile picture URL"
          className="mt-4 sm:mt-5 w-full p-2.5 sm:p-3 border-none rounded-xl outline-none font-medium text-sm sm:text-base focus:ring-2 focus:ring-sky-400"
          style={{ background: "rgba(255,255,255,0.65)", color: "#1e3a5f" }}
        />
      </motion.div>

      {/* Fields box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-md w-full max-w-sm sm:max-w-md border border-white/50"
        style={{ background: "rgba(255,255,255,0.35)" }}
      >
        <label
          className="block font-black uppercase mb-1.5 sm:mb-2 ml-1 tracking-[0.2em]"
          style={{ fontSize: "clamp(9px, 2vw, 10px)", color: "#0369a1" }}
        >
          Username
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2.5 sm:p-3 border-none rounded-xl outline-none font-bold mb-4 sm:mb-6 text-sm sm:text-base focus:ring-2 focus:ring-sky-400"
          style={{ background: "rgba(255,255,255,0.65)", color: "#1e3a5f" }}
        />

        <label
          className="block font-black uppercase mb-1.5 sm:mb-2 ml-1 tracking-[0.2em]"
          style={{ fontSize: "clamp(9px, 2vw, 10px)", color: "#0369a1" }}
        >
          Description
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full p-2.5 sm:p-3 border-none rounded-xl outline-none h-24 sm:h-28 resize-none mb-4 sm:mb-6 font-medium text-sm sm:text-base focus:ring-2 focus:ring-sky-400"
          style={{ background: "rgba(255,255,255,0.65)", color: "#1e3a5f" }}
        />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className="w-full text-white py-3 sm:py-4 rounded-xl font-black shadow-lg uppercase tracking-widest text-xs sm:text-sm"
          style={{ background: "#0369a1" }}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </motion.button>

        {statusMessage ? (
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-center" style={{ color: "#1e3a5f" }}>
            {statusMessage}
          </p>
        ) : null}
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
          style={{
            fontSize: "clamp(18px, 5vw, 40px)",
            color: "#1e3a5f",
          }}
        >
          &ldquo;The best way to find yourself is to lose yourself in the
          service of others.&rdquo;
        </p>
      </motion.div>
    </div>
  );
}






