"use client"

export default function People() {
  const people = [
    {
      id: 1,
      name: "Jose",
      help: "Experience the world's finest decor. I can help you transform your space into a masterpiece.",
    },
    {
      id: 2,
      name: "Ken ",
      help: "Full-stack developer. I can help you debug React issues",
    },
    {
      id: 3,
      name: "Jacob",
      help: "Expert in event planning. I can help organize your community festivals.",
    },


     {
      id: 4,
      name: "Isaiah",
      help: "Expert in event planning. I can help organize your community festivals.",
    },
  ];

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-12 font-sans"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}
    >
 <div 
         
        className="w-full max-w-87.5 bg-[#5F4F4F]/50 rounded-xl flex items-center justify-center my-6 md:my-8 p-5 border border-gray-200 shadow-sm"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
     Users
        </h1>
      </div>
      
      <div className="flex flex-col gap-6 w-full max-w-5xl">
        {people.map((person) => (
          <div
            key={person.id}
            className="flex flex-col md:flex-row items-center justify-between bg-white/30  p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/20"
          >
          
            <div className="flex flex-col items-center space-y-3 shrink-0 w-32">
              <div className="w-20 h-20 rounded-full border-2 border-[#28a8af] p-1 shadow-sm">
                <div className="w-full h-full rounded-full bg-[#5F4F4F] overflow-hidden flex items-center justify-center text-white font-bold text-2xl">
                  {person.name.charAt(0)}
                </div>
              </div>
              <h3 className="text-gray-900 font-bold text-base text-center leading-tight">
                {person.name}
              </h3>
            </div>

            <div className="flex-1 px-4 md:px-12 py-6 md:py-0">
              <p className="text-gray-500 text-sm md:text-base leading-relaxed text-center md:text-left italic">
                &ldquo;{person.help}&rdquo;
              </p>
            </div>

           
            <div className="shrink-0 w-full md:w-auto">
              <button
                className="w-full md:px-10 py-3.5 rounded-full bg-[#28a8af] text-white font-bold text-sm shadow-lg shadow-[#28a8af]/30 hover:bg-[#218e94] transition-colors"
              >
                Message
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}



