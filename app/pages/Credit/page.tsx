
export default function HelpSection() {
  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-6"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >

      <div className="w-full max-w-87.5  bg-[#5F4F4F]/50  rounded-xl flex items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight text-center">
          Transfer Credits
        </h1>
      </div>


      <div className="w-full max-w-213 min-h-135 border-[6px] md:border-10 border-black bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center py-6 px-4 md:py-8 gap-4 shadow-2xl overflow-hidden rounded-lg relative">
        
        <div className="w-full max-w-154 flex flex-col gap-4 px-2">
          
      
          <div className="flex flex-col gap-1">
            <label className="text-black font-bold ml-1">From</label>
            <div className="w-full h-14 bg-white/80 border-2 border-black flex items-center px-4 rounded-lg">
              <span className="text-gray-500 italic">Select sender...</span>
            </div>
          </div>

      
          <div className="flex flex-col gap-1">
            <label className="text-black font-bold ml-1">To</label>
            <div className="w-full h-14 bg-white/80 border-2 border-black flex items-center px-4 rounded-lg">
              <span className="text-gray-500 italic">Select recipient...</span>
            </div>
          </div>

  
          <div className="flex flex-col gap-1">
            <label className="text-black font-bold ml-1">Amount</label>
            <div className="w-full h-16 bg-white border-2 border-black flex items-center justify-between px-4 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3">
                <span className="text-yellow-400 text-2xl">★</span>
                <span className="text-xl font-black text-black">
                  0.00
                </span>
              </div>
              <div className="flex items-center gap-6 font-bold text-2xl">
                <button className="text-green-600"> + </button>
                <button className="text-red-600"> - </button>
              </div>
            </div>
          </div>

       
          <div className="w-full flex justify-end">
            <div className="h-12 flex items-center px-4 bg-yellow-100 text-black rounded-lg font-mono border-2 border-black font-bold">
              Balance Left: 120.00
            </div>
          </div>

    
          <button className="mt-4 w-full h-16 bg-[#5F4F4F] text-white font-bold rounded-xl border-2 border-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Transfer Credits
          </button>
          


        </div>
      </div>
    </div>
  );
}