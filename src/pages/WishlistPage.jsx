import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Heart, ArrowLeft, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';

export const WishlistPage = () => {
  const navigate = useNavigate();
  const { wishlist, allProducts, products, toggleWishlist, addToCart, setIsCartOpen } = useStore();

  const liveProducts = (allProducts && allProducts.length > 0) ? allProducts : (products || []);

  // Map wishlist entries (could be string IDs or product objects) to full product objects
  const savedItems = (wishlist || []).map(item => {
    const itemId = typeof item === 'object' && item !== null ? item.id : item;
    return liveProducts.find(p => String(p.id) === String(itemId)) || (typeof item === 'object' ? item : null);
  }).filter(Boolean);

  const handleMoveToCart = (product) => {
    addToCart(product);
    toggleWishlist(product.id || product);
    setIsCartOpen(true);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[75vh] font-sans text-slate-900">
      
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate-200">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-700 hover:text-emerald-700 mb-3 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>← Back</span>
        </button>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                My Saved RC Machines <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
              </h1>
              <span className="bg-rose-50 text-rose-700 font-extrabold text-xs px-3 py-1 rounded-full border border-rose-200 shrink-0">
                {savedItems.length} Saved
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              Your wishlist is synced across all your devices and Firestore account.
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid / Empty State */}
      {savedItems.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto my-8 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-rose-400" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-1">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-600 mb-6 font-medium leading-relaxed">
            You haven't saved any RC bashers, scale crawlers, or drift cars yet. Explore our bench-tested catalog!
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Explore RC Catalog</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {savedItems.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showMoveToCart={true}
              onMoveToCart={handleMoveToCart}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default WishlistPage;
