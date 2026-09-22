import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Heart, Star, Eye, Coins } from 'lucide-react';

export const ProductCard = ({ product, onMoveToCart, showMoveToCart = false }) => {
  const navigate = useNavigate();
  const { wishlist, toggleWishlist } = useStore();

  if (!product) return null;

  const productId = product.id;
  const isWishlisted = (wishlist || []).some(item => (typeof item === 'object' && item !== null ? item.id : item) === productId);

  const handleClick = () => {
    navigate(`/product/${productId}`);
  };

  const renderTopLeftBadge = () => {
    const rawBadge = (product.badge || '').trim();
    if (!rawBadge || rawBadge === 'No Badge') return null;

    const norm = rawBadge.toLowerCase();
    let badgeStyle = 'bg-slate-900 text-white border-slate-700';

    if (norm.includes('trending')) {
      badgeStyle = 'bg-orange-500 text-white border-orange-400 shadow-xs';
    } else if (norm.includes('hot deal') || norm.includes('hotdeal') || norm.includes('hot')) {
      badgeStyle = 'bg-red-600 text-white border-red-500 shadow-xs animate-pulse';
    } else if (norm.includes('limited')) {
      badgeStyle = 'bg-purple-600 text-white border-purple-500 shadow-xs';
    } else if (norm.includes('collector')) {
      badgeStyle = 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-xs';
    } else if (norm.includes('new drop') || norm.includes('newdrop') || norm.includes('new')) {
      badgeStyle = 'bg-emerald-600 text-white border-emerald-500 shadow-xs';
    }

    return (
      <div className={`absolute top-2.5 left-2.5 z-10 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${badgeStyle}`}>
        {rawBadge}
      </div>
    );
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white border border-slate-200/80 hover:border-emerald-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-xs hover:shadow-md flex flex-col justify-between cursor-pointer select-none"
    >
      {/* Top Edge-to-Edge Image Viewport */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-t-2xl bg-neutral-100 p-0">
        {/* Synchronized BADGE TAG HIGHLIGHT Badge */}
        {renderTopLeftBadge()}

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 z-10 p-1.5 sm:p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
            isWishlisted
              ? 'bg-rose-50 border-rose-200 text-rose-500 scale-105'
              : 'bg-white/90 border-slate-200 text-slate-400 hover:text-rose-500 hover:scale-110'
          }`}
          title="Toggle Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-rose-500 stroke-rose-500' : 'stroke-slate-400 fill-transparent'}`} />
        </button>

        {/* Full-Bleed Image */}
        <img
          src={product.image || product.imageUrl}
          loading="lazy"
          decoding="async"
          alt={product.title || product.name}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Scale Badge (Bottom-Left) */}
        {product.scale && (
          <div className="absolute bottom-2.5 left-2.5 z-10 bg-white/90 backdrop-blur-sm border border-slate-200 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
            {typeof product.scale === 'string' ? product.scale : (product.scale?.name || String(product.scale))}
          </div>
        )}
      </div>

      {/* Card Details Body */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Brand & Rating Row */}
          <div className="flex items-center justify-between text-xs mb-1 font-semibold">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate max-w-[65%]">
              {typeof product.brand === 'string' ? product.brand : (product.brand?.name || product.brand?.label || '')}
            </span>
            <span className="flex items-center gap-0.5 text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" /> {typeof product.rating === 'number' || typeof product.rating === 'string' ? product.rating : 4.9}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 sm:line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
            {typeof product.title === 'string' ? product.title : (typeof product.name === 'string' ? product.name : (product.title?.title || product.name?.name || 'RC Vehicle'))}
          </h3>

          {/* Coins & Special Exempt Badge */}
          {product.allowCoinRedemption === false ? (
            <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-1.5 sm:px-2 py-0.5 rounded-md">
              <span>Special Item - Coin Discount Exempt</span>
            </div>
          ) : (
            <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 sm:px-2 py-0.5 rounded-md">
              <Coins className="w-3 h-3 text-amber-500" />
              <span>Earn {typeof (product.coinsRewardedOnPurchase || product.rcCoins) === 'number' ? (product.coinsRewardedOnPurchase || product.rcCoins) : 100} Coins</span>
            </div>
          )}
        </div>

        {/* Price & Action Button */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-sm sm:text-base font-black text-emerald-700 flex items-baseline gap-1.5">
              <span>₹{product.price?.toLocaleString('en-IN')}</span>
              {product.mrp && (
                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 line-through">
                  ₹{product.mrp?.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          {showMoveToCart ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onMoveToCart) onMoveToCart(product);
              }}
              className="w-full h-7 sm:h-9 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <span>Move to Cart</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="w-full h-7 sm:h-9 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Details</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
