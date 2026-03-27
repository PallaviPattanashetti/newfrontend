import React from "react";

const page = () => {
  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-12 font-sans"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
      <div className="w-full max-w-87.5 bg-[#5F4F4F]/50 rounded-xl flex items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
        Edit your Profile
        </h1>
      </div>
    </div>
  );
};

export default page;
