"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { DmConversationPanel } from "@/app/components/messages/DmConversationPanel";
import { DmInboxList } from "@/app/components/messages/DmInboxList";
import {
  getDmConversationMessages,
  getDmInbox,
  getDmUnreadCount,
  markDmConversationRead,
  notifyDmUnreadChanged,
  postDmMessage,
  type DmInboxItem,
  type DmMessage,
  type LiveDmPayload,
} from "@/lib/dm-services";
import { getDiscoverableProfiles, getStoredChatUsername } from "@/lib/user-services";
import { registerUser, sendPrivateMessage, startConnection, stopConnection } from "@/lib/signalservices";

type RecipientSuggestion = {
  username: string;
  displayName: string;
  profilePictureUrl: string | null;
};

const isExpectedSignalRStartupAbort = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes("stopped during negotiation");
};

const sortInboxItems = (items: DmInboxItem[]) =>
  [...items].sort(
    (left, right) =>
      new Date(right.lastMessageAtUtc).getTime() - new Date(left.lastMessageAtUtc).getTime(),
  );

const sortMessages = (items: DmMessage[]) =>
  [...items].sort(
    (left, right) => new Date(left.sentAtUtc).getTime() - new Date(right.sentAtUtc).getTime(),
  );

const buildMessageIdentity = (
  message: Pick<DmMessage, "id" | "senderUsername" | "message" | "sentAtUtc">,
) => {
  if (message.id > 0) return `id:${message.id}`;
  return `${message.senderUsername}|${message.message}|${message.sentAtUtc}`;
};

const mergeMessages = (existing: DmMessage[], incoming: DmMessage[]) => {
  const merged = new Map<string, DmMessage>();
  for (const message of [...existing, ...incoming]) {
    merged.set(buildMessageIdentity(message), message);
  }
  return sortMessages([...merged.values()]);
};

const buildOptimisticMessage = (recipient: string, currentUsername: string, message: string): DmMessage => ({
  id: -(Date.now()),
  chatThreadId: 0,
  senderUserId: 0,
  senderUsername: currentUsername,
  senderDisplayName: currentUsername,
  message,
  sentAtUtc: new Date().toISOString(),
  readAtUtc: null,
  isMine: true,
});

const buildLiveMessage = (payload: LiveDmPayload, currentUsername: string): DmMessage => ({
  id: 0,
  chatThreadId: 0,
  senderUserId: 0,
  senderUsername: payload.from,
  senderDisplayName: payload.from,
  message: payload.message,
  sentAtUtc: payload.sentAtUtc,
  readAtUtc: payload.readAtUtc,
  isMine: payload.from.toLowerCase() === currentUsername.toLowerCase(),
});

const BG = `
  radial-gradient(ellipse at 15% 15%, #38bdf8 0%, transparent 50%),
  radial-gradient(ellipse at 85% 10%, #818cf8 0%, transparent 45%),
  radial-gradient(ellipse at 80% 85%, #34d399 0%, transparent 50%),
  radial-gradient(ellipse at 10% 80%, #fb923c 0%, transparent 45%),
  linear-gradient(160deg, #e0f2fe 0%, #bae6fd 60%, #7dd3fc 100%)
`;

function DmPageContent() {
  const searchParams = useSearchParams();
  const contactQuery = searchParams.get("contact")?.trim() ?? "";

  const [currentUsername, setCurrentUsername] = useState("");
  const [draftRecipient, setDraftRecipient] = useState(contactQuery);
  const [selectedUsername, setSelectedUsername] = useState(contactQuery);
  const [draftMessage, setDraftMessage] = useState("");
  const [inboxItems, setInboxItems] = useState<DmInboxItem[]>([]);
  const [recipientSuggestions, setRecipientSuggestions] = useState<RecipientSuggestion[]>([]);
  const [isSearchingRecipients, setIsSearchingRecipients] = useState(false);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [isInboxLoading, setIsInboxLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isChatReady, setIsChatReady] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  const selectedUsernameRef = useRef(selectedUsername);
  const currentUsernameRef = useRef(currentUsername);

  useEffect(() => { selectedUsernameRef.current = selectedUsername; }, [selectedUsername]);
  useEffect(() => { currentUsernameRef.current = currentUsername; }, [currentUsername]);

  const activeConversation = useMemo(
    () => inboxItems.find((item) => item.otherUsername.toLowerCase() === selectedUsername.toLowerCase()) ?? null,
    [inboxItems, selectedUsername],
  );

  useEffect(() => {
    const query = draftRecipient.trim();
    if (!query) { setRecipientSuggestions([]); setIsSearchingRecipients(false); return; }

    let isCancelled = false;
    setIsSearchingRecipients(true);

    const timeoutId = window.setTimeout(async () => {
      const normalizedQuery = query.toLowerCase();
      const inboxMatches: RecipientSuggestion[] = inboxItems
        .filter((item) => item.otherUsername.toLowerCase().includes(normalizedQuery) || item.otherDisplayName.toLowerCase().includes(normalizedQuery))
        .map((item) => ({ username: item.otherUsername, displayName: item.otherDisplayName || item.otherUsername, profilePictureUrl: item.otherProfilePictureUrl }));

      try {
        const profiles = await getDiscoverableProfiles(query, { skip: 0, take: 8, random: false, onlyComplete: false });
        if (isCancelled) return;

        const merged = new Map<string, RecipientSuggestion>();
        for (const match of inboxMatches) merged.set(match.username.toLowerCase(), match);
        for (const profile of profiles) {
          const username = profile.username.trim();
          if (!username) continue;
          const key = username.toLowerCase();
          if (!merged.has(key)) merged.set(key, { username, displayName: profile.profileName || username, profilePictureUrl: profile.profilePictureUrl || null });
        }

        const nextSuggestions = [...merged.values()].filter((item) => item.username.toLowerCase() !== currentUsername.toLowerCase()).slice(0, 8);
        setRecipientSuggestions(nextSuggestions);
      } catch (error) {
        if (!isCancelled) { console.error("Recipient search failed", error); setRecipientSuggestions(inboxMatches.slice(0, 8)); }
      } finally {
        if (!isCancelled) setIsSearchingRecipients(false);
      }
    }, 220);

    return () => { isCancelled = true; window.clearTimeout(timeoutId); };
  }, [currentUsername, draftRecipient, inboxItems]);

  const refreshInbox = useCallback(async () => {
    const inbox = sortInboxItems(await getDmInbox());
    setInboxItems(inbox);
    setIsInboxLoading(false);
    if (contactQuery) { setSelectedUsername(contactQuery); setDraftRecipient(contactQuery); return; }
    if (!selectedUsernameRef.current && inbox.length > 0) { setSelectedUsername(inbox[0].otherUsername); setDraftRecipient(inbox[0].otherUsername); }
  }, [contactQuery]);

  const refreshUnreadCount = useCallback(async () => {
    await getDmUnreadCount();
    notifyDmUnreadChanged();
  }, []);

  const openConversation = async (otherUsername: string) => {
    setSelectedUsername(otherUsername);
    setDraftRecipient(otherUsername);
  };

  const handleSelectRecipientSuggestion = (username: string) => { void openConversation(username); };

  useEffect(() => {
    let isCancelled = false;
    const init = async () => {
      setIsConnecting(true);
      setConnectionError("");
      const storedUsername = getStoredChatUsername();
      if (!storedUsername) {
        if (!isCancelled) { setConnectionError("No username found. Sign in again before opening messages."); setIsConnecting(false); setIsInboxLoading(false); }
        return;
      }
      if (!isCancelled) setCurrentUsername(storedUsername);

      try {
        await Promise.all([refreshInbox(), refreshUnreadCount()]);
        await startConnection(async (payload) => {
          const username = currentUsernameRef.current;
          if (!username) return;
          if (payload.from.toLowerCase() === username.toLowerCase()) return;
          const belongsToCurrentUser = payload.from.toLowerCase() === username.toLowerCase() || payload.to.toLowerCase() === username.toLowerCase();
          if (!belongsToCurrentUser) return;
          const otherUsername = payload.from.toLowerCase() === username.toLowerCase() ? payload.to : payload.from;
          if (selectedUsernameRef.current.toLowerCase() === otherUsername.toLowerCase()) {
            setMessages((prev) => mergeMessages(prev, [buildLiveMessage(payload, username)]));
            if (payload.to.toLowerCase() === username.toLowerCase()) await markDmConversationRead(otherUsername);
          }
          await Promise.all([refreshInbox(), refreshUnreadCount()]);
        });
        await registerUser(storedUsername);
        if (!isCancelled) setIsChatReady(true);
      } catch (error) {
        if (isCancelled || isExpectedSignalRStartupAbort(error)) return;
        const errorMessage = error instanceof Error ? error.message : "Unable to connect to messaging service.";
        console.error("SignalR init failed", error);
        if (!isCancelled) setConnectionError(errorMessage);
      } finally {
        if (!isCancelled) setIsConnecting(false);
      }
    };
    void init();
    return () => { isCancelled = true; void stopConnection(); };
  }, [contactQuery, refreshInbox, refreshUnreadCount]);

  useEffect(() => {
    if (!selectedUsername) { setMessages([]); return; }
    let isCancelled = false;
    const loadConversation = async () => {
      setIsMessagesLoading(true);
      try {
        const conversationMessages = sortMessages(await getDmConversationMessages(selectedUsername));
        if (isCancelled) return;
        setMessages(conversationMessages);
        const activeInboxItem = inboxItems.find((item) => item.otherUsername.toLowerCase() === selectedUsername.toLowerCase());
        if (activeInboxItem?.unreadCount) {
          await markDmConversationRead(selectedUsername);
          if (isCancelled) return;
          setInboxItems((prev) => prev.map((item) => item.otherUsername.toLowerCase() === selectedUsername.toLowerCase() ? { ...item, unreadCount: 0 } : item));
          await refreshUnreadCount();
        }
      } catch (error) {
        console.error("DM conversation load failed", error);
      } finally {
        if (!isCancelled) setIsMessagesLoading(false);
      }
    };
    void loadConversation();
    return () => { isCancelled = true; };
  }, [inboxItems, refreshUnreadCount, selectedUsername]);

  useEffect(() => {
    if (!contactQuery) return;
    setSelectedUsername(contactQuery);
    setDraftRecipient(contactQuery);
  }, [contactQuery]);

  const handleSend = async () => {
    const recipient = draftRecipient.trim();
    const trimmedMessage = draftMessage.trim();
    if (!isChatReady || !recipient || !trimmedMessage) return;

    const optimisticMessage = buildOptimisticMessage(recipient, currentUsername, trimmedMessage);
    setMessages((prev) => mergeMessages(prev, [optimisticMessage]));
    setDraftMessage("");
    setSelectedUsername(recipient);
    setDraftRecipient(recipient);
    setConnectionError("");

    setInboxItems((prev) => {
      const existing = prev.find((item) => item.otherUsername.toLowerCase() === recipient.toLowerCase());
      const nextItem: DmInboxItem = existing
        ? { ...existing, lastMessagePreview: trimmedMessage, lastMessageAtUtc: optimisticMessage.sentAtUtc, lastMessageFromUsername: currentUsername }
        : { threadId: 0, otherUserId: 0, otherUsername: recipient, otherDisplayName: recipient, otherProfilePictureUrl: null, lastMessagePreview: trimmedMessage, lastMessageAtUtc: optimisticMessage.sentAtUtc, lastMessageFromUsername: currentUsername, unreadCount: 0 };
      const filtered = prev.filter((item) => item.otherUsername.toLowerCase() !== recipient.toLowerCase());
      return sortInboxItems([nextItem, ...filtered]);
    });

    try {
      await sendPrivateMessage(recipient, currentUsername, trimmedMessage);
    } catch (error) {
      console.error("SignalR live send failed", error);
      const sent = await postDmMessage(recipient, trimmedMessage);
      if (!sent) { setConnectionError("Unable to send message."); return; }
    }
    await refreshInbox();
  };

  const isSendDisabled = !isChatReady || !draftRecipient.trim() || !draftMessage.trim();

  return (
    <div
      className="min-h-screen flex flex-col items-center px-3 py-4 sm:px-4 sm:py-5 md:p-6 font-sans"
      style={{ background: BG }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm sm:max-w-2xl md:max-w-7xl flex items-center justify-between gap-2 sm:gap-3 my-3 sm:my-4"
      >
        <h1
          className="font-bold tracking-tight"
          style={{ fontSize: "clamp(20px, 4vw, 32px)", color: "#0369a1" }}
        >
          Messages
        </h1>
        <p
          className="text-[10px] sm:text-xs md:text-sm font-medium rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 border border-white/50 shadow-sm whitespace-nowrap backdrop-blur-sm"
          style={{ background: "rgba(255,255,255,0.55)", color: "#1e3a5f" }}
        >
          Signed in as <span className="font-black" style={{ color: "#0369a1" }}>{currentUsername || "..."}</span>
        </p>
      </motion.div>

      {/* Chat */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm sm:max-w-2xl md:max-w-7xl border border-white/50 backdrop-blur-md flex flex-col md:flex-row shadow-xl rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.45)",
          height: "clamp(500px, 76vh, 840px)",
        }}
      >
        <DmInboxList
          draftRecipient={draftRecipient}
          inboxItems={inboxItems}
          isLoading={isInboxLoading}
          isSearchingRecipients={isSearchingRecipients}
          recipientSuggestions={recipientSuggestions}
          selectedUsername={selectedUsername}
          onDraftRecipientChange={setDraftRecipient}
          onSelectRecipientSuggestion={handleSelectRecipientSuggestion}
          onSelect={openConversation}
        />

        <DmConversationPanel
          activeConversation={activeConversation}
          currentUsername={currentUsername}
          draftMessage={draftMessage}
          errorMessage={connectionError}
          isConnecting={isConnecting}
          isLoadingMessages={isMessagesLoading}
          isSendDisabled={isSendDisabled}
          messages={messages}
          onDraftMessageChange={setDraftMessage}
          onSend={handleSend}
          selectedUsername={selectedUsername}
        />
      </motion.div>

      {/* Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm sm:max-w-2xl md:max-w-4xl px-2"
      >
        <p
          className="mt-8 sm:mt-10 text-center font-light italic"
          style={{ fontSize: "clamp(16px, 4vw, 40px)", color: "#1e3a5f" }}
        >
          &ldquo;A community is just a collection of shared hours.&rdquo;
        </p>
      </motion.div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <DmPageContent />
    </Suspense>
  );
}