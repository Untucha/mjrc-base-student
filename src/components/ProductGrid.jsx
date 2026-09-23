import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Heart, ArrowRight, Star, Flame, PackageCheck, CheckCircle2, X, ChevronRight } from 'lucide-react';
import { ProductCard } from './ProductCard';

export const ProductGrid = ({ limit = 10 }) => {
  const { products, setSelectedProduct } = useStore();
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

  // Primary latest RC products fetched directly from active Firestore products collection
  const displayProducts = useMemo(() => {
    // 1. Strict Exclusion of Scale Models & Diecast
    const nonScaleProducts = (products || []).filter(Boolean).filter(p => {
      if (!p || p.hidden === true || p.isVisible === false) return false;
      const cat = typeof p.category === 'string' ? p.category.toLowerCase().trim() : (p.category?.name || '').toLowerCase().trim();
      return (
        cat !== 'scale models' &&
        cat !== 'scale model' &&
        cat !== 'diecast' &&
        p.isScaleModel !== true
      );
    });

    // 2. Filter Featured Flagship Cars
    const featured = nonScaleProducts.filter(p =>
      p && (p.isFeatured === true || p.featured === true || p.featuredOnHome === true)
    );

    const finalSource = featured.length > 0 ? featured : nonScaleProducts;
    return finalSource.slice(0, Math.min(limit || 10, 10));
  }, [products, limit]);

  return (
    <section id="product-grid" className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      
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

      {/* DESKTOP VIEW (hidden md:flex): Permanent Header */}
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

      {/* Primary Product Grid */}
      {displayProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center my-6 shadow-xs">
          <div className="text-3xl mb-2">🏎️</div>
          <h3 className="text-base font-black text-slate-900 mb-1">No Latest RC Cars Available</h3>
          <p className="text-xs text-slate-600 mb-4 font-medium">Check back soon for new Mysore bench-tested arrivals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {displayProducts.map((product) => (
            <ProductCard key={product.id || product._id} product={product} />
          ))}
        </div>
      )}

      {/* Bottom CTA Button */}
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
          <span>⚡ Explore Complete Collection ({(products || []).length}+ Hobby Machines)</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </Link>
      </div>

    </section>
  );
};
