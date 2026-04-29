"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { GetUserCredits } from "@/lib/transactionservices";
import { getStoredChatUsername } from "@/lib/user-services";

type CreditContextType = {
  credits: number;
  setCredits: (value: number) => void;
  refreshCredits: () => Promise<void>;
};

const CreditContext = createContext<CreditContextType | null>(null);

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCreditsState] = useState<number>(0);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsername() {
      const user = await getStoredChatUsername();
      setUsername(user);
    }

    loadUsername();
  }, []);

  const refreshCredits = async () => {
    if (!username) return;

    try {
      const res = await GetUserCredits(username);

      const value = res;

      setCreditsState(value);
    } catch (err) {
      console.error("Failed to fetch credits:", err);
      setCreditsState(0);
    }
  };

  useEffect(() => {
    if (username) {
      refreshCredits();
    }
  }, [username]);

  const setCredits = (value: number) => {
    setCreditsState(value);
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
