
"use client";
import { Suspense, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { fetchTransfer, getUserIdByUsername } from "@/lib/transactionservices";
import { TransactionDTO } from "@/interfaces/creditinterfaces";
import { getStoredChatUsername } from "@/lib/user-services";
import { DoesUserExist } from "@/lib/transactionservices";
import { CREDITS_CHANGED_EVENT, useCredits } from "@/context/creditcontext";

const BG = `
  radial-gradient(ellipse at 15% 15%, #38bdf8 0%, transparent 50%),
  radial-gradient(ellipse at 85% 10%, #818cf8 0%, transparent 45%),
  radial-gradient(ellipse at 80% 85%, #34d399 0%, transparent 50%),
  radial-gradient(ellipse at 10% 80%, #fb923c 0%, transparent 45%),
  linear-gradient(160deg, #e0f2fe 0%, #bae6fd 60%, #7dd3fc 100%)
`;

function CreditPageContent() {
  const searchParams = useSearchParams();
  const creditRecipient = searchParams.get("to")?.trim() ?? "";
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fromUser, setFromUser] = useState("");
  const [senderId, setSenderId] = useState<number>(0);
  const [toUser, setToUser] = useState("");
  const { credits, setCredits, refreshCredits } = useCredits();
  const [transferAmount, setTransferAmount] = useState(0.00);
  const [shake, setShake] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResult, setSearchResult] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState(false);
  const normalizedSearchInput = searchInput.trim();
  const isSelectedUser = Boolean(toUser) && toUser === normalizedSearchInput;

  useEffect(() => {
    async function onload() {
      const user = getStoredChatUsername();
      setFromUser(user);
      if (user) {
        const id = await getUserIdByUsername(user);
        setSenderId(id ?? 0);
      }
    }
    onload();
  }, []);

  useEffect(() => { void refreshCredits(); }, [refreshCredits]);

  useEffect(() => {
    if (!creditRecipient) return;
    setSearchInput(creditRecipient);
    setToUser(creditRecipient);
    setHasSearched(false);
    setSearchResult(false);
  }, [creditRecipient]);

  const handleIncrease = () => {
    if (transferAmount + 1 <= credits) { setTransferAmount(prev => prev + 1); setShake(false); }
    else triggerError();
  };

  const handleDecrease = () => {
    if (transferAmount >= 1) { setTransferAmount(prev => prev - 1); setShake(false); }
    else triggerError();
  };

  const handleUserSearch = async () => {
    const nextSearchInput = searchInput.trim();
    if (!nextSearchInput) { setHasSearched(true); setSearchResult(false); return; }
    const result = await DoesUserExist(nextSearchInput);
    setHasSearched(true);
    setSearchResult(Boolean(result));
  };

  const triggerError = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleTransfer = async () => {
    if (!fromUser || !toUser || senderId <= 0 || transferAmount <= 0 || transferAmount > credits || fromUser === toUser) {
      return triggerError();
    }
    const transaction: TransactionDTO = { senderId, receiverUsername: toUser, amount: transferAmount };
    try {
      setIsProcessing(true);
      const res = await fetchTransfer(transaction);
      console.log("TRANSFER RESPONSE:", res);
      setCredits(Math.max(0, credits - transferAmount));
      window.dispatchEvent(new Event(CREDITS_CHANGED_EVENT));
      await refreshCredits();
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      triggerError();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center px-3 py-4 sm:px-4 sm:py-6 md:p-8"
      style={{ background: BG }}
    >
      {/* Header */}
      <div
        className="w-full max-w-sm sm:max-w-lg md:max-w-2xl rounded-2xl flex items-center justify-center my-4 sm:my-6 md:my-8 p-4 sm:p-5 border border-white/50 shadow-sm"
        style={{ background: "rgba(255,255,255,0.45)" }}
      >
        <h1
          className="font-extrabold tracking-tight text-center"
          style={{ fontSize: "clamp(28px, 6vw, 64px)", color: "#0369a1" }}
        >
          Credits
        </h1>
      </div>

      {/* Main card */}
      <div
        className="w-full max-w-sm sm:max-w-lg md:max-w-3xl border-2 border-white/50 backdrop-blur-sm flex flex-col items-center justify-center py-6 px-4 sm:py-8 sm:px-6 gap-4 shadow-2xl rounded-2xl relative"
        style={{ background: "rgba(255,255,255,0.45)" }}
      >
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col gap-4"
            >
              {/* FROM */}
              <div className="flex flex-col gap-1">
                <label
                  className="font-bold ml-1 text-sm sm:text-base"
                  style={{ color: "#0369a1" }}
                >
                  From
                </label>
                <div
                  className="w-full h-12 sm:h-14 flex items-center px-4 rounded-xl border border-white/60 font-bold text-sm sm:text-base"
                  style={{ background: "rgba(255,255,255,0.7)", color: "#1e3a5f" }}
                >
                  {fromUser || "—"}
                </div>
              </div>

              {/* TO */}
              <div className="flex flex-col gap-1">
                <label
                  className="font-bold ml-1 text-sm sm:text-base"
                  style={{ color: "#0369a1" }}
                >
                  To
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search username..."
                    className="w-full h-12 sm:h-14 border border-white/60 px-4 rounded-xl font-bold outline-none text-sm sm:text-base focus:ring-2 focus:ring-sky-400"
                    style={{ background: "rgba(255,255,255,0.7)", color: "#1e3a5f" }}
                  />

                  <button
                    onClick={handleUserSearch}
                    className="w-full h-12 sm:h-14 text-white font-bold rounded-xl border border-white/30 uppercase tracking-widest shadow-md transition-opacity hover:opacity-90 text-sm sm:text-base"
                    style={{ background: "#0369a1" }}
                  >
                    Search
                  </button>

                  {hasSearched && (
                    <div className="mt-1">
                      {searchResult ? (
                        <div
                          className="flex items-center justify-between rounded-xl px-4 py-2.5 border border-white/60"
                          style={{ background: "rgba(255,255,255,0.7)", color: "#1e3a5f" }}
                        >
                          <span className="font-bold text-sm sm:text-base">User Found!</span>
                          <button
                            onClick={() => setToUser(normalizedSearchInput)}
                            disabled={!normalizedSearchInput || isSelectedUser}
                            className="px-3 sm:px-4 py-1.5 rounded-lg text-white text-xs sm:text-sm font-bold transition-all active:scale-95"
                            style={{ background: isSelectedUser ? "#16a34a" : "#0369a1" }}
                          >
                            {isSelectedUser ? "Selected ✓" : "Select"}
                          </button>
                        </div>
                      ) : (
                        <p className="font-bold text-center text-sm" style={{ color: "#dc2626" }}>
                          No user found!
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {fromUser && toUser && fromUser === toUser && (
                  <p className="text-xs font-bold ml-1 mt-1" style={{ color: "#dc2626" }}>
                    Cannot send to yourself!
                  </p>
                )}
              </div>

              {/* AMOUNT */}
              <div className="flex flex-col gap-1">
                <label
                  className="font-bold ml-1 text-sm sm:text-base"
                  style={{ color: "#0369a1" }}
                >
                  Amount
                </label>
                <motion.div
                  animate={shake ? { x: [-4, 4, -4, 4, 0] } : {}}
                  className="w-full h-14 sm:h-16 flex items-center justify-between px-4 rounded-xl border border-white/60 shadow-sm"
                  style={{ background: shake ? "rgba(254,226,226,0.8)" : "rgba(255,255,255,0.7)" }}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-yellow-400 text-xl sm:text-2xl">★</span>
                    <span
                      className="text-lg sm:text-xl font-black"
                      style={{ color: shake ? "#dc2626" : "#1e3a5f" }}
                    >
                      {transferAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 font-bold text-xl sm:text-2xl">
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={handleIncrease}
                      className="hover:scale-110 cursor-pointer"
                      style={{ color: "#16a34a" }}
                    >
                      +
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={handleDecrease}
                      className="hover:scale-110 cursor-pointer"
                      style={{ color: "#dc2626" }}
                    >
                      −
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* Balance */}
              <div className="w-full flex justify-end">
                <div
                  className="h-10 sm:h-12 flex items-center px-3 sm:px-4 rounded-xl font-mono font-bold text-xs sm:text-sm border border-white/60"
                  style={{ background: "rgba(254,252,232,0.8)", color: "#1e3a5f" }}
                >
                  Balance Left: {credits.toFixed(2)}
                </div>
              </div>

              {/* Transfer button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTransfer}
                disabled={isProcessing}
                className="mt-2 w-full h-12 sm:h-14 text-white font-bold rounded-xl border border-white/30 uppercase tracking-widest shadow-md transition-opacity text-sm sm:text-base"
                style={{ background: isProcessing ? "#94a3b8" : "#0369a1" }}
              >
                {isProcessing ? "Processing..." : "Transfer Credits"}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center p-6 sm:p-8 rounded-2xl border-2 border-green-400 shadow-xl w-full"
              style={{ background: "rgba(255,255,255,0.85)" }}
            >
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4 border-2 border-green-400"
                style={{ background: "#dcfce7" }}
              >
                <span className="text-green-600 text-4xl sm:text-5xl">✓</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black" style={{ color: "#1e3a5f" }}>
                Success!
              </h2>
              <p className="text-center font-bold mt-2 text-sm sm:text-base" style={{ color: "#0369a1" }}>
                {transferAmount.toFixed(2)} Credits sent to {toUser}!
              </p>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setTransferAmount(0);
                  setToUser("");
                  setSearchInput("");
                  setHasSearched(false);
                  setSearchResult(false);
                }}
                className="mt-6 px-8 sm:px-10 py-2.5 rounded-full font-bold text-sm sm:text-base text-white cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: "#0369a1" }}
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full max-w-sm sm:max-w-lg md:max-w-3xl px-2"
      >
        <p
          className="mt-8 sm:mt-10 text-center italic font-medium"
          style={{ fontSize: "clamp(16px, 4vw, 40px)", color: "#1e3a5f" }}
        >
          &ldquo;Building a world where kindness is the ultimate credit.&rdquo;
        </p>
      </motion.div>
    </div>
  );
}

export default function CreditPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center font-bold text-base sm:text-lg"
          style={{ background: BG, color: "#0369a1" }}
        >
          Loading credits...
        </div>
      }
    >
      <CreditPageContent />
    </Suspense>
  );
}










