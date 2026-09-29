import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export const CATEGORIES = [
  {
    id: 'rc-crawlers',
    name: '4x4 Rock Crawlers',
    slug: 'rc-crawlers',
    label: '4x4 Rock Crawlers',
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=300&q=80',
    icon: '🧗',
    description: 'Extreme 4WD trail & rock crawlers with portal axles and scale specs.',
    isVisible: true,
    sortOrder: 1
  },
  {
    id: 'trail-pickups',
    name: 'Scale Trail Pickups',
    slug: 'trail-pickups',
    label: 'Scale Trail Pickups',
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=300&q=80',
    icon: '🛻',
    description: 'Scale 4x4 trail pickups and adventure rigs.',
    isVisible: true,
    sortOrder: 2
  },
  {
    id: 'drift-and-rally',
    name: 'Drift & Speed Rally',
    slug: 'drift-and-rally',
    label: 'Drift & Speed Rally',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=300&q=80',
    icon: '🏎️',
    description: 'Precision drift machines and high-speed rally cars.',
    isVisible: true,
    sortOrder: 3
  },
  {
    id: 'bashers-and-monster',
    name: 'Monster Bashers',
    slug: 'bashers-and-monster',
    label: 'Monster Bashers',
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=300&q=80',
    icon: '⚡',
    description: 'High-speed bashing monster trucks and stunt vehicles.',
    isVisible: true,
    sortOrder: 4
  },
  {
    id: 'heavy-machinery',
    name: 'Scale Heavy Machinery',
    slug: 'heavy-machinery',
    label: 'Scale Heavy Machinery',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=300&q=80',
    icon: '🚜',
    description: 'Full hydraulic excavators, heavy dump trucks & loaders.',
    isVisible: true,
    sortOrder: 5
  },
  {
    id: 'short-course',
    name: 'Short Course Trucks',
    slug: 'short-course',
    label: 'Short Course Trucks',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=300&q=80',
    icon: '🏁',
    description: 'Off-road short course racing trucks and buggies.',
    isVisible: true,
    sortOrder: 6
  }
];

export const getCategoryDisplayName = (cat) => {
  if (!cat) return 'Category';
  const idOrSlug = String(cat.id || cat.slug || '').toLowerCase().trim();
  const rawName = String(cat.name || cat.label || '').toLowerCase().trim();

  if (idOrSlug === 'rc-crawlers' || rawName === 'rc crawlers' || rawName.includes('rock crawler')) return '4x4 Rock Crawlers';
  if (idOrSlug === 'trail-pickups' || rawName === 'trail pickups' || rawName.includes('trail pickup')) return 'Scale Trail Pickups';
  if (idOrSlug === 'drift-and-rally' || rawName === 'drift and rally' || rawName === 'drift & rally' || rawName.includes('drift')) return 'Drift & Speed Rally';
  if (idOrSlug === 'bashers-and-monster' || rawName === 'bashers and monster' || rawName === 'bashers & monster' || rawName.includes('basher') || rawName.includes('monster')) return 'Monster Bashers';
  if (idOrSlug === 'heavy-machinery' || rawName === 'heavy machinery' || rawName.includes('heavy machinery')) return 'Scale Heavy Machinery';
  if (idOrSlug === 'short-course' || rawName === 'short course' || rawName.includes('short course')) return 'Short Course Trucks';

  return cat.name || cat.label || 'Category';
};

export const CategoryShowcase = () => {
  const { categories = CATEGORIES, categoriesList, selectedCategory, setSelectedCategory } = useStore();

  const activeCategories = (categoriesList && categoriesList.length > 0 ? categoriesList : (categories || CATEGORIES || []))
    .filter(Boolean)
    .filter(c => c && typeof c === 'object' && c.isVisible !== false);

  const renderCard = (cat, isMobile = false) => {
    if (!cat || typeof cat !== 'object') return null;
    const catName = typeof cat.name === 'string' ? cat.name : (typeof cat.label === 'string' ? cat.label : (cat.name?.name || cat.label?.label || 'Category'));
    const displayName = getCategoryDisplayName(cat);
    const isSelected = selectedCategory === catName || selectedCategory === displayName;
    const slug = (cat.slug || cat.id || catName || '').toLowerCase().trim().replace(/\s+/g, '-');
    const coverImg = cat.imageUrl || cat.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=300&q=80';

    return (
      <Link
        key={cat.id || slug}
        to={`/category/${slug}`}
        state={{ returnSection: 'shop-by-category' }}
        onClick={() => {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('returnSection', 'shop-by-category');
          }
        }}
        className={`group flex flex-col items-center cursor-pointer select-none active:scale-95 touch-manipulation transition-all duration-300 block ${
          isMobile ? 'w-32 sm:w-36 shrink-0 snap-start' : 'w-full'
        }`}
      >
        {/* Modern Rounded-2xl Card Container with subtle gradient, fine border, shadow & hover lift */}
        <div className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-1.5 ${
          isSelected ? 'ring-4 ring-emerald-500 ring-offset-2 border-emerald-500' : ''
        }`}>
          <div className="w-full h-full rounded-xl overflow-hidden">
            <img
              src={coverImg}
              loading="lazy"
              decoding="async"
              alt={displayName}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 pointer-events-none"
            />
          </div>
        </div>

        {/* High-Contrast Pill Badge Directly Below Container */}
        <span className={`mt-2.5 px-3 py-1 text-white rounded-full text-xs font-bold tracking-wide shadow-sm transition-colors text-center inline-block truncate max-w-full ${
          isSelected
            ? 'bg-emerald-600'
            : 'bg-slate-900 group-hover:bg-emerald-600'
        }`}>
          {displayName}
        </span>
      </Link>
    );
  };

  return (
    <section id="shop-by-category" className="py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Shop by Category
          </h2>
          <p className="text-xs text-slate-500 font-semibold">Explore hobby-grade RC machines by vehicle class</p>
        </div>
        <Link
          to="/categories"
          onClick={() => window.scrollTo(0, 0)}
          className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
        >
          View All →
        </Link>
      </div>

      {/* Mobile Viewport: Horizontal Swipe Carousel (Single Row) */}
      <div className="flex md:hidden flex-row gap-3 overflow-x-auto no-scrollbar scroll-smooth px-1 py-1 snap-x">
        {(activeCategories || []).filter(Boolean).map((cat) => renderCard(cat, true))}
      </div>

      {/* Desktop / Laptop Viewport: Multi-Column Grid */}
      <div className="hidden md:grid md:grid-cols-6 gap-4 sm:gap-5">
        {(activeCategories || []).filter(Boolean).map((cat) => renderCard(cat, false))}
      </div>
    </section>
  );
};
