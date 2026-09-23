import React from 'react';
import { useStore } from '../context/StoreContext';
import { Link, useNavigate } from 'react-router-dom';

const BRANDS = [
  // Speed & Scale Brands
  {
    id: 'wltoys',
    name: 'WLtoys',
    brandGroup: 'speed_scale',
    renderLogo: () => (
      <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs sm:text-sm">
        <div className="w-5 h-5 bg-red-600 rotate-45 flex items-center justify-center rounded-xs shrink-0 shadow-2xs">
          <span className="-rotate-45 text-white font-mono text-[9px] font-black">W</span>
        </div>
        <span className="tracking-tight text-slate-900">WL<span className="text-red-600">toys</span></span>
      </div>
    )
  },
  {
    id: 'bburago',
    name: 'Bburago',
    brandGroup: 'speed_scale',
    renderLogo: () => (
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-5 bg-gradient-to-b from-emerald-600 via-white to-red-600 rounded-xs shadow-2xs border border-slate-300" />
        <span className="font-extrabold text-red-600 italic tracking-tighter text-xs sm:text-sm drop-shadow-2xs">
          Bburago
        </span>
      </div>
    )
  },
  {
    id: 'rlaarlo',
    name: 'RLAARLO',
    brandGroup: 'speed_scale',
    renderLogo: () => (
      <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs sm:text-sm">
        <div className="w-5 h-5 bg-emerald-500 text-slate-950 flex items-center justify-center font-black rounded-md shadow-2xs text-[10px] italic">
          RL
        </div>
        <span className="tracking-wider text-slate-900 font-mono">RLAARLO</span>
      </div>
    )
  },
  {
    id: 'mjx',
    name: 'MJX R/C',
    brandGroup: 'speed_scale',
    renderLogo: () => (
      <div className="flex flex-col items-center leading-none">
        <div className="flex items-center gap-1 text-red-600 font-black text-xs sm:text-sm tracking-tight">
          <span className="text-red-500">❖</span>
          <span>MJX R/C</span>
        </div>
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Technic</span>
      </div>
    )
  },
  {
    id: 'hstar',
    name: 'HStar',
    brandGroup: 'speed_scale',
    renderLogo: () => (
      <div className="flex items-center gap-1 font-black text-xs sm:text-sm">
        <span className="text-blue-600 text-sm">★</span>
        <span className="text-blue-600">H<span className="text-red-600">Star</span></span>
      </div>
    )
  },
  {
    id: 'cca',
    name: 'CCA AUTO',
    brandGroup: 'speed_scale',
    renderLogo: () => (
      <div className="bg-amber-400 text-slate-950 font-black text-xs sm:text-sm px-3 py-1 rounded-lg border border-amber-500 shadow-2xs tracking-widest uppercase">
        CCA AUTO
      </div>
    )
  },
  {
    id: 'mini-gt',
    name: '1:64 MINI GT',
    brandGroup: 'speed_scale',
    renderLogo: () => (
      <div className="bg-slate-950 text-white font-black text-[11px] sm:text-xs px-2.5 py-1 rounded-lg border border-slate-800 tracking-wider uppercase flex items-center gap-1">
        <span className="text-amber-400 text-[10px]">1:64</span>
        <span>MINI GT</span>
      </div>
    )
  },
  {
    id: 'jiabaile',
    name: 'JIABAILE',
    brandGroup: 'speed_scale',
    renderLogo: () => (
      <div className="border border-blue-500/80 px-2.5 py-0.5 rounded-full bg-blue-50 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-red-600" />
        <span className="font-extrabold text-blue-700 text-xs sm:text-sm tracking-tight">JIABAILE</span>
      </div>
    )
  },
  {
    id: 'arrma',
    name: 'ARRMA',
    brandGroup: 'speed_scale',
    renderLogo: () => (
      <div className="bg-red-600 text-white font-black italic tracking-wider text-xs sm:text-sm px-3 py-1 rounded-lg shadow-xs uppercase">
        ARRMA
      </div>
    )
  },
  {
    id: 'kyosho',
    name: 'KYOSHO',
    brandGroup: 'speed_scale',
    renderLogo: () => (
      <div className="bg-slate-900 text-red-500 font-black tracking-widest text-xs sm:text-sm px-3 py-1 rounded-lg border border-slate-800 uppercase italic">
        KYOSHO
      </div>
    )
  },
  {
    id: 'hot-wheels',
    name: 'HotWheels',
    brandGroup: 'speed_scale',
    renderLogo: () => (
      <div className="bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-white font-black italic tracking-tighter px-3 py-1 rounded-xl shadow-xs text-xs sm:text-sm skew-x-[-8deg] border border-amber-300 flex items-center gap-1">
        <span className="text-amber-200 text-xs">🔥</span>
        <span className="drop-shadow-xs font-sans tracking-tight">HotWheeLs</span>
      </div>
    )
  },

  // Crawler Brands
  {
    id: 'fms',
    name: 'FMS',
    brandGroup: 'crawler',
    renderLogo: () => (
      <div className="flex flex-col items-center leading-none">
        <div className="bg-amber-500 text-slate-950 font-black tracking-widest text-xs sm:text-sm px-2.5 py-0.5 rounded-md border border-amber-600 shadow-2xs italic">
          FMS
        </div>
        <span className="text-[7.5px] font-extrabold text-slate-500 tracking-wider uppercase mt-1">SCALE REALISM</span>
      </div>
    )
  },
  {
    id: 'rgt',
    name: 'RGT 4WD',
    brandGroup: 'crawler',
    renderLogo: () => (
      <div className="bg-red-600 text-white font-black text-xs sm:text-sm px-3 py-1 rounded-md tracking-widest shadow-2xs italic flex items-center gap-1">
        <span>RGT</span>
        <span className="text-[9px] not-italic text-red-200">4WD</span>
      </div>
    )
  },
  {
    id: 'jjrc',
    name: 'JJR/C',
    brandGroup: 'crawler',
    renderLogo: () => (
      <div className="font-black italic text-red-600 text-xs sm:text-sm tracking-widest bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
        JJR/C
      </div>
    )
  },
  {
    id: 'hb-toys',
    name: 'HB TOYS',
    brandGroup: 'crawler',
    renderLogo: () => (
      <div className="flex items-center gap-1 font-black text-slate-900 text-xs sm:text-sm">
        <div className="w-4 h-4 bg-slate-900 text-red-500 flex items-center justify-center font-mono text-[9px] rounded-xs border border-slate-800">HB</div>
        <span>HB TOYS</span>
      </div>
    )
  },
  {
    id: 'mn-model',
    name: 'MN MODEL',
    brandGroup: 'crawler',
    renderLogo: () => (
      <div className="bg-amber-50 border border-amber-200 text-slate-900 font-black text-xs sm:text-sm px-2.5 py-1 rounded-xl flex items-center gap-1">
        <span className="text-amber-600 text-xs">🐂</span>
        <span>MN MODEL</span>
      </div>
    )
  },
  {
    id: 'traxxas',
    name: 'TRAXXAS',
    brandGroup: 'crawler',
    renderLogo: () => (
      <div className="bg-blue-600 text-white font-black italic tracking-wider text-xs sm:text-sm px-3 py-1 rounded-lg shadow-xs uppercase">
        TRAXXAS
      </div>
    )
  },
  {
    id: 'axial',
    name: 'AXIAL',
    brandGroup: 'crawler',
    renderLogo: () => (
      <div className="bg-slate-950 text-emerald-400 font-black tracking-widest text-xs sm:text-sm px-3 py-1 rounded-lg border border-slate-800 uppercase italic">
        AXIAL
      </div>
    )
  }
];

export const BrandGrid = () => {
  const { brandsList, brandVisibility, brandTabTitles } = useStore();
  const [brandSubTab, setBrandSubTab] = React.useState('speed_scale'); // 'speed_scale' | 'crawler'

  const sourceBrands = Array.isArray(brandsList) ? brandsList : BRANDS;

  const CRAWLER_NAMES = new Set(['FMS', 'RGT 4WD', 'RGT', 'JJR/C', 'JJRC', 'HB TOYS', 'MN MODEL', 'TRAXXAS', 'AXIAL']);

  const getBrandGroup = (brand) => {
    if (typeof brand === 'object' && brand.brandGroup) return brand.brandGroup;
    if (typeof brand === 'object' && brand.isCrawlerBrand) return 'crawler';
    const name = (typeof brand === 'string' ? brand : (brand?.name || '')).toUpperCase();
    return CRAWLER_NAMES.has(name) ? 'crawler' : 'speed_scale';
  };

  const visibleBrands = sourceBrands.filter((brand) => {
    const brandName = typeof brand === 'string' ? brand : (brand?.name || '');
    if (typeof brand === 'object' && brand.isVisible === false) return false;
    if (brandVisibility && brandVisibility[brandName] === false) return false;

    const bGroup = getBrandGroup(brand);
    return bGroup === brandSubTab;
  });

  return (
    <section id="shop-by-brand" className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Shop by Brand
          </h2>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">
            Official scale hobby manufacturers & diecast collector brands
          </p>
        </div>

        {/* Dual-Tab Segmented Switcher (Visible on Mobile, Tablet & Desktop) */}
        <div className="inline-flex p-1 bg-slate-100 rounded-full border border-slate-200/80 self-start sm:self-auto shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => setBrandSubTab('speed_scale')}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer select-none ${
              brandSubTab === 'speed_scale'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800 font-bold'
            }`}
          >
            {brandTabTitles?.speed_scale || 'Speed & Scale Brands'}
          </button>
          <button
            type="button"
            onClick={() => setBrandSubTab('crawler')}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer select-none flex items-center gap-1 ${
              brandSubTab === 'crawler'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800 font-bold'
            }`}
          >
            <span>🧗 {brandTabTitles?.crawler || 'Crawler Brands'}</span>
          </button>
        </div>
      </div>

      {/* 2-column mobile / 3-column tablet / 4-to-5 column desktop grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {(visibleBrands || []).filter(Boolean).map((brand, idx) => {
          const brandName = typeof brand === 'string' ? brand : (brand?.name || 'RC Brand');
          const brandId = typeof brand === 'string' ? `brand-${idx}` : (brand?.id || `brand-${idx}`);
          const logoUrl = (brand && typeof brand === 'object') ? (brand.logoUrl || brand.logo) : null;
          const matchedStaticBrand = typeof brand === 'string' ? (BRANDS || []).find(b => b && b.name && b.name.toLowerCase() === brand.toLowerCase()) : null;

          return (
            <Link
              key={brandId}
              to={`/brand/${encodeURIComponent(brandName)}`}
              state={{ returnSection: 'shop-by-brand' }}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('returnSection', 'shop-by-brand');
                }
              }}
              className="relative w-full h-16 sm:h-18 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-center overflow-hidden p-1 hover:border-emerald-500/50 active:scale-95 group cursor-pointer select-none z-20 pointer-events-auto touch-manipulation"
            >
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={brandName} 
                  className="w-full h-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-300 block"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallbackEl = e.currentTarget.parentElement?.querySelector('.brand-text-fallback');
                    if (fallbackEl) {
                      fallbackEl.style.display = 'block';
                    }
                  }}
                />
              ) : null}

              {!logoUrl && typeof brand?.renderLogo === 'function' ? (
                brand.renderLogo()
              ) : !logoUrl && matchedStaticBrand && typeof matchedStaticBrand.renderLogo === 'function' ? (
                matchedStaticBrand.renderLogo()
              ) : null}

              {/* Text Fallback when no image/custom render or image load fails */}
              <span 
                className="brand-text-fallback font-extrabold text-slate-800 text-xs sm:text-sm text-center truncate px-1"
                style={{ display: logoUrl ? 'none' : (!logoUrl && (typeof brand?.renderLogo === 'function' || (matchedStaticBrand && typeof matchedStaticBrand.renderLogo === 'function'))) ? 'none' : 'block' }}
              >
                {brandName}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default BrandGrid;
