
import VolunteerMap from "@/app/components/VolunteerMap";
import { fetchMapLocation } from "@/lib/mapServices";
import { Metadata } from "next";
import mapboxgl from "mapbox-gl";

export const metadata: Metadata = {
  title: "TimeBank | Find Volunteers",
  description:
    "Locate community service exchanges and skilled volunteers near you.",
};

export default async function MapPage() {
  const initialVolunteers = await fetchMapLocation("");

  return (
    <main  className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-6"
      style={{ backgroundImage: "url('/assets/TBBackround.jpeg')" }}>
      <section className="relative w-full">
        <VolunteerMap />
      </section>

      <div className="mx-auto max-w-5xl px-4 pb-20">
        <div className="relative z-10 -mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {initialVolunteers.slice(0, 2).map((v) => (
            <div
              key={v.id}
              className="rounded-2xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="border-2 border-black bg-yellow-400 px-2 py-1 text-xs font-bold uppercase">
                {v.category}
              </span>
              <h3 className="mt-2 text-2xl font-black uppercase">{v.name}</h3>
              <p className="font-medium text-gray-600">{v.title}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
