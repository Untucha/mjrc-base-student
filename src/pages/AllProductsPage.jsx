import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Heart, Coins, Eye, Star, ArrowLeft, ArrowUpDown, Filter, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';

const CRAWLER_NAMES = new Set(['FMS', 'RGT 4WD', 'RGT', 'JJR/C', 'JJRC', 'HB TOYS', 'MN MODEL', 'TRAXXAS', 'AXIAL']);

const getBrandGroup = (p) => {
  if (p.brandGroup) return p.brandGroup;
  if (p.isCrawlerBrand) return 'crawler';
  const brandName = (p.brand || '').toUpperCase().trim();
  return CRAWLER_NAMES.has(brandName) ? 'crawler' : 'speed_scale';
};

const checkIsScaleModel = (p) => {
  const cat = (p.category || '').toLowerCase().trim();
  const title = (p.title || p.name || '').toLowerCase();
  const id = (p.id || '').toLowerCase();
  return (
    cat === 'scale models' ||
    cat === 'scale model' ||
    cat === 'diecast' ||
    p.isScaleModel === true ||
    id.includes('scale-model') ||
    id.includes('diecast') ||
    title.includes('scale model') ||
    title.includes('diecast')
  );
};

const PRIMARY_ZONES = [
  { id: 'all', label: 'All Vehicles', icon: '🏎️' },
  { id: 'latest', label: 'Latest RC Cars', icon: '⚡' },
  { id: 'speed_scale', label: 'Speed & Scale Brands', icon: '🏁' },
  { id: 'crawler', label: 'Crawler Brands', icon: '🧗' },
  { id: 'category', label: 'Shop By Category', icon: '📦' }
];

export const AllProductsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { products, allProducts, wishlist, toggleWishlist } = useStore();
  const liveList = (allProducts && allProducts.length > 0) ? allProducts : (products || []);

  const [activeZone, setActiveZone] = useState('all'); // 'all' | 'latest' | 'speed_scale' | 'crawler' | 'category' | 'scale_models'
  const [subFilter, setSubFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('default');

  // Handle Zone Change & Reset SubFilter
  const handleZoneChange = (zoneId) => {
    setActiveZone(zoneId);
    setSubFilter('ALL');
  };

  // Dynamic Sub-Filter Options based on activeZone
  const subFilterOptions = useMemo(() => {
    if (activeZone === 'all') {
      const scales = Array.from(
        new Set(
          liveList
            .filter(p => p && p.hidden !== true && p.isVisible !== false)
            .map(p => (p.scale || '').trim())
            .filter(Boolean)
        )
      );
      return ['ALL', ...scales];
    }

    if (activeZone === 'latest') {
      return ['ALL'];
    }

    if (activeZone === 'speed_scale') {
      return ['ALL', 'WLtoys', 'Bburago', 'RLAARLO', 'MJX R/C', 'HStar', 'CCA AUTO', '1:64 MINI GT', 'JIABAILE', 'ARRMA', 'KYOSHO'];
    }

    if (activeZone === 'crawler') {
      return ['ALL', 'FMS', 'RGT 4WD', 'JJR/C', 'HB TOYS', 'MN MODEL', 'TRAXXAS', 'AXIAL'];
    }

    if (activeZone === 'category') {
      return ['ALL', 'RC Crawlers', 'Mini RC Cars', 'Drift RC', 'RC Boats', 'Monster Trucks', 'RC Heavy Machinery'];
    }

    if (activeZone === 'scale_models') {
      return ['ALL', '1:64', '1:43', '1:24', '1:18'];
    }

    return ['ALL'];
  }, [activeZone, liveList]);

  // Master Filter Engine
  let filteredProducts = liveList.filter(p => {
    if (!p || p.hidden === true || p.isVisible === false) return false;

    // 1. Primary Zone Filtering
    if (activeZone === 'latest') {
      const isFeatured = p.isFeatured === true || p.featured === true || p.featuredOnHome === true;
      if (!isFeatured) return false;
    } else if (activeZone === 'speed_scale') {
      if (getBrandGroup(p) !== 'speed_scale') return false;
    } else if (activeZone === 'crawler') {
      if (getBrandGroup(p) !== 'crawler') return false;
    } else if (activeZone === 'category') {
      if (checkIsScaleModel(p)) return false;
    } else if (activeZone === 'scale_models') {
      if (!checkIsScaleModel(p)) return false;
    }

    // 2. Context-Aware Sub-Filter Pill Filtering
    if (subFilter !== 'ALL') {
      if (activeZone === 'all') {
        const pScale = (p.scale || '').toLowerCase().trim();
        const selScale = subFilter.toLowerCase().trim();
        if (pScale !== selScale) return false;
      } else if (activeZone === 'speed_scale' || activeZone === 'crawler') {
        const pBrand = (p.brand || '').toLowerCase().replace(/[\s\-_]/g, '');
        const selBrand = subFilter.toLowerCase().replace(/[\s\-_]/g, '');
        if (!pBrand.includes(selBrand) && !selBrand.includes(pBrand)) return false;
      } else if (activeZone === 'category') {
        const pCat = (p.category || '').toLowerCase().trim();
        const selCat = subFilter.toLowerCase().trim();
        if (pCat !== selCat) return false;
      } else if (activeZone === 'scale_models') {
        const pScale = (p.scale || '').toLowerCase().trim();
        const selScale = subFilter.toLowerCase().trim();
        if (!pScale.includes(selScale)) return false;
      }
    }

    return true;
  });

  // Sort products
  if (sortOption === 'lowToHigh') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortOption === 'highToLow') {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  return (
    <div className="py-3 px-3 sm:py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[75vh] font-sans text-slate-900">
      
      {/* Header */}
      <div className="mb-3 pb-3 sm:mb-6 sm:pb-6 border-b border-slate-200">
        <button
          onClick={() => {
            const returnSection = location.state?.returnSection || (typeof window !== 'undefined' ? sessionStorage.getItem('returnSection') : null) || 'latest-rc-cars';
            if (typeof window !== 'undefined' && window.history && window.history.length > 2) {
              navigate(-1);
            } else {
              navigate('/', { state: { returnSection } });
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-700 hover:text-emerald-700 mb-2 sm:mb-3 bg-slate-100 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>← Back</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mt-1 sm:mt-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 mb-1 sm:text-4xl sm:font-black flex items-center gap-2">
                Complete RC Hobby Catalog <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </h1>
              <span className="bg-emerald-50 text-emerald-800 font-extrabold text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-emerald-200 shrink-0">
                {filteredProducts.length} Models
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium line-clamp-1 sm:line-clamp-none mb-1 sm:mb-0 max-w-2xl">
              Explore all {liveList.length} bench-tested 6S bashers, scale crawlers, drift machines & micro diecast vehicles ready for Mysore 24H dispatch.
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-start sm:self-auto mt-1 sm:mt-0">
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="h-8 text-xs py-1 px-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-xs"
            >
              <option value="default">Sort by: Featured</option>
              <option value="lowToHigh">Price: Low to High</option>
              <option value="highToLow">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Bar (Top Primary Zone Selector + Dynamic Context Sub-Filters) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2 sm:p-4 mb-4 sm:mb-8 space-y-2 sm:space-y-3.5 shadow-xs">
        
        {/* MOBILE VIEW: Touch-optimized 2-column Grid (md:hidden) */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-50/80 rounded-xl border border-slate-200/80 md:hidden">
          {PRIMARY_ZONES.map(zone => (
            <button
              key={zone.id}
              onClick={() => handleZoneChange(zone.id)}
              className={`text-xs py-1.5 px-2.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer font-semibold ${
                activeZone === zone.id
                  ? 'bg-slate-900 text-white font-black shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{zone.icon}</span>
              <span className="truncate">{zone.label}</span>
            </button>
          ))}
        </div>

        {/* DESKTOP VIEW: Segmented Row Switcher (hidden md:flex) */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0 mr-1">Zone:</span>
          {PRIMARY_ZONES.map(zone => (
            <button
              key={zone.id}
              onClick={() => handleZoneChange(zone.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeZone === zone.id
                  ? 'bg-slate-900 text-white shadow-md scale-[1.02]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              <span>{zone.icon}</span>
              <span>{zone.label}</span>
            </button>
          ))}
        </div>

        {/* ROW 2: Dynamic Context-Aware Sub-Filter Row (Compact H-8 Chips) */}
        {subFilterOptions.length > 1 && (
          <div className="flex flex-row items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1 pt-2 sm:pt-2.5 border-t border-slate-100">
            <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3 text-emerald-600" /> Filter:
            </span>
            {subFilterOptions.map(opt => {
              const isAll = opt === 'ALL';
              const label = isAll
                ? (activeZone === 'speed_scale' ? 'All Speed & Scale' : activeZone === 'crawler' ? 'All Crawlers' : activeZone === 'category' ? 'All Categories' : activeZone === 'scale_models' ? 'All Scale Models' : 'All Scales')
                : opt;
              const isSelected = subFilter === opt;

              return (
                <button
                  key={opt}
                  onClick={() => setSubFilter(opt)}
                  className={`h-8 text-[11px] px-3 rounded-full shrink-0 flex items-center justify-center font-extrabold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 border border-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Product List Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto my-8 sm:my-12 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-2xl border border-slate-200">
            🏎️
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Machines Found</h3>
          <p className="text-xs text-slate-600 mb-6 font-medium">
            No machines currently bench-tested in this class. Check back soon!
          </p>
          <button
            onClick={() => {
              setActiveZone('all');
              setSubFilter('ALL');
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            Explore All Machines
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

    </div>
  );
};

export default AllProductsPage;
