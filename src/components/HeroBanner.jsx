import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ArrowRight, ShieldCheck, Zap, Award, Wrench } from 'lucide-react';

export const HeroBanner = () => {
  const { setSelectedCategory } = useStore();
  const navigate = useNavigate();

  const handleExploreClick = () => {
    setSelectedCategory('ALL');
    navigate('/categories');
    window.scrollTo(0, 0);
  };

  return (
    <div className="mx-3 sm:mx-6 lg:mx-8 mt-2 mb-3 sm:mt-3 sm:mb-6 font-sans">
      
      {/* Edge-to-Edge Widescreen Video Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-2xl text-white w-full h-[60vh] min-h-[460px] md:h-[78vh] md:min-h-[620px] flex items-end p-6 sm:p-10 lg:p-14">
        
        {/* Seamless Edge-to-Edge Loop Video */}
        <video
          src="/videos/hero-rc.mp4"
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          className="absolute inset-0 w-full h-full object-cover object-center z-0"
        />

        {/* Vignette & Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-slate-950/20 z-10 pointer-events-none" />

        {/* Campaign Copy Overlay */}
        <div className="relative z-20 space-y-2 sm:space-y-5 max-w-3xl pb-2 sm:pb-4">
          
          {/* Main Title */}
          <h1 className="text-xl sm:text-2xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight md:leading-none drop-shadow-md my-2 md:my-4">
            HYPER-SPEED BASHERS & DRIFT MACHINES
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-lg text-slate-200 font-bold max-w-xl drop-shadow-sm">
            Bench-tested 4WD beasts with 24H dispatch guarantee.
          </p>

          {/* Big Pill Button */}
          <div className="pt-1 sm:pt-2">
            <button
              onClick={handleExploreClick}
              className="group bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs sm:text-base px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-xl shadow-emerald-500/30 flex items-center gap-2.5 transition-all cursor-pointer"
            >
              <span>⚡ Explore Sale Collection</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
