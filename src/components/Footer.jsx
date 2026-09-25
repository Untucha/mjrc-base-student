import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Lock, CheckCircle2, Wrench, Phone, Sparkles } from 'lucide-react';

export const Footer = () => {
  const { setSelectedCategory, setIsAccountOpen } = useStore();

  const handleCategoryNav = (cat) => {
    if (setSelectedCategory) setSelectedCategory(cat);
  };

  const handleOpenTermsModal = () => {
    if (setIsAccountOpen) {
      setIsAccountOpen(true);
    }
  };

  return (
    <footer className="relative w-full overflow-hidden border-t border-white/10 bg-black/40 text-white">
      {/* Clean, Visible Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-85 select-none"
      >
        <source src="/mjrc-footer-video.mp4" type="video/mp4" />
      </video>

      {/* Glossy Frosted Glass Overlay */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[4px] pointer-events-none" />

      {/* Interactive Content Layer */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pointer-events-auto">
        
        {/* MOBILE ONLY LAYOUT (< 768px) */}
        <div className="block md:hidden backdrop-blur-md bg-slate-950/40 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-5">
          
          {/* Top Row: Brand Logo & Indicator */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shadow-emerald-500/20">
                MJ
              </div>
              <span className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                MJ RC <span className="text-emerald-400">BASE</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            India's premier destination for high-speed brushless RC machines, precision scale models, and genuine spare parts.
          </p>

          {/* Trust Points */}
          <div className="space-y-1.5 pt-1 text-[11px] font-bold text-slate-200">
            <div className="flex items-center gap-2">
              <span>🛡️ 100% Genuine Hobby-Grade RC</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔬 Mysore Central Bench-Tested</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⚙️ Factory Spares & Technical Support</span>
            </div>
          </div>

          {/* Direct Call Button Glass Pill */}
          <a
            href="tel:+919686078395"
            className="w-full py-2.5 px-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 font-medium text-xs flex items-center justify-center gap-2 backdrop-blur-md active:scale-95 transition-all shadow-sm"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Call Technical Dispatch (+91 96860 78395)</span>
          </a>

          {/* Navigation & Legal Links */}
          <div className="grid grid-cols-2 gap-4 text-left pt-2 border-t border-white/10">
            <div>
              <h5 className="text-[11px] font-bold tracking-wider text-slate-300 uppercase mb-2">
                RC COLLECTIONS
              </h5>
              <div className="space-y-1.5 text-xs text-slate-400 font-semibold">
                <Link to="/categories" className="hover:text-emerald-400 block transition-colors">
                  Shop by Category
                </Link>
                <Link to="/catalog" className="hover:text-emerald-400 block transition-colors">
                  Shop by Brands
                </Link>
                <Link to="/catalog" className="hover:text-emerald-400 block transition-colors">
                  Latest RC Cars
                </Link>
              </div>
            </div>

            <div>
              <h5 className="text-[11px] font-bold tracking-wider text-slate-300 uppercase mb-2">
                SUPPORT & LEGAL
              </h5>
              <div className="space-y-1.5 text-xs text-slate-400 font-semibold">
                <Link to="/track" className="hover:text-emerald-400 block transition-colors">
                  Track Your Order
                </Link>
                <Link to="/shipping-policy" className="hover:text-emerald-400 block transition-colors">
                  Shipping & Delivery Policy
                </Link>
                <Link to="/replacement-policy" className="hover:text-emerald-400 block transition-colors">
                  Replacement & Return Policy
                </Link>
                <Link to="/terms-and-conditions" className="hover:text-emerald-400 block transition-colors">
                  Terms & Conditions
                </Link>
                <Link to="/privacy-policy" className="hover:text-emerald-400 block transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>

          {/* Secure Payments Section */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <h5 className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
              100% SECURE CHECKOUT
            </h5>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-extrabold">
              <div className="bg-slate-900/90 border border-slate-700/80 px-2.5 py-2 rounded-xl text-center shadow-xs text-slate-200 flex items-center justify-center gap-1">
                <span>🟢 UPI / GPay</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-700/80 px-2.5 py-2 rounded-xl text-center shadow-xs text-slate-200 flex items-center justify-center gap-1">
                <span>🟣 PhonePe</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-700/80 px-2.5 py-2 rounded-xl text-center shadow-xs text-slate-200 flex items-center justify-center gap-1">
                <span>💳 RuPay / Cards</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-700/80 px-2.5 py-2 rounded-xl text-center shadow-xs text-slate-200 flex items-center justify-center gap-1">
                <span>📦 Cash on Delivery</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar Mobile */}
          <div className="pt-3 border-t border-white/10 flex flex-col items-center gap-3 text-center text-xs">
            <p className="text-slate-400 font-semibold">
              © 2026 MJ RC BASE. All rights reserved.
            </p>
            <a
              href="https://zonexgrowth-agency.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 text-xs font-medium tracking-wide transition-all shadow-sm hover:shadow-emerald-950/50 hover:scale-[1.03] group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                Crafted with ❤️ by{' '}
                <span className="font-bold text-white group-hover:text-emerald-200 transition-colors">
                  ZoneX Growth Agency
                </span>
              </span>
              <span className="text-[10px] text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                ↗
              </span>
            </a>
          </div>

        </div>

        {/* DESKTOP ONLY LAYOUT (>= 768px) */}
        <div className="hidden md:block backdrop-blur-md bg-slate-950/40 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-slate-800/80">
            
            {/* Column 1: Brand & Trust Badges */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                  MJ
                </div>
                <span className="text-2xl font-black text-white tracking-tight">
                  MJ RC <span className="text-emerald-400">BASE</span>
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                India's premier destination for high-speed brushless RC machines, precision scale models, and genuine spare parts.
              </p>

              <div className="space-y-2 pt-1 text-xs font-bold text-slate-200">
                <div className="flex items-center gap-2">
                  <span>🛡️ 100% Genuine Hobby-Grade RC</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🔬 Mysore Central Bench-Tested</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚙️ Factory Spares & Technical Support</span>
                </div>
              </div>
            </div>

            {/* Column 2: RC Collections (Match Header Nav) */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> RC Collections
              </h4>
              <ul className="space-y-2 text-xs text-slate-400 font-bold">
                <li>
                  <Link to="/categories" className="hover:text-emerald-400 transition-colors block">
                    Shop by Category
                  </Link>
                </li>
                <li>
                  <Link to="/catalog" className="hover:text-emerald-400 transition-colors block">
                    Shop by Brands
                  </Link>
                </li>
                <li>
                  <Link to="/catalog" className="hover:text-emerald-400 transition-colors block">
                    Latest RC Cars
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Support & Legal */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Customer Support & Legal
              </h4>
              <ul className="space-y-2 text-xs text-slate-400 font-bold">
                <li>
                  <Link to="/track" className="hover:text-emerald-400 transition-colors block">
                    Track Your Order
                  </Link>
                </li>
                <li>
                  <Link to="/shipping-policy" className="hover:text-emerald-400 transition-colors block">
                    Shipping & Delivery Policy
                  </Link>
                </li>
                <li>
                  <Link to="/replacement-policy" className="hover:text-emerald-400 transition-colors block">
                    Replacement & Return Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-and-conditions" className="hover:text-emerald-400 transition-colors block">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors block">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: 100% Secure Checkout & Payments */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> 100% SECURE CHECKOUT
              </h4>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Instant encrypted payments & verified delivery across India
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-black text-slate-100">
                <div className="bg-slate-900/90 border border-slate-700/80 p-2.5 rounded-xl text-center shadow-xs flex items-center justify-center gap-1">
                  <span>🟢 UPI / GPay</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-700/80 p-2.5 rounded-xl text-center shadow-xs flex items-center justify-center gap-1">
                  <span>🟣 PhonePe</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-700/80 p-2.5 rounded-xl text-center shadow-xs flex items-center justify-center gap-1">
                  <span>💳 RuPay / Cards</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-700/80 p-2.5 rounded-xl text-center shadow-xs flex items-center justify-center gap-1">
                  <span>📦 Cash on Delivery</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Copyright & Agency Attribution Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-semibold gap-3">
            <div>
              © 2026 MJ RC BASE. All rights reserved.
            </div>

            <a
              href="https://zonexgrowth-agency.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 text-xs font-medium tracking-wide transition-all shadow-sm hover:shadow-emerald-950/50 hover:scale-[1.03] group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                Crafted with ❤️ by{' '}
                <span className="font-bold text-white group-hover:text-emerald-200 transition-colors">
                  ZoneX Growth Agency
                </span>
              </span>
              <span className="text-[10px] text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                ↗
              </span>
            </a>
          </div>

        </div>

      </div>

    </footer>
  );
};
