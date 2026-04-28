
"use client";
import { Suspense, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { fetchTransaction, fetchTransfer, getUserIdByUsername } from "@/lib/transactionservices";
import { TransactionDTO } from "@/interfaces/creditinterfaces";
import { getStoredChatUsername } from "@/lib/user-services";
import {DoesUserExist} from "@/lib/transactionservices"
import { useCredits } from "@/context/creditcontext";


function CreditPageContent() {
  const searchParams = useSearchParams();
  const creditRecipient = searchParams.get("to")?.trim() ?? "";
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  

  const users = ["Ken", "Jose", "Isaiah", "Jacob"];


  const [fromUser, setFromUser] = useState("");
  const [senderId, setSenderId] = useState<number>(0);
  const [toUser, setToUser] = useState("");
const { credits, setCredits } = useCredits();  
const [transferAmount, setTransferAmount] = useState(0.00);
  const [shake, setShake] = useState(false);
  const [searchInput, setSearchInput] = useState("");
const [searchResult, setSearchResult] = useState<boolean>(false);
const [hasSearched, setHasSearched] = useState(false);



useEffect(() => {
  async function onload() {
    const user = await getStoredChatUsername();
    setFromUser(user);

    if (user) {
      const id = await getUserIdByUsername(user);
      setSenderId(id);
    }
  }
  onload();
}, [])

useEffect(() => {
  if (!creditRecipient) {
    return;
  }

  setSearchInput(creditRecipient);
  setToUser(creditRecipient);
  setHasSearched(false);
}, [creditRecipient]);

  const handleIncrease = async () => {
    if (credits >= 1) {
      setTransferAmount(prev => prev + 1);
      setShake(false);
    } else {
      triggerError();
    }
  };

  const handleDecrease = () => {
    if (transferAmount >= 1) {
      setTransferAmount(prev => prev - 1);
      setShake(false);
    } else {
      triggerError();
    }
  };


 const handleUserSearch = async () => {
  const result = await DoesUserExist(searchInput);
  setHasSearched(true);
  console.log(result);
  setSearchResult(result);
}


  const triggerError = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleTransfer = async () => {
  if (!fromUser || !toUser || transferAmount === 0 || fromUser === toUser) {
    return triggerError();
  }

  const transaction: TransactionDTO = {
    senderId: senderId,
    receiverUsername: toUser,
    amount: transferAmount
  };

  try {
    setIsProcessing(true);

   const res = await fetchTransfer(transaction);

console.log("TRANSFER RESPONSE:", res);

if (!res) {
  throw new Error("Transfer failed");
}

  setCredits(credits - transferAmount);
  window.dispatchEvent(new Event("auth-changed"));

  setIsSuccess(true);
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
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-6"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
      <div className="w-full max-w-112.5 min-h-17.5 bg-[#5F4F4F]/50 rounded-2xl flex items-center justify-center my-6 md:my-8 p-4 border-2 border-black">
        <h1 className="text-3xl md:text-[64px] font-extrabold text-black tracking-tight text-center">
          Credits
        </h1>
      </div>

      <div className="w-full max-w-213 min-h-135 border-[6px] md:border-10 border-black bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center py-6 px-4 md:py-8 gap-4 shadow-2xl overflow-hidden rounded-lg relative">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-154 flex flex-col gap-4 px-2"
            >
             
              {/* FROM */}
              <div className="flex flex-col gap-1">
                <label className="text-black font-bold ml-1">From {fromUser}</label>
                
              </div>

            
              <div className="flex flex-col gap-1">
                <label className="text-black font-bold ml-1">To</label>
                <div className="flex flex-col gap-2">
  <input
    value={searchInput}
    onChange={(e) => setSearchInput(e.target.value)}
    placeholder="Search username..."
    className="w-full h-14 bg-white/80 border-2 border-black px-4 rounded-lg font-bold outline-none text-black"
  />

  <button
    onClick={handleUserSearch}
    className={`mt-4 w-full h-16 text-white font-bold rounded-xl border-2 border-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors bg-[#5F4F4F]`}
  >
    Search
  </button>

  {hasSearched && (
    <div className="mt-2">
      {searchResult ? (
        <div className="flex items-center justify-between bg-white border-2 border-black text-black rounded-lg px-4 py-2">
          <span className="font-bold">User Found!</span>

          <button
            onClick={() => setToUser(searchInput)}
            className="bg-[#5F4F4F] text-white px-4 py-1 rounded-lg"
          >
            Select
          </button>
        </div>
      ) : (
        <p className="text-black font-bold text-center">No user found!</p>
      )}
    </div>
  )}
</div>
                {fromUser && toUser && fromUser === toUser && (
                  <p className="text-red-600 text-xs font-bold ml-1">Cannot send to yourself!</p>
                )}
              </div>

              {/* AMOUNT  */}
              <div className="flex flex-col gap-1">
                <label className="text-black font-bold ml-1">Amount</label>
                <motion.div 
                  animate={shake ? { x: [-4, 4, -4, 4, 0], borderColor: "#ef4444" } : { borderColor: "#000" }}
                  className="w-full h-16 bg-white border-2 flex items-center justify-between px-4 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400 text-2xl">★</span>
                    <span className={`text-xl font-black ${shake ? 'text-red-600' : 'text-black'}`}>
                      {transferAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 font-bold text-2xl">
                    <motion.button 
                      whileTap={{ scale: 0.8 }} 
                      onClick={handleIncrease}
                      className="text-green-600 hover:scale-110 cursor-pointer"
                    > + </motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.8 }} 
                      onClick={handleDecrease}
                      className="text-red-600 hover:scale-110 cursor-pointer"
                    > - </motion.button>
                  </div>
                </motion.div>
              </div>

              <div className="w-full flex justify-end">
                <div className="h-12 flex items-center px-4 bg-yellow-100 text-black rounded-lg font-mono border-2 border-black font-bold">
                  Balance Left: {credits}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTransfer}
                disabled={isProcessing}
                className={`mt-4 w-full h-16 text-white font-bold rounded-xl border-2 border-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors ${
                  isProcessing ? "bg-gray-500" : "bg-[#5F4F4F]"
                }`}
              >
                {isProcessing ? "Processing..." : "Transfer Credits"}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center p-8 bg-white rounded-2xl border-4 border-green-500 shadow-xl"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 border-2 border-green-500">
                <span className="text-green-600 text-5xl">✓</span>
              </div>
              <h2 className="text-3xl font-black text-black">Success!</h2>
              <p className="text-gray-600 text-center font-bold mt-2">
                {transferAmount.toFixed(2)} Credits sent to {toUser}!
              </p>
              <button 
                onClick={() => { 
                  setIsSuccess(false); 
                  setTransferAmount(0);
                  setFromUser("");
                  setToUser("");
                }}
                className="mt-6 px-10 py-2 bg-black text-white rounded-full font-bold cursor-pointer hover:bg-gray-800"
              > Done </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
         <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <p className="text-[30px] md:text-[40px] mt-10 text-black text-center italic font-medium">
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
          className="min-h-screen flex items-center justify-center text-white font-bold"
          style={{ backgroundImage: "url('/assets/TBBackround.jpeg')", backgroundSize: "cover" }}
        >
          Loading credits...
        </div>
      }
    >
      <CreditPageContent />
    </Suspense>
  );
}