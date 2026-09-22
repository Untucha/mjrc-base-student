import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { getEffectiveUserCoins } from '../utils/formatters';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Flame,
  Zap,
  Tag,
  Car,
  Gamepad2,
  Gauge,
  Wrench,
  PackageCheck,
  RefreshCw
} from 'lucide-react';

const SEARCH_PLACEHOLDERS = [
  "Search RC crawlers, bashers, parts...",
  "Search for 'Drift cars 4WD'",
  "Search for 'Traxxas LiPo batteries'",
  "Search for 'FMS Spare parts'",
  "Search for 'Scale models diecast'"
];

export const Navbar = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    cartCount,
    wishlist,
    setIsCartOpen,
    setIsAccountOpen,
    setIsOtpOpen,
    user,
    logout,
    syncCatalog,
    showToast
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Rotate search placeholder every 2.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleNavClick = (sectionId, e) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);

    if (!sectionId || sectionId === 'top') {
      if (window.location.pathname !== '/') {
        navigate('/');
      }
      window.scrollTo(0, 0);
      return;
    }

    if (window.location.pathname !== '/') {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('returnSection', sectionId);
      }
      navigate('/', { state: { returnSection: sectionId } });
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate('/categories');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all duration-200">
      
      {/* Top Main Navigation Bar (Compact ~52px Height) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 md:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={(e) => handleNavClick('top', e)}
          className="flex items-center gap-2 md:gap-2.5 group shrink-0"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-emerald-600 text-white font-black text-sm md:text-base flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            MJ
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
              MJ RC <span className="text-emerald-700">BASE</span>
            </span>
            <span className="text-[8px] sm:text-[9px] font-extrabold tracking-widest text-slate-500 uppercase mt-0.5">
              Hobby RC & Scale Store
            </span>
          </div>
        </Link>

        {/* Desktop Quick Nav Links */}
        <nav className="hidden xl:flex items-center space-x-5 text-xs font-bold text-slate-600">
          <button onClick={(e) => handleNavClick('top', e)} className="hover:text-emerald-700 transition-colors font-bold text-xs cursor-pointer">
            Home
          </button>
          <button onClick={(e) => handleNavClick('shop-by-category', e)} className="hover:text-emerald-700 transition-colors font-bold text-xs cursor-pointer">
            Shop Categories
          </button>
          <button onClick={(e) => handleNavClick('shop-by-brand', e)} className="hover:text-emerald-700 transition-colors font-bold text-xs cursor-pointer">
            Shop by Brands
          </button>
          <button onClick={(e) => handleNavClick('latest-rc-cars', e)} className="hover:text-emerald-700 transition-colors font-bold text-xs cursor-pointer">
            Latest RC Cars
          </button>
          <NavLink to="/track" className={({ isActive }) => isActive ? "text-emerald-700 font-extrabold flex items-center gap-1" : "hover:text-emerald-700 flex items-center gap-1 transition-colors"}>
            <PackageCheck className="w-3.5 h-3.5 text-emerald-700" /> Track Order
          </NavLink>
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Sleek Compact Search Input directly before Wishlist */}
          <div className="relative flex items-center">
            {/* Desktop / Laptop Input Pill */}
            <div className="hidden sm:block relative w-48 lg:w-64 focus-within:w-80 transition-all duration-200">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                className="w-full bg-slate-100/80 border border-slate-200/80 rounded-full py-1.5 pl-9 pr-7 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile View Search Icon Trigger */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="sm:hidden p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Wishlist Icon */}
          <Link
            to="/wishlist"
            className={`p-1.5 md:p-2 rounded-xl relative flex items-center justify-center transition-colors ${
              location.pathname === '/wishlist'
                ? 'bg-rose-50 text-rose-600'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Wishlist"
          >
            <Heart className={`w-4 h-4 md:w-4.5 md:h-4.5 ${location.pathname === '/wishlist' ? 'fill-rose-500 text-rose-500' : ''}`} />
            {wishlist && wishlist.length > 0 && (
              <span className="absolute top-0 right-0 bg-rose-500 text-white font-black text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* User Account Avatar Button */}
          <button
            onClick={() => {
              if (!user) {
                setIsOtpOpen(true);
              } else {
                setIsAccountOpen(true);
              }
            }}
            className="flex items-center gap-1.5 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/80 px-2 py-1.5 rounded-full transition-all text-xs font-bold text-slate-800"
            title={user ? "Account & Coins" : "Login to Account"}
          >
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
              {user?.phone ? user.phone.slice(-2) : <User className="w-3 h-3" />}
            </div>
            <span className="hidden md:inline-block font-extrabold text-emerald-700 text-xs pr-1">
              🪙 {getEffectiveUserCoins(user || {}).total}
            </span>
          </button>

          {/* Emerald Rounded Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-2.5 py-1.5 md:px-3.5 md:py-1.5 flex items-center gap-1.5 text-xs font-extrabold shadow-2xs active:scale-95 transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline">Cart</span>
            <span className="bg-white text-emerald-800 font-black text-[10px] md:text-xs px-1.5 py-0.5 rounded-full">
              {cartCount}
            </span>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile Expandable Search Input Row */}
      {isSearchOpen && (
        <div className="sm:hidden px-3 pb-2 pt-1 border-t border-slate-100 animate-fadeIn bg-slate-50/90">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                handleSearchSubmit(e);
                if (e.key === 'Enter') setIsSearchOpen(false);
              }}
              className="w-full bg-white border border-slate-200 rounded-full py-1.5 pl-9 pr-8 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
            <button
              onClick={() => setIsSearchOpen(false)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Slide-Down Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white/95 border-t border-slate-200 p-4 space-y-2 shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={(e) => handleNavClick('top', e)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-slate-800 font-bold hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              🏠 Home
            </button>
            <button
              onClick={(e) => handleNavClick('shop-by-category', e)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-slate-800 font-bold hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              📦 Shop Categories
            </button>
            <button
              onClick={(e) => handleNavClick('shop-by-brand', e)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-slate-800 font-bold hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              🏎️ Shop by Brands
            </button>
            <button
              onClick={(e) => handleNavClick('latest-rc-cars', e)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-slate-800 font-bold hover:bg-emerald-50 hover:text-emerald-800 transition-colors col-span-2"
            >
              ⚡ Latest RC Cars
            </button>
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-left text-emerald-800 font-extrabold col-span-2 flex items-center justify-between hover:bg-emerald-100 transition-colors"
            >
              <span>📦 Track Shipment Order</span>
              <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-md">Mysore Hub</span>
            </Link>
            {user && (
              <button
                onClick={() => {
                  if (logout) logout();
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-left text-rose-700 font-bold col-span-2 flex items-center justify-between hover:bg-rose-100 transition-colors"
              >
                <span>🚪 Log Out of Account (+91 {user.phone})</span>
              </button>
            )}
          </div>
        </div>
      )}

    </header>
  );
};
