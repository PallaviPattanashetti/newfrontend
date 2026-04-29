"use client";

import type { DmInboxItem } from "@/lib/dm-services";

type DmInboxListProps = {
  draftRecipient: string;
  inboxItems: DmInboxItem[];
  isLoading: boolean;
  selectedUsername: string;
  onDraftRecipientChange: (value: string) => void;
  onSelect: (username: string) => void;
};

const formatTimestamp = (value: string) => {
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

export function DmInboxList({
  draftRecipient,
  inboxItems,
  isLoading,
  selectedUsername,
  onDraftRecipientChange,
  onSelect,
}: DmInboxListProps) {
  return (
    <div className="w-full md:w-96 md:h-full h-64 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 bg-white/60 p-4 overflow-y-auto min-h-0">
      <h2 className="text-gray-500 font-semibold text-xs uppercase tracking-wider mb-4 px-2">
        Chats
      </h2>

      <input
        type="text"
        placeholder="Send to username..."
        value={draftRecipient}
        onChange={(e) => onDraftRecipientChange(e.target.value)}
        className="mb-4 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-blue-300"
      />

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="rounded-2xl bg-white/60 px-3 py-4 text-sm text-gray-600">
            Loading conversations...
          </div>
        ) : null}

        {!isLoading && inboxItems.length === 0 ? (
          <div className="rounded-2xl bg-white/60 px-3 py-4 text-sm text-gray-600">
            No conversations yet. Start one by entering a username above.
          </div>
        ) : null}

        {!isLoading
          ? inboxItems.map((item) => {
              const isSelected = selectedUsername.toLowerCase() === item.otherUsername.toLowerCase();

              return (
                <button
                  key={`${item.threadId}-${item.otherUsername.toLowerCase()}`}
                  type="button"
                  onClick={() => onSelect(item.otherUsername)}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    isSelected
                      ? "border-blue-400 bg-blue-100/80"
                      : "border-white/50 bg-white/60 hover:bg-white/80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {item.otherProfilePictureUrl ? (
                      <img
                        src={item.otherProfilePictureUrl}
                        alt={item.otherDisplayName || item.otherUsername}
                        className="h-11 w-11 rounded-full object-cover border border-white/70 shadow-sm"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-[#5F4F4F]/15 text-xs font-bold text-gray-700 shadow-sm">
                        {getInitials(item.otherDisplayName, item.otherUsername)}
                      </div>
                    )}
 
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">
                            {item.otherDisplayName || item.otherUsername}
                          </p>
                          <p className="truncate text-xs text-gray-500">@{item.otherUsername}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] text-gray-500">
                            {formatTimestamp(item.lastMessageAtUtc)}
                          </span>
                          {item.unreadCount > 0 ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                              {item.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                        {item.lastMessagePreview}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          : null}
      </div>
    </div>
  );
}