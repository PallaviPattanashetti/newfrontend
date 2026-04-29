"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { DmInboxItem, DmMessage } from "@/lib/dm-services";

type DmConversationPanelProps = {
  activeConversation: DmInboxItem | null;
  currentUsername: string;
  draftMessage: string;
  errorMessage: string;
  isConnecting: boolean;
  isLoadingMessages: boolean;
  isSendDisabled: boolean;
  messages: DmMessage[];
  onDraftMessageChange: (value: string) => void;
  onSend: () => void;
  selectedUsername: string;
};

const formatMessageTimestamp = (value: string) => {
  const parsed = new Date(value.endsWith("Z") || value.includes("+") ? value : value + "Z");
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getInitials = (displayName: string, username: string) => {
  const source = displayName.trim() || username.trim();
  if (!source) {
    return "?";
  }

  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || source.slice(0, 2).toUpperCase();
};

export function DmConversationPanel({
  activeConversation,
  currentUsername,
  draftMessage,
  errorMessage,
  isConnecting,
  isLoadingMessages,
  isSendDisabled,
  messages,
  onDraftMessageChange,
  onSend,
  selectedUsername,
}: DmConversationPanelProps) {
  const router = useRouter();
  const headerName = activeConversation?.otherDisplayName || selectedUsername || "Choose a conversation";
  const headerUsername = activeConversation?.otherUsername || selectedUsername;

  return (
    <div className="flex-1 flex flex-col bg-white/30">
      <div className="p-4 border-b border-gray-100/20 flex items-center gap-3 bg-white/40">
        {activeConversation?.otherProfilePictureUrl ? (
          <img
            src={activeConversation.otherProfilePictureUrl}
            alt={headerName}
            className="h-11 w-11 rounded-full object-cover border border-white/70 shadow-sm"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-[#5F4F4F]/15 text-xs font-bold text-gray-700 shadow-sm">
            {getInitials(activeConversation?.otherDisplayName ?? "", headerUsername ?? "")}
          </div>
        )}

        <div>
          <p className="font-bold text-gray-800">{headerName}</p>
          <p className="text-xs text-gray-600">
            {headerUsername ? `@${headerUsername}` : "Select a conversation from the inbox."}
          </p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
        <AnimatePresence>
          <motion.div
            key={headerUsername || "empty-conversation"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {!headerUsername ? (
              <div className="rounded-3xl bg-white/55 px-5 py-6 text-center text-sm text-gray-600 shadow-sm">
                Choose a conversation from the left or enter a username to start chatting.
              </div>
            ) : null}

            {headerUsername && isLoadingMessages ? (
              <div className="rounded-3xl bg-white/55 px-5 py-6 text-center text-sm text-gray-600 shadow-sm">
                Loading conversation...
              </div>
            ) : null}

            {headerUsername && !isLoadingMessages && messages.length === 0 ? (
              <div className="rounded-3xl bg-white/55 px-5 py-6 text-center text-sm text-gray-600 shadow-sm">
                No messages with {headerName} yet.
              </div>
            ) : null}

            {messages.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {messages.map((entry) => (
                  <li
                    key={`${entry.id}-${entry.sentAtUtc}`}
                    className={`flex ${entry.isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                        entry.isMine
                          ? "bg-blue-600 text-white rounded-tr-md"
                          : "bg-white text-gray-800 rounded-tl-md"
                      }`}
                    >
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-75">
                        {entry.isMine ? currentUsername : entry.senderDisplayName || entry.senderUsername}
                      </p>
                      <p>{entry.message}</p>
                      <p className="mt-2 text-[11px] opacity-75">
                        {formatMessageTimestamp(entry.sentAtUtc)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-4 bg-white/50 border-t border-gray-100/20 backdrop-blur-sm">
        {isConnecting ? (
          <p className="mb-3 text-sm text-gray-700">Connecting to messaging service...</p>
        ) : null}
        {errorMessage ? (
          <p className="mb-3 text-sm text-red-700">{errorMessage}</p>
        ) : null}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={headerUsername ? `Message ${headerName}` : "Select a conversation first"}
            value={draftMessage}
            onChange={(e) => onDraftMessageChange(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (!isSendDisabled) {
                  onSend();
                }
              }
            }}
            className="w-full h-11 px-4 rounded-full border border-gray-200 bg-white/80 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm"
          />
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              if (!headerUsername) {
                return;
              }

              router.push(`/pages/Credit?to=${encodeURIComponent(headerUsername)}`);
            }}
            disabled={!headerUsername}
            className="w-11 h-11 bg-yellow-400 text-black rounded-full flex items-center justify-center shadow-md border border-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send credits"
            title="Send credits"
          >
            <img
              src="/assets/icons8-gift-100.png"
              alt="Gift"
              className="h-5 w-5 object-contain"
            />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onSend}
            disabled={isSendDisabled}
            className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}