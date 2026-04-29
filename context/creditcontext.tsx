"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { GetUserCredits } from "@/lib/transactionservices";
import { getStoredChatUsername } from "@/lib/user-services";

type CreditContextType = {
  credits: number;
  setCredits: (value: number) => void;
  refreshCredits: () => Promise<void>;
};

export const CREDITS_CHANGED_EVENT = "credits-changed";

const CreditContext = createContext<CreditContextType | null>(null);

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCreditsState] = useState<number>(0);
  const [username, setUsername] = useState<string | null>(null);

  const sanitizeCredits = (value: number) => {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, value);
  };

  const getCurrentUsername = () => {
    const stored = getStoredChatUsername().trim();
    return stored || null;
  };

  const loadUsername = () => {
    setUsername(getCurrentUsername());
  };

  useEffect(() => {
    loadUsername();

    const onAuthChanged = () => {
      loadUsername();
    };

    window.addEventListener("auth-changed", onAuthChanged);

    return () => {
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, []);

  const refreshCredits = useCallback(async () => {
    const activeUsername = username ?? getCurrentUsername();

    if (!activeUsername) {
      setCreditsState(0);
      return;
    }

    try {
      const res = await GetUserCredits(activeUsername);

      const value = sanitizeCredits(res);

      setCreditsState(value);
    } catch (err) {
      console.error("Failed to fetch credits:", err);
      setCreditsState(0);
    }
  }, [username]);

  useEffect(() => {
    void refreshCredits();
  }, [username, refreshCredits]);

  useEffect(() => {
    const onWindowFocus = () => {
      void refreshCredits();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshCredits();
      }
    };

    const refreshIntervalId = window.setInterval(() => {
      void refreshCredits();
    }, 15000);

    window.addEventListener("focus", onWindowFocus);
    window.addEventListener(CREDITS_CHANGED_EVENT, onWindowFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(refreshIntervalId);
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener(CREDITS_CHANGED_EVENT, onWindowFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshCredits]);

  const setCredits = (value: number) => {
    setCreditsState(sanitizeCredits(value));
  };

  return (
    <CreditContext.Provider value={{ credits, setCredits, refreshCredits }}>
      {children}
    </CreditContext.Provider>
  );
}

export const useCredits = () => {
  const ctx = useContext(CreditContext);
  if (!ctx) throw new Error("useCredits must be used inside CreditProvider");
  return ctx;
};
