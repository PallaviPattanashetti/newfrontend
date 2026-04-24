"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { loggedInData } from "@/lib/user-services";

type CreditContextType = {
  credits: number;
  setCredits: (value: number) => void;
  refreshCredits: () => void;
};

const CreditContext = createContext<CreditContextType | null>(null);

const CREDIT_KEYS = [
  "credits",
  "credit",
  "creditBalance",
  "balance",
  "totalCredits",
  "availableCredits",
];

const resolveCreditValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getCreditsFromUser = (): number => {
  const user = loggedInData() as Record<string, unknown> | null;
  if (!user) return 0;

  for (const key of CREDIT_KEYS) {
    const val = resolveCreditValue(user[key]);
    if (val !== null) return val;
  }

  return 0;
};

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState<number>(0);

  const refreshCredits = () => {
    setCredits(getCreditsFromUser());
  };

  useEffect(() => {
    refreshCredits();
  }, []);

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