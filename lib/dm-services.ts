import { authHeaders, getApiBaseUrl, parseJsonSafely, safeFetch } from "@/lib/user-services";

export type DmInboxItem = {
  threadId: number;
  otherUserId: number;
  otherUsername: string;
  otherDisplayName: string;
  otherProfilePictureUrl: string | null;
  lastMessagePreview: string;
  lastMessageAtUtc: string;
  lastMessageFromUsername: string;
  unreadCount: number;
};

export type DmMessage = {
  id: number;
  chatThreadId: number;
  senderUserId: number;
  senderUsername: string;
  senderDisplayName: string;
  message: string;
  sentAtUtc: string;
  readAtUtc: string | null;
  isMine: boolean;
};

export type LiveDmPayload = {
  from: string;
  to: string;
  message: string;
  sentAtUtc: string;
  readAtUtc: string | null;
};

export const DM_UNREAD_CHANGED_EVENT = "dm-unread-changed";

const DM_BASE_PATH = `${getApiBaseUrl()}/api/Dms`;

const normalizeUnreadCount = (payload: unknown) => {
  if (typeof payload === "number" && Number.isFinite(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as Record<string, unknown>;
    for (const key of ["unreadCount", "count", "totalUnread"]) {
      const candidate = objectPayload[key];
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        return candidate;
      }
    }
  }

  return 0;
};

export const notifyDmUnreadChanged = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(DM_UNREAD_CHANGED_EVENT));
};

export const getDmInbox = async (): Promise<DmInboxItem[]> => {
  const res = await safeFetch(`${DM_BASE_PATH}/inbox`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res?.ok) {
    return [];
  }

  const payload = await parseJsonSafely<unknown>(res);
  return Array.isArray(payload) ? (payload as DmInboxItem[]) : [];
};

export const getDmUnreadCount = async (): Promise<number> => {
  const res = await safeFetch(`${DM_BASE_PATH}/unread-count`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res?.ok) {
    return 0;
  }

  const payload = await parseJsonSafely<unknown>(res);
  return normalizeUnreadCount(payload);
};

export const getDmConversationMessages = async (otherUsername: string): Promise<DmMessage[]> => {
  const res = await safeFetch(`${DM_BASE_PATH}/conversations/${encodeURIComponent(otherUsername)}/messages`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res?.ok) {
    return [];
  }

  const payload = await parseJsonSafely<unknown>(res);
  return Array.isArray(payload) ? (payload as DmMessage[]) : [];
};

export const postDmMessage = async (otherUsername: string, message: string): Promise<boolean> => {
  const res = await safeFetch(`${DM_BASE_PATH}/conversations/${encodeURIComponent(otherUsername)}/messages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });

  return Boolean(res?.ok);
};

export const markDmConversationRead = async (otherUsername: string): Promise<boolean> => {
  const res = await safeFetch(`${DM_BASE_PATH}/conversations/${encodeURIComponent(otherUsername)}/read`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({}),
  });

  return Boolean(res?.ok);
};