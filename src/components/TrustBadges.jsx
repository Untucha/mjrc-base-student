import React from 'react';
import { useStore, DEFAULT_TICKER_ITEMS } from '../context/StoreContext';
import { ShieldCheck, Instagram, Rocket, Package, CheckCircle2 } from 'lucide-react';

export const RunningTicker = ({ className = '' }) => {
  const { marqueeTicker } = useStore();

  const isTickerActive = marqueeTicker ? marqueeTicker.isActive !== false : true;
  const rawItems = marqueeTicker?.items && marqueeTicker.items.length > 0
    ? marqueeTicker.items
    : DEFAULT_TICKER_ITEMS;

  if (!isTickerActive) return null;

  // Duplicate items if small so marquee animation loops smoothly
  const tickerItems = rawItems.length < 4 ? [...rawItems, ...rawItems] : rawItems;

  return (
    <div className={`w-full overflow-hidden bg-slate-900 border-y border-slate-800 py-3 sm:py-3.5 shadow-md relative ${className}`}>
      {/* Inline Marquee Animation Styles */}
      <style>{`
        @keyframes infiniteMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker-marquee {
          display: flex;
          width: max-content;
          animation: infiniteMarquee 20s linear infinite;
        }
        .animate-ticker-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      {/* Carbon Mesh Background Texture Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

      {/* Ticker Content Wrapper (Duplicated once for 50% translation loop) */}
      <div className="animate-ticker-marquee flex items-center">
        {[...tickerItems, ...tickerItems].map((text, index) => (
          <div key={index} className="flex items-center whitespace-nowrap px-4 shrink-0">
            <span className="text-emerald-400 text-xs sm:text-sm font-black mr-2 animate-pulse">
              ⚡
            </span>
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-100 hover:text-emerald-300 transition-colors">
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TrustCards = ({ className = '' }) => {
  const cards = [
    {
      id: 'tb-1',
      icon: ShieldCheck,
      emoji: '🛡️',
      title: 'Zero-Risk Secure Payments',
      subtitle: 'Instant UPI, Cards & Net Banking with 256-Bit Bank Grade Encryption.',
      badge: '256-Bit Encrypted',
      glow: 'from-emerald-500/10 via-teal-500/5 to-transparent'
    },
    {
      id: 'tb-2',
      icon: Instagram,
      emoji: '📸',
      title: 'Follow @mjrcbase on Instagram',
      subtitle: 'Watch running videos, live customer deliveries, unboxings, and new arrivals directly on our official page.',
      badge: 'EXPLORE REELS & MEDIA →',
      link: 'https://www.instagram.com/mjrcbase',
      glow: 'from-pink-500/10 via-purple-500/5 to-transparent'
    },
    {
      id: 'tb-3',
      icon: Rocket,
      emoji: '🚀',
      title: 'Express Shiprocket Logistics',
      subtitle: 'Priority domestic surface and express dispatch via Shiprocket with real-time tracking from Mysore hub.',
      badge: 'TRACKED DISPATCH',
      glow: 'from-teal-500/10 via-emerald-500/5 to-transparent'
    },
    {
      id: 'tb-4',
      icon: Package,
      emoji: '📦',
      title: 'Original Box Spares Included',
      subtitle: 'Every kit ships strictly with complete factory-included standard parts, controller, charger, and tools as listed in box contents.',
      badge: 'FACTORY IN-BOX ITEMS',
      glow: 'from-emerald-500/10 via-slate-500/5 to-transparent'
    }
  ];

  return (
    <div className={`w-full space-y-4 sm:space-y-8 my-5 sm:my-10 md:my-12 ${className}`}>
      {/* SECTION HEADER & LIVE PROTOCOL BADGE */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] sm:text-xs font-black tracking-wider uppercase shadow-xs mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>🟢 VERIFIED HOBBY PROTOCOL</span>
          </div>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Why 1,500+ Active Racers Trust <span className="text-emerald-700">MJ RC BASE</span>
          </h2>
        </div>
        <div className="text-xs font-bold text-slate-600 hidden sm:block">
          🛡️ Mysore Central Facility Standard
        </div>
      </div>

      {/* BOTTOM GRID: Clean Glass Micro-Cards on Mobile */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
          {cards.map((card) => {
            const Icon = card.icon;
            const CardTag = card.link ? 'a' : 'div';
            const linkProps = card.link ? {
              href: card.link,
              target: '_blank',
              rel: 'noopener noreferrer'
            } : {};

            return (
              <CardTag
                key={card.id}
                {...linkProps}
                className="group relative bg-white backdrop-blur-md border border-slate-200/80 hover:border-emerald-500/50 p-3 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 hover:scale-105 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                {/* Dynamic Ambient Corner Gradient Reflection */}
                <div className={`absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br ${card.glow} rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none`} />

                <div>
                  {/* Top Header Row with Emoji & Icon */}
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-xs">
                      <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-base sm:text-2xl filter drop-shadow-xs">{card.emoji}</span>
                  </div>

                  {/* Card Title & Subtitle */}
                  <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors mb-1 sm:mb-1.5">
                    {card.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed line-clamp-3 sm:line-clamp-none">
                    {card.subtitle}
                  </p>
                </div>

                {/* Bottom Footer Badge & Laser Line */}
                <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1 truncate">
                    <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{card.badge}</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 group-hover:text-emerald-700 transition-colors shrink-0">
                    Verified →
                  </span>
                </div>
              </CardTag>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const TrustBadges = ({ className = '' }) => {
  return (
    <div className={className}>
      <TrustCards />
    </div>
  );
};
