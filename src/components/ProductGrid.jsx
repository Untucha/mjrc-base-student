import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Heart, ArrowRight, Star, Flame, PackageCheck, CheckCircle2, X, ChevronRight } from 'lucide-react';
import { ProductCard } from './ProductCard';

export const ProductGrid = ({ limit, useLatestRcOnly }) => {
  const { products, latestRcCars, toggleWishlist, wishlist, setSelectedProduct, selectedCategory, setSelectedCategory } = useStore();
  const navigate = useNavigate();

  const handleProductClick = (e, prod) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }
    const product = (prod && (prod.id || prod._id)) ? prod : (e && (e.id || e._id) ? e : prod);
    if (!product) return;
    const targetId = product.id || product._id;
    if (setSelectedProduct) setSelectedProduct(product);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('returnSection', 'latest-rc-cars');
    }
    navigate(`/product/${targetId}`, { state: { returnSection: 'latest-rc-cars' } });
  };

  // Determine if a category filter is active
  const isFiltered = selectedCategory && selectedCategory !== 'ALL' && selectedCategory !== 'all';

  // Extract scale tag if selected category is a scale (e.g. '1:64 Scale', '1:64', '1:43 Scale', etc.)
  const activeScaleMatch = isFiltered ? selectedCategory.replace(' Scale', '').trim() : null;

  // Primary filtered products
  const displayProducts = useMemo(() => {
    if (isFiltered) {
      return (products || []).filter(p => {
        if (p.hidden === true || p.isVisible === false) return false;
        const pScale = (p.scale || '').toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        const sel = selectedCategory.toLowerCase();
        const matchTag = (activeScaleMatch || '').toLowerCase();
        return pScale.includes(sel) || (matchTag && pScale.includes(matchTag)) || pCat === sel || (matchTag && pCat.includes(matchTag));
      });
    }

    if (useLatestRcOnly || limit) {
      // 1. Strict Exclusion of Scale Models
      const nonScaleProducts = (products || []).filter(p => {
        if (!p || p.hidden === true || p.isVisible === false) return false;
        const cat = (p.category || '').toLowerCase().trim();
        return (
          cat !== 'scale models' &&
          cat !== 'scale model' &&
          cat !== 'diecast' &&
          p.isScaleModel !== true
        );
      });

      // 2. Filter Featured Flagship Cars
      const featured = nonScaleProducts.filter(p =>
        p.isFeatured === true || p.featured === true || p.featuredOnHome === true
      );

      const finalSource = featured.length > 0 ? featured : nonScaleProducts;
      return finalSource.slice(0, Math.min(limit || 10, 10));
    }

    return (products || []).filter(p => p.hidden !== true && p.isVisible !== false);
  }, [isFiltered, products, selectedCategory, activeScaleMatch, useLatestRcOnly, limit]);

  // Apply limit if passed (capped strictly to 10 models max for latest showcase)
  const visibleProducts = limit ? displayProducts.slice(0, Math.min(limit, 10)) : displayProducts;

  // Secondary non-filtered products ("More From MJ RC BASE")
  const secondaryProducts = isFiltered
    ? (products || []).filter(p => p.hidden !== true && p.isVisible !== false && !displayProducts.some(dp => dp.id === p.id))
    : [];

  return (
    <section id="product-grid" className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      
      {/* Header Banner */}
      {isFiltered ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 mb-8 text-slate-900 shadow-sm relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-extrabold mb-1.5 uppercase tracking-wider">
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {selectedCategory.includes('1:64') || selectedCategory === 'Scale Models' ? 'Scale Models Precision Series' : `${selectedCategory} Precision Series`}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                Showing {displayProducts.length} bench-tested scale models ready for 24H Mysore Hub dispatch.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (md:hidden): Clean 2-Row Header Architecture */}
          <div className="md:hidden px-1 pt-2 pb-1 flex flex-col gap-1 mb-3">
            {/* Row 1: Title, Micro-Badge & View All Action */}
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-lg font-black tracking-tight text-slate-900 truncate">Latest RC Cars</h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                  ✓ Bench-Tested
                </span>
              </div>

              <Link
                to="/catalog"
                state={{ fromHome: true, scrollPos: typeof window !== 'undefined' ? window.scrollY : 0, returnSection: 'latest-rc-cars' }}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('returnSection', 'latest-rc-cars');
                  }
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full whitespace-nowrap active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <span>View All 10</span>
                <span className="text-xs">→</span>
              </Link>
            </div>

            {/* Row 2: Streamlined Subtitle */}
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[92%]">
              High-speed bashers, crawlers & drift racers ready for dispatch
            </p>
          </div>

          {/* DESKTOP VIEW (hidden md:flex): 100% Untouched */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Latest RC Cars <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">Mysore Bench-Tested</span>
              </h2>
              <p className="text-xs text-slate-600 font-semibold">Bench-tested high-speed bashers, crawlers & drift racers ready for dispatch</p>
            </div>

            <Link
              to="/catalog"
              state={{ fromHome: true, scrollPos: typeof window !== 'undefined' ? window.scrollY : 0, returnSection: 'latest-rc-cars' }}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('returnSection', 'latest-rc-cars');
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>View All 10 Models</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </>
      )}

      {/* Primary Product Grid */}
      {visibleProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center my-6 shadow-xs">
          <div className="text-3xl mb-2">🏎️</div>
          <h3 className="text-base font-black text-slate-900 mb-1">No products found for "{selectedCategory}"</h3>
          <p className="text-xs text-slate-600 mb-4">Explore other scale sizes or reset to view our full collection.</p>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs"
          >
            View All RC Models
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Secondary Section ("Explore More RC Scales & Categories") */}
      {isFiltered && secondaryProducts.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>⚡ Explore More RC Scales & Categories</span>
              </h3>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">Check out our heavy 6S bashers, trail crawlers & drift racers</p>
            </div>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800"
            >
              Show All →
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {secondaryProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA Button */}
      {!isFiltered && (
        <div className="mt-8 text-center">
          <Link
            to="/catalog"
            state={{ fromHome: true, scrollPos: typeof window !== 'undefined' ? window.scrollY : 0, returnSection: 'latest-rc-cars' }}
            onClick={() => {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('returnSection', 'latest-rc-cars');
              }
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm px-8 py-3.5 rounded-2xl shadow-sm transition-all"
          >
            <span>⚡ Explore Complete Collection ({products.length}+ Hobby Machines)</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </Link>
        </div>
      )}

    </section>
  );
};
