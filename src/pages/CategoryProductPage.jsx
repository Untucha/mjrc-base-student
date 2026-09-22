import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CATEGORIES } from '../components/CategoryShowcase';
import { Heart, Coins, Eye, Star, ArrowLeft, ArrowUpDown } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';

export const CategoryProductPage = () => {
  const { slug, catId } = useParams();
  const effectiveCatId = catId || slug || '';
  const navigate = useNavigate();
  const location = useLocation();
  const { products, wishlist, toggleWishlist, setSelectedCategory } = useStore();

  const [sortOption, setSortOption] = useState('default');
  const [selectedScale, setSelectedScale] = useState('ALL');

  // Match Category details from slug
  const targetSlug = effectiveCatId.toLowerCase().trim();
  const categoryObj = CATEGORIES.find(c =>
    c.slug?.toLowerCase() === targetSlug ||
    c.id?.toLowerCase() === targetSlug ||
    c.name?.toLowerCase().replace(/\s+/g, '-') === targetSlug
  ) || {
    name: effectiveCatId ? effectiveCatId.replace(/-/g, ' ') : 'ALL',
    label: effectiveCatId ? `${effectiveCatId.replace(/-/g, ' ').toUpperCase()}` : 'All RC Models',
    description: 'Complete collection of hobby-grade RC vehicles.',
    icon: '🏎️'
  };

  // Immediate effect on route slug change
  useEffect(() => {
    setSelectedScale('ALL');
    setSortOption('default');
    if (categoryObj && categoryObj.name && setSelectedCategory) {
      setSelectedCategory(categoryObj.name);
    }
  }, [effectiveCatId, products]);

  const cleanMatchTag = targetSlug.replace(/-/g, ' ');
  const normCatId = targetSlug.replace(/[\s\-_]+/g, '');

  // Robust, instant filter strictly by category (isolated per category view)
  let categoryProducts = (products || []).filter(p => {
    if (!p || p.hidden === true || p.isVisible === false) return false;
    if (!effectiveCatId || effectiveCatId === 'all') return true;

    const pCat = (p.category || '').toLowerCase().trim();
    const pCatSlug = pCat.replace(/\s+/g, '-');
    const normPCat = pCat.replace(/[\s\-_]+/g, '');
    const targetName = (categoryObj.name || '').toLowerCase();

    // 1. Exact category string or slug matches
    if (
      pCat === targetName ||
      pCatSlug === targetSlug ||
      normPCat === normCatId ||
      pCat === cleanMatchTag
    ) {
      return true;
    }

    // 2. Strict category synonym matches (without scale keyword bleeding)
    if (normCatId.includes('crawler') && normPCat.includes('crawler')) return true;
    if (normCatId.includes('mini') && normPCat.includes('mini')) return true;
    if (normCatId.includes('drift') && normPCat.includes('drift')) return true;
    if (normCatId.includes('boat') && normPCat.includes('boat')) return true;
    if (normCatId.includes('monster') && normPCat.includes('monster')) return true;
    if ((normCatId.includes('diecast') || normCatId.includes('scalemodel')) && (normPCat.includes('diecast') || normPCat.includes('scalemodel') || p.isScaleModel)) return true;
    if (normCatId.includes('machinery') && (normPCat.includes('machinery') || normPCat.includes('construction') || normPCat.includes('heavy'))) return true;

    return false;
  });

  // Filter by scale if selected
  if (selectedScale !== 'ALL') {
    categoryProducts = categoryProducts.filter(p => (p.scale || '').includes(selectedScale));
  }

  // Sort products
  if (sortOption === 'lowToHigh') {
    categoryProducts.sort((a, b) => a.price - b.price);
  } else if (sortOption === 'highToLow') {
    categoryProducts.sort((a, b) => b.price - a.price);
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[70vh] font-sans text-slate-900">
      
      {/* Back Button & Page Header */}
      <div className="mb-6 pb-6 border-b border-slate-200">
        <button
          onClick={() => {
            const returnSection = location.state?.returnSection || (typeof window !== 'undefined' ? sessionStorage.getItem('returnSection') : null) || 'shop-by-category';
            if (typeof window !== 'undefined' && window.history && window.history.length > 2) {
              navigate(-1);
            } else {
              navigate('/', { state: { returnSection } });
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-700 hover:text-emerald-700 mb-3 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>← Back</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{categoryObj.icon}</span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {categoryObj.label}
              </h1>
              <span className="bg-emerald-50 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full border border-emerald-200">
                {categoryProducts.length} Models
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium max-w-2xl">
              {categoryObj.description || 'Bench-tested precision RC models ready for Mysore Central Hub 24H dispatch.'}
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500 shadow-xs"
            >
              <option value="default">Sort by: Featured</option>
              <option value="lowToHigh">Price: Low to High</option>
              <option value="highToLow">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product List Grid */}
      {categoryProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto my-12 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4 text-2xl">
            🏎️
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Machines Found</h3>
          <p className="text-xs text-slate-600 mb-6 font-medium">
            No machines currently bench-tested in this class. Check back soon!
          </p>
          <button
            onClick={() => {
              if (selectedScale !== 'ALL') {
                setSelectedScale('ALL');
              } else {
                navigate('/catalog');
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            {selectedScale !== 'ALL' ? 'Show All Scales' : 'Explore Full Catalog'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Related Categories Navigator */}
      <div className="mt-16 pt-8 border-t border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>⚡ Explore Other Popular RC Categories</span>
          </h3>
          <Link to="/categories" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
            View All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.filter(c => c.slug !== slug).slice(0, 6).map(c => (
            <Link
              key={c.id}
              to={`/category/${c.slug}`}
              onClick={() => setSelectedCategory(c.name)}
              className="bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 p-3 rounded-2xl flex flex-col items-center text-center transition-all group shadow-xs"
            >
              <span className="text-xl mb-1">{c.icon}</span>
              <span className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-700 line-clamp-1">{c.label}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CategoryProductPage;
