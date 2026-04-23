
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HelpSection() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  

  const users = ["Ken", "Jose", "Isaiah", "Jacob"];


  const [fromUser, setFromUser] = useState("");
  const [toUser, setToUser] = useState("");
  const [balance, setBalance] = useState(10.00);
  const [transferAmount, setTransferAmount] = useState(0.00);
  const [shake, setShake] = useState(false);

  const handleIncrease = () => {
    if (balance >= 1) {
      setTransferAmount(prev => prev + 1);
      setBalance(prev => prev - 1);
      setShake(false);
    } else {
      triggerError();
    }
  };

  const handleDecrease = () => {
    if (transferAmount >= 1) {
      setTransferAmount(prev => prev - 1);
      setBalance(prev => prev + 1);
      setShake(false);
    } else {
      triggerError();
    }
  };

  const triggerError = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleTransfer = () => {
   
    if (!fromUser || !toUser || transferAmount === 0 || fromUser === toUser) {
      return triggerError();
    }
    
    setIsProcessing(true);
   
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1500);
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
                <label className="text-black font-bold ml-1">From</label>
                <select 
                  className="w-full h-14 bg-white/80 border-2 border-black px-4 rounded-lg font-bold outline-none"
                  value={fromUser}
                  onChange={(e) => setFromUser(e.target.value)}
                >
                  <option value="" disabled>Select sender...</option>
                  {users.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>

            
              <div className="flex flex-col gap-1">
                <label className="text-black font-bold ml-1">To</label>
                <select 
                  className="w-full h-14 bg-white/80 border-2 border-black px-4 rounded-lg font-bold outline-none"
                  value={toUser}
                  onChange={(e) => setToUser(e.target.value)}
                >
                  <option value="" disabled>Select recipient...</option>
                  {users.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
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
                  Balance Left: {balance.toFixed(2)}
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