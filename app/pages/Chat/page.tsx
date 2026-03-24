"use client";
import { useState } from "react";

export default function ChatPage() {
  const [selectedPerson, setSelectedPerson] = useState("Jose");

  const contacts = [
    { id: 1, name: "Ken", status: "Online", avatar: "KM" },
    { id: 2, name: "Jose", status: "Away", avatar: "JM" },
    { id: 3, name: "Jacob", status: "Online", avatar: "JD" },
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-6 font-sans"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
      <div className="w-full max-w-87.5  bg-[#5F4F4F]/50  rounded-xl flex items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight text-center">
          Messages
        </h1>
      </div>

      <div className="w-full max-w-225 h-150 border border-gray-200  bg-[#28a8af]/42  flex flex-col md:flex-row shadow-xl rounded-2xl overflow-hidden">
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 p-4 overflow-y-auto">
          <h2 className="text-gray-400 font-semibold text-xs uppercase tracking-wider mb-4 px-2">
            Contacts
          </h2>
          <div className="flex flex-col gap-1">
            {contacts.map((person) => (
              <button
                key={person.id}
                onClick={() => setSelectedPerson(person.name)}
                className={`p-3 rounded-lg flex items-center gap-3 transition-all ${
                  selectedPerson === person.name
                    ? "bg-blue-50 text-blue-600 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${selectedPerson === person.name ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  {person.avatar}
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{person.name}</p>
                  <p className="text-[10px] opacity-70">{person.status}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-bold text-gray-800">{selectedPerson}</span>
          </div>

          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
            <div className="bg-blue-600 text-white p-3 px-4 rounded-2xl rounded-tr-none self-end max-w-[80%] text-sm shadow-sm">
              Hi {selectedPerson}! Are you free for a quick chat about the skill
              swap?
            </div>
            <div className="bg-gray-100 text-gray-800 p-3 px-4 rounded-2xl rounded-tl-none self-start max-w-[80%] text-sm">
              Hey! Yes, Im available. What did you have in mind?
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full h-11 px-4 rounded-full border border-gray-200 bg-[#28a8af]/42  text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all text-sm"
              />
              <button className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all shadow-md">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

     

      <div>
        <p className="text-[40px] mt-10 text-black text-center">
          A community is just a collection of shared hours.
        </p>
      </div>
    </div>
  );
}
