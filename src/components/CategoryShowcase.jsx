import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export const CATEGORIES = [
  {
    id: 'cat-crawler',
    name: 'RC Crawlers',
    slug: 'rc-crawlers',
    label: 'RC Crawlers',
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=300&q=80',
    icon: '🧗',
    description: 'Extreme 4WD trail & rock crawlers with portal axles and scale specs.'
  },
  {
    id: 'cat-trail-pickups',
    name: 'Trail Pickups',
    slug: 'trail-pickups',
    label: 'Trail Pickups',
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=300&q=80',
    icon: '🛻',
    description: 'Scale 4x4 trail pickups and adventure rigs.'
  },
  {
    id: 'cat-drift-rally',
    name: 'Drift and Rally',
    slug: 'drift-and-rally',
    label: 'Drift and Rally',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=300&q=80',
    icon: '🏎️',
    description: 'Precision drift machines and high-speed rally cars.'
  },
  {
    id: 'cat-bashers-monster',
    name: 'Bashers and Monster',
    slug: 'bashers-and-monster',
    label: 'Bashers and Monster',
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=300&q=80',
    icon: '⚡',
    description: 'High-speed bashing monster trucks and stunt vehicles.'
  },
  {
    id: 'cat-heavy-machinery',
    name: 'Heavy Machinery',
    slug: 'heavy-machinery',
    label: 'Heavy Machinery',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=300&q=80',
    icon: '🚜',
    description: 'Full hydraulic excavators, heavy dump trucks & loaders.'
  },
  {
    id: 'cat-short-course',
    name: 'Short course',
    slug: 'short-course',
    label: 'Short course',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=300&q=80',
    icon: '🏁',
    description: 'Off-road short course racing trucks and buggies.'
  }
];

export const CategoryShowcase = () => {
  const { categories = CATEGORIES, categoriesList, selectedCategory, setSelectedCategory } = useStore();

  const activeCategories = (categoriesList && categoriesList.length > 0 ? categoriesList : (categories || CATEGORIES || []))
    .filter(Boolean)
    .filter(c => c && typeof c === 'object' && c.isVisible !== false);

  const renderCard = (cat, isMobile = false) => {
    if (!cat || typeof cat !== 'object') return null;
    const catName = typeof cat.name === 'string' ? cat.name : (typeof cat.label === 'string' ? cat.label : (cat.name?.name || cat.label?.label || 'Category'));
    const isSelected = selectedCategory === catName;
    const slug = (cat.slug || cat.id || catName || '').toLowerCase().trim().replace(/\s+/g, '-');
    const coverImg = cat.imageUrl || cat.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=300&q=80';

    return (
      <Link
        key={cat.id || slug}
        to={`/category/${slug}`}
        state={{ returnSection: 'shop-by-category' }}
        onClick={() => {
          if (setSelectedCategory && catName) setSelectedCategory(catName);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('returnSection', 'shop-by-category');
          }
        }}
        className={`relative w-full aspect-square rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 block select-none active:scale-95 touch-manipulation ${
          isMobile ? 'w-32 sm:w-36 shrink-0 snap-start' : 'w-full'
        } ${
          isSelected
            ? 'ring-4 ring-emerald-500 ring-offset-2'
            : ''
        }`}
      >
        {/* Full Bleed Edge-to-Edge Image */}
        <img
          src={coverImg}
          loading="lazy"
          decoding="async"
          alt={catName}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 pointer-events-none"
        />

        {/* Sleek Bottom Dark Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 pt-8 sm:pt-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end pointer-events-none">
          <h3 className="text-white font-extrabold text-xs sm:text-base tracking-wide drop-shadow-md text-center sm:text-left leading-tight">
            {catName}
          </h3>
        </div>
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
      <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {(activeCategories || []).filter(Boolean).map((cat) => renderCard(cat, false))}
      </div>
    </section>
  );
};
