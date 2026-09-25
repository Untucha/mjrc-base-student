import React from 'react';
import { MapPin, ShieldCheck, Play } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const HubBanner = () => {
  const { showToast } = useStore();

  const toast = {
    info: (msg) => {
      if (showToast) showToast(msg);
    }
  };

  const handleWatchTour = () => {
    toast.info("Official Mysore Store Video Tour launching soon! 🎬");
  };

  return (
    <section className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto my-3 sm:my-8">
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 text-white shadow-xl overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-3 sm:gap-6">
          
          {/* Left Text */}
          <div className="lg:col-span-8 space-y-2.5 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>OFFICIAL EXPERIENCE HUB</span>
            </div>

            <h2 className="text-lg sm:text-3xl font-black tracking-tight text-white leading-snug">
              Visit our Mysore Central RC Experience & Dispatch Hub
            </h2>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1 text-[11px] sm:text-xs font-semibold text-slate-300">
              
              {/* CARD 1: Mysore Store Google Maps Link */}
              <a
                href="https://share.google/yMcIPsS2RbNqzKMH3"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1.5 sm:gap-2 bg-slate-800/60 hover:bg-slate-800 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-700/60 hover:border-emerald-500/50 transition-all group cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="font-extrabold text-white block text-[11px] sm:text-xs group-hover:text-emerald-300 transition-colors">📍 Mysore Store</span>
                  <span className="text-slate-300">Direct bench-testing & hobby trials.</span>
                </div>
              </a>

              {/* CARD 2: Expert Support WhatsApp Chat Link */}
              <a
                href="https://wa.me/919686078395?text=Hi%20MJ%20RC%20BASE%20Team,%20I%20need%20expert%20assistance%20with%20RC%20models%20and%20spares!"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1.5 sm:gap-2 bg-slate-800/60 hover:bg-slate-800 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-700/60 hover:border-emerald-500/50 transition-all group cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="font-extrabold text-white block text-[11px] sm:text-xs group-hover:text-emerald-300 transition-colors">🛡️ Expert Support</span>
                  <span className="text-slate-300">Setup assistance & genuine spares.</span>
                </div>
              </a>

            </div>
          </div>

          {/* Right Video Card (CARD 3: Watch Store Tour) */}
          <div className="lg:col-span-4 flex justify-center">
            <div
              onClick={handleWatchTour}
              className="relative w-full max-w-sm h-36 sm:h-44 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-700/80 group cursor-pointer shadow-lg bg-slate-950"
            >
              <img
                src="https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=600&q=80"
                alt="Mysore RC Experience Hub Tour"
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />
                </div>
                <span className="text-[11px] sm:text-xs font-black text-white tracking-wide">Watch Store Tour</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
