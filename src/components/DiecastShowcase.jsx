import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ShoppingCart } from 'lucide-react';

const DIECAST_MODELS = [];

export const DiecastShowcase = () => {
  return null;
};

  const liveList = (allProducts && allProducts.length > 0) ? allProducts : (products || []);
  const liveScaleModels = liveList.filter(p => {
    if (p.hidden === true || p.isVisible === false) return false;
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
      title.includes('mustang') ||
      title.includes('aston martin')
    );
  });

  let displayModels = [...liveScaleModels];
  if (displayModels.length < 3) {
    const existingIds = new Set(displayModels.map(m => (m.id || '').toLowerCase()));
    const existingTitles = new Set(displayModels.map(m => (m.title || m.name || '').toLowerCase()));

    for (const fallback of DIECAST_MODELS) {
      const fId = (fallback.id || '').toLowerCase();
      const fTitle = (fallback.title || '').toLowerCase();
      if (!existingIds.has(fId) && !existingTitles.has(fTitle)) {
        displayModels.push(fallback);
        existingIds.add(fId);
      }
      if (displayModels.length >= 3) break;
    }
  }

  const handleCardClick = (model) => {
    if (setSelectedProduct) setSelectedProduct(model);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('returnSection', 'scale-models');
    }
    navigate(`/product/${model.id}`, { state: { returnSection: 'scale-models' } });
  };

  const handleAddToCart = (e, model) => {
    e.stopPropagation();
    addToCart({
      id: model.id,
      title: model.title,
      price: model.price,
      mrp: model.mrp,
      image: model.image,
      category: 'Scale Models'
    });
    setIsCartOpen(true);
  };

  return (
    <section className="py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Scale Models
          </h2>
          <p className="text-xs text-slate-600 font-semibold">Packaged diecast collector series & official replicas</p>
        </div>
      </div>

      {/* 2-Column Compact Grid on Mobile / Flex Carousel on Desktop */}
      <div className="grid grid-cols-2 gap-2.5 md:flex md:gap-4 md:overflow-x-auto no-scrollbar pb-2">
        {displayModels.map((model) => (
          <div
            key={model.id}
            onClick={() => handleCardClick(model)}
            className="w-full md:min-w-[240px] md:max-w-[260px] bg-white rounded-2xl border border-slate-200/80 p-2.5 sm:p-3 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all group cursor-pointer"
          >
            <div>
              <div className="relative w-full aspect-square sm:h-36 rounded-xl overflow-hidden mb-2 sm:mb-3 bg-slate-50 border border-slate-200 p-1.5 flex items-center justify-center">
                <img
                  src={model.image}
                  loading="lazy"
                  decoding="async"
                  alt={model.title}
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                />
                <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md uppercase shadow-xs">
                  {model.discount}
                </span>
                <span className="absolute top-1.5 right-1.5 bg-white/90 text-emerald-800 font-extrabold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md border border-slate-200 shadow-xs">
                  {model.scale}
                </span>
              </div>

              <h3 className="text-[11px] sm:text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug hover:text-emerald-700 transition-colors">
                {model.title}
              </h3>
            </div>

            <div className="mt-2 sm:mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-black text-emerald-700">₹{model.price}</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 line-through ml-1">₹{model.mrp}</span>
              </div>

              <button
                onClick={(e) => handleAddToCart(e, model)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 sm:p-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 shadow-xs active:scale-95"
                title="Add to Cart"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
