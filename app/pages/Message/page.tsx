"use client";
import { useMemo, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  startConnection,
  registerUser,
  sendPrivateMessage,
  stopConnection,
} from "@/lib/signalservices";

type ChatEntry = {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
};

const isExpectedSignalRStartupAbort = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes("stopped during negotiation");
};

function ChatContent() {
  const searchParams = useSearchParams();

  const contactQuery = searchParams.get("contact");

  const [selectedPerson, setSelectedPerson] = useState(contactQuery?.trim() ?? "");
  const [username, setUsername] = useState("");
  const [toUser, setToUser] = useState("");
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isChatReady, setIsChatReady] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  const chatHistoryStorageKey = useMemo(
    () => (username ? `private-chat-history:${username.toLowerCase()}` : ""),
    [username],
  );

  const appendChatEntry = (entry: ChatEntry) => {
    setChatHistory((prev) => [...prev, entry]);
  };

  const activePerson = useMemo(() => {
    if (selectedPerson) {
      return selectedPerson;
    }

    if (contactQuery?.trim()) {
      return contactQuery.trim();
    }

    if (toUser.trim()) {
      return toUser.trim();
    }

    return "";
  }, [contactQuery, selectedPerson, toUser]);

  const conversations = useMemo(() => {
    const latestByUser = new Map<string, ChatEntry>();

    for (const entry of chatHistory) {
      const counterpart = entry.from === username ? entry.to : entry.from;
      if (!counterpart) {
        continue;
      }

      const existing = latestByUser.get(counterpart);
      if (!existing || new Date(entry.timestamp).getTime() >= new Date(existing.timestamp).getTime()) {
        latestByUser.set(counterpart, entry);
      }
    }

    return [...latestByUser.entries()]
      .map(([name, latestEntry]) => ({
        name,
        latestEntry,
      }))
      .sort(
        (left, right) =>
          new Date(right.latestEntry.timestamp).getTime() -
          new Date(left.latestEntry.timestamp).getTime(),
      );
  }, [chatHistory, username]);

  const visibleMessages = useMemo(() => {
    if (!activePerson) {
      return [];
    }

    return chatHistory.filter(
      (entry) =>
        (entry.from === username && entry.to === activePerson) ||
        (entry.from === activePerson && entry.to === username),
    );
  }, [activePerson, chatHistory, username]);

  useEffect(() => {
    if (!contactQuery?.trim()) {
      return;
    }

    const contactName = contactQuery.trim();
    setSelectedPerson(contactName);
    setToUser(contactName);
  }, [contactQuery]);

  useEffect(() => {
    if (!chatHistoryStorageKey || typeof window === "undefined") {
      return;
    }

    const raw = localStorage.getItem(chatHistoryStorageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as ChatEntry[];
      setChatHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      setChatHistory([]);
    }
  }, [chatHistoryStorageKey]);

  useEffect(() => {
    if (!chatHistoryStorageKey || typeof window === "undefined") {
      return;
    }

    localStorage.setItem(chatHistoryStorageKey, JSON.stringify(chatHistory));
  }, [chatHistory, chatHistoryStorageKey]);

  useEffect(() => {
    let isCancelled = false;

    const init = async () => {
      setIsConnecting(true);
      setIsChatReady(false);
      setConnectionError("");

      const storedUsername = localStorage.getItem("username");

      if (!storedUsername) {
        console.error("No username found. User not logged in.");
        if (!isCancelled) {
          setConnectionError("No username found. Sign in again before opening messages.");
          setIsConnecting(false);
        }
        return;
      }

      if (!isCancelled) {
        setUsername(storedUsername);
        if (contactQuery?.trim()) {
          setSelectedPerson(contactQuery.trim());
          setToUser(contactQuery.trim());
        }
      }

      try {
        await startConnection((from, msg) => {
          appendChatEntry({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            from,
            to: storedUsername,
            message: msg,
            timestamp: new Date().toISOString(),
          });

          if (!isCancelled) {
            setSelectedPerson((current) => current || from);
            setToUser((current) => current || from);
          }
        });

        await registerUser(storedUsername);

        if (!isCancelled) {
          setIsChatReady(true);
        }
      } catch (error) {
        if (isCancelled || isExpectedSignalRStartupAbort(error)) {
          return;
        }

        const errorMessage = error instanceof Error ? error.message : "Unable to connect to messaging service.";
        console.error("SignalR init failed", error);
        if (!isCancelled) {
          setConnectionError(errorMessage);
        }
      } finally {
        if (!isCancelled) {
          setIsConnecting(false);
        }
      }
    };

    void init();

    return () => {
      isCancelled = true;
      void stopConnection();
    };
  }, [contactQuery]);

  const handleSend = async () => {
    if (!isChatReady || !toUser.trim() || !message.trim()) {
      return;
    }

    try {
      const recipient = toUser.trim();
      const trimmedMessage = message.trim();

      await sendPrivateMessage(recipient, username, trimmedMessage);
      appendChatEntry({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        from: username,
        to: recipient,
        message: trimmedMessage,
        timestamp: new Date().toISOString(),
      });
      setSelectedPerson(recipient);
      setMessage("");
      setConnectionError("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to send message.";
      console.error("SignalR send failed", error);
      setConnectionError(errorMessage);
      setIsChatReady(false);
    }
  };

  const isSendDisabled = !isChatReady || !toUser.trim() || !message.trim();

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-6 font-sans"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-87.5 bg-[#5F4F4F]/50 rounded-xl flex flex-col items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
          Messages
        </h1>
        <p className="mt-2 text-sm font-medium text-white/90 text-center">
          Signed in as {username || "..."}
        </p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-225 h-150 border border-gray-200 bg-[#28a8af]/40 backdrop-blur-md flex flex-col md:flex-row shadow-xl rounded-2xl overflow-hidden"
      >
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-gray-100 bg-white/60 p-4 overflow-y-auto">
          <h2 className="text-gray-500 font-semibold text-xs uppercase tracking-wider mb-4 px-2">
            Chats
          </h2>
          <input
            type="text"
            placeholder="Send to..."
            value={toUser}
            onChange={(e) => {
              const nextUser = e.target.value;
              setToUser(nextUser);
              if (nextUser.trim()) {
                setSelectedPerson(nextUser.trim());
              }
            }}
            className="mb-4 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-blue-300"
          />
          <div className="flex flex-col gap-2">
            {conversations.length === 0 ? (
              <div className="rounded-2xl bg-white/60 px-3 py-4 text-sm text-gray-600">
                Your recent conversations will appear here.
              </div>
            ) : (
              conversations.map(({ name, latestEntry }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setSelectedPerson(name);
                    setToUser(name);
                  }}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    activePerson === name
                      ? "border-blue-400 bg-blue-100/80"
                      : "border-white/50 bg-white/60 hover:bg-white/80"
                  }`}
                >
                  <p className="font-semibold text-gray-900">{name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-600">{latestEntry.message}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white/30">
          <div className="p-4 border-b border-gray-100/20 flex items-center gap-3 bg-white/40">
            <motion.div
              key={activePerson}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 bg-green-500 rounded-full"
            />
            <div>
              <p className="font-bold text-gray-800">{activePerson || "Choose a conversation"}</p>
              <p className="text-xs text-gray-600">Signed in as {username || "..."}</p>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
            <AnimatePresence>
              <motion.div
                key={activePerson}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                {visibleMessages.length === 0 ? (
                  <div className="rounded-3xl bg-white/55 px-5 py-6 text-center text-sm text-gray-600 shadow-sm">
                    {activePerson
                      ? `No messages with ${activePerson} yet.`
                      : "Choose a conversation from the left or start a new one."}
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {visibleMessages.map((entry) => {
                      const isOwnMessage = entry.from === username;

                      return (
                        <li
                          key={entry.id}
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                              isOwnMessage
                                ? "bg-blue-600 text-white rounded-tr-md"
                                : "bg-white text-gray-800 rounded-tl-md"
                            }`}
                          >
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-75">
                              {isOwnMessage ? username : entry.from}
                            </p>
                            <p>{entry.message}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="p-4 bg-white/50 border-t border-gray-100/20 backdrop-blur-sm">
            {isConnecting ? (
              <p className="mb-3 text-sm text-gray-700">Connecting to messaging service...</p>
            ) : null}
            {connectionError ? (
              <p className="mb-3 text-sm text-red-700">{connectionError}</p>
            ) : null}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-11 px-4 rounded-full border border-gray-200 bg-white/80 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                disabled={isSendDisabled}
                className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-[32px] md:text-[40px] mt-10 text-gray-900 text-center font-light italic">
          &ldquo;A community is just a collection of shared hours.&rdquo;
        </p>
      </motion.div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatContent />
    </Suspense>
  );
}
