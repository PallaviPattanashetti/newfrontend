
import VolunteerMap from "@/app/components/VolunteerMap";
import { fetchMapLocation } from "@/lib/mapServices";
import * as motion from "framer-motion/client"; // Using client-safe motion for Next.js

export default async function MapPage() {
  const initialVolunteers = await fetchMapLocation("");

  return (
    <main className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-6"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}>
      
      <section className="relative w-full">
        <VolunteerMap />
      </section>

      <div className="mx-auto max-w-5xl px-4 pb-20">
        <div className="relative z-10 -mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {initialVolunteers.slice(0, 2).map((v, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              key={v.id}
              className="rounded-2xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="border-2 border-black bg-yellow-400 px-2 py-1 text-xs font-bold uppercase">
                {v.category}
              </span>
              <h3 className="mt-2 text-2xl font-black uppercase">{v.name}</h3>
              <p className="font-medium text-gray-600">{v.title}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <p className="text-[30px] md:text-[40px] mt-10 text-black text-center italic font-medium">
                &ldquo;Time is the longest distance between two people—let's bridge it.&rdquo;
              </p>
            </motion.div>
        
      </div>
    </main>
  );
}



