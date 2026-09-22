import React, { useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ArrowLeft, Star, Heart, Flame, ArrowRight, ShieldAlert, CheckCircle2, Tag } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';

export const BrandPageView = () => {
  const { brandName, brandId } = useParams();
  const effectiveBrand = brandName || brandId || '';
  const decodedBrand = decodeURIComponent(effectiveBrand);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    products,
    brandVisibility,
    toggleWishlist,
    wishlist,
    setSelectedProduct
  } = useStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [effectiveBrand]);

  // Check master visibility for this brand (defaults to true if undefined)
  const isBrandVisible = brandVisibility ? brandVisibility[decodedBrand] !== false : true;

  // Filter products belonging to this brand using normalized alphanumeric matching
  const cleanBrand = (effectiveBrand || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const brandProducts = (products || []).filter(p => {
    if (!p || !p.brand) return false;
    const pBrand = (p.brand || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return pBrand === cleanBrand || pBrand.includes(cleanBrand) || cleanBrand.includes(pBrand);
  });

  const handleProductClick = (product) => {
    if (setSelectedProduct) setSelectedProduct(product);
    navigate(`/product/${product.id}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 font-sans text-slate-900 min-h-[75vh]">
        
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const returnSection = location.state?.returnSection || (typeof window !== 'undefined' ? sessionStorage.getItem('returnSection') : null) || 'shop-by-brand';
              if (typeof window !== 'undefined' && window.history && window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/', { state: { returnSection } });
              }
            }}
            className="inline-flex items-center gap-2 bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600" />
            <span>← Back</span>
          </button>

          <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-200/60 px-3 py-1 rounded-full">
            Official Brand Hub
          </span>
        </div>

        {/* Brand Banner Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-[10px] sm:text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5" />
                <span>Authorized Hobby Manufacturer</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                {decodedBrand}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
                Explore official {decodedBrand} high-performance RC vehicles, scale model replicas, and precision engineering. All items bench-tested at Mysore Central Hub.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center shrink-0 min-w-[160px]">
              <div className="text-2xl font-black text-emerald-400">{brandProducts.length}</div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">Models Available</div>
            </div>
          </div>
        </div>

        {/* Master Brand Visibility Alert */}
        {!isBrandVisible && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-black">Brand Temporarily Out of Stock</h4>
              <p className="text-[11px] text-amber-800 font-medium">
                This brand is currently paused by store administration. Check back soon for new inventory drops.
              </p>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {isBrandVisible && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {decodedBrand} Vehicle Lineup ({brandProducts.length} Models)
              </h2>
            </div>

            {brandProducts.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center my-6 shadow-xs">
                <div className="text-4xl mb-3">📦</div>
                <h3 className="text-base font-black text-slate-900 mb-1">Stock arriving soon for {decodedBrand}</h3>
                <p className="text-xs text-slate-600 mb-6 max-w-md mx-auto font-medium">
                  New stock drops for {decodedBrand} are currently being bench-tested and prepared at our Mysore Central Hub. Check back soon or explore our full catalog!
                </p>
                <button
                  onClick={() => {
                    navigate('/catalog');
                    window.scrollTo(0, 0);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-3 rounded-xl shadow-xs inline-block cursor-pointer transition-all active:scale-95"
                >
                  Explore Full Store Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {brandProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default BrandPageView;
