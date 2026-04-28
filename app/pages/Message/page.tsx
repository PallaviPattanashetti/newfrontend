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
import { getStoredChatUsername } from "@/lib/user-services";
import { registerUser, startConnection, stopConnection } from "@/lib/signalservices";

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
  if (message.id > 0) {
    return `id:${message.id}`;
  }

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

function DmPageContent() {
  const searchParams = useSearchParams();
  const contactQuery = searchParams.get("contact")?.trim() ?? "";

  const [currentUsername, setCurrentUsername] = useState("");
  const [draftRecipient, setDraftRecipient] = useState(contactQuery);
  const [selectedUsername, setSelectedUsername] = useState(contactQuery);
  const [draftMessage, setDraftMessage] = useState("");
  const [inboxItems, setInboxItems] = useState<DmInboxItem[]>([]);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [isInboxLoading, setIsInboxLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isChatReady, setIsChatReady] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  const selectedUsernameRef = useRef(selectedUsername);
  const currentUsernameRef = useRef(currentUsername);

  useEffect(() => {
    selectedUsernameRef.current = selectedUsername;
  }, [selectedUsername]);

  useEffect(() => {
    currentUsernameRef.current = currentUsername;
  }, [currentUsername]);

  const activeConversation = useMemo(
    () =>
      inboxItems.find(
        (item) => item.otherUsername.toLowerCase() === selectedUsername.toLowerCase(),
      ) ?? null,
    [inboxItems, selectedUsername],
  );

  const refreshInbox = useCallback(async () => {
    const inbox = sortInboxItems(await getDmInbox());
    setInboxItems(inbox);
    setIsInboxLoading(false);

    if (contactQuery) {
      setSelectedUsername(contactQuery);
      setDraftRecipient(contactQuery);
      return;
    }

    if (!selectedUsernameRef.current && inbox.length > 0) {
      setSelectedUsername(inbox[0].otherUsername);
      setDraftRecipient(inbox[0].otherUsername);
    }
  }, [contactQuery]);

  const refreshUnreadCount = useCallback(async () => {
    await getDmUnreadCount();
    notifyDmUnreadChanged();
  }, []);

  const openConversation = async (otherUsername: string) => {
    setSelectedUsername(otherUsername);
    setDraftRecipient(otherUsername);
  };

  useEffect(() => {
    let isCancelled = false;

    const init = async () => {
      setIsConnecting(true);
      setConnectionError("");

      const storedUsername = getStoredChatUsername();
      if (!storedUsername) {
        if (!isCancelled) {
          setConnectionError("No username found. Sign in again before opening messages.");
          setIsConnecting(false);
          setIsInboxLoading(false);
        }
        return;
      }

      if (!isCancelled) {
        setCurrentUsername(storedUsername);
      }

      try {
        await Promise.all([refreshInbox(), refreshUnreadCount()]);

        await startConnection(async (payload) => {
          const username = currentUsernameRef.current;
          if (!username) {
            return;
          }

          const belongsToCurrentUser =
            payload.from.toLowerCase() === username.toLowerCase() ||
            payload.to.toLowerCase() === username.toLowerCase();

          if (!belongsToCurrentUser) {
            return;
          }

          const otherUsername =
            payload.from.toLowerCase() === username.toLowerCase() ? payload.to : payload.from;

          if (selectedUsernameRef.current.toLowerCase() === otherUsername.toLowerCase()) {
            setMessages((prev) => mergeMessages(prev, [buildLiveMessage(payload, username)]));

            if (payload.to.toLowerCase() === username.toLowerCase()) {
              await markDmConversationRead(otherUsername);
            }
          }

          await Promise.all([refreshInbox(), refreshUnreadCount()]);
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
  }, [contactQuery, refreshInbox, refreshUnreadCount]);

  useEffect(() => {
    if (!selectedUsername) {
      setMessages([]);
      return;
    }

    let isCancelled = false;

    const loadConversation = async () => {
      setIsMessagesLoading(true);

      try {
        const conversationMessages = sortMessages(await getDmConversationMessages(selectedUsername));
        if (isCancelled) {
          return;
        }

        setMessages(conversationMessages);

        const activeInboxItem = inboxItems.find(
          (item) => item.otherUsername.toLowerCase() === selectedUsername.toLowerCase(),
        );

        if (activeInboxItem?.unreadCount) {
          await markDmConversationRead(selectedUsername);
          if (isCancelled) {
            return;
          }

          setInboxItems((prev) =>
            prev.map((item) =>
              item.otherUsername.toLowerCase() === selectedUsername.toLowerCase()
                ? { ...item, unreadCount: 0 }
                : item,
            ),
          );

          await refreshUnreadCount();
        }
      } catch (error) {
        console.error("DM conversation load failed", error);
      } finally {
        if (!isCancelled) {
          setIsMessagesLoading(false);
        }
      }
    };

    void loadConversation();

    return () => {
      isCancelled = true;
    };
  }, [inboxItems, refreshUnreadCount, selectedUsername]);

  useEffect(() => {
    if (!contactQuery) {
      return;
    }

    setSelectedUsername(contactQuery);
    setDraftRecipient(contactQuery);
  }, [contactQuery]);

  const handleSend = async () => {
    const recipient = draftRecipient.trim();
    const trimmedMessage = draftMessage.trim();

    if (!isChatReady || !recipient || !trimmedMessage) {
      return;
    }

    const optimisticMessage = buildOptimisticMessage(recipient, currentUsername, trimmedMessage);
    setMessages((prev) => mergeMessages(prev, [optimisticMessage]));
    setDraftMessage("");
    setSelectedUsername(recipient);
    setDraftRecipient(recipient);
    setConnectionError("");

    setInboxItems((prev) => {
      const existing = prev.find(
        (item) => item.otherUsername.toLowerCase() === recipient.toLowerCase(),
      );

      const nextItem: DmInboxItem = existing
        ? {
            ...existing,
            lastMessagePreview: trimmedMessage,
            lastMessageAtUtc: optimisticMessage.sentAtUtc,
            lastMessageFromUsername: currentUsername,
          }
        : {
            threadId: 0,
            otherUserId: 0,
            otherUsername: recipient,
            otherDisplayName: recipient,
            otherProfilePictureUrl: null,
            lastMessagePreview: trimmedMessage,
            lastMessageAtUtc: optimisticMessage.sentAtUtc,
            lastMessageFromUsername: currentUsername,
            unreadCount: 0,
          };

      const filtered = prev.filter(
        (item) => item.otherUsername.toLowerCase() !== recipient.toLowerCase(),
      );

      return sortInboxItems([nextItem, ...filtered]);
    });

    const sent = await postDmMessage(recipient, trimmedMessage);
    if (!sent) {
      setConnectionError("Unable to send message.");
      return;
    }

    await refreshInbox();
  };

  const isSendDisabled = !isChatReady || !draftRecipient.trim() || !draftMessage.trim();

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
          Signed in as {currentUsername || "..."}
        </p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[1280px] min-h-152 border border-gray-200 bg-[#28a8af]/40 backdrop-blur-md flex flex-col md:flex-row shadow-xl rounded-2xl overflow-hidden"
      >
        <DmInboxList
          draftRecipient={draftRecipient}
          inboxItems={inboxItems}
          isLoading={isInboxLoading}
          selectedUsername={selectedUsername}
          onDraftRecipientChange={setDraftRecipient}
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
      <DmPageContent />
    </Suspense>
  );
}
