import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../components/CategoryShowcase';
import { ArrowRight, Sparkles, ArrowLeft } from 'lucide-react';

export const AllCategoriesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[70vh] text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <button
            onClick={() => {
              navigate('/');
              window.scrollTo(0, 0);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> ← Back to Storefront
          </button>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            All RC Hobby Collections <Sparkles className="w-6 h-6 text-emerald-600" />
          </h1>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            Explore all 8 dedicated categories of 1/8, 1/10, 1/14, and micro scale hobby-grade RC vehicles.
          </p>
        </div>
      </div>

      {/* Grid of 8 Detailed Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className="group relative bg-white border border-slate-200/80 hover:border-emerald-500/50 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative h-48 bg-slate-50 overflow-hidden">
              <img
                src={cat.image}
                loading="lazy"
                decoding="async"
                alt={cat.label}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
              <span className="absolute top-3 right-3 text-sm bg-white/90 text-slate-900 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200 font-bold shadow-xs">
                {cat.icon} {cat.count}
              </span>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {cat.label}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  {cat.description}
                </p>
              </div>

              <Link
                to={`/category/${cat.slug}`}
                onClick={() => window.scrollTo(0, 0)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 touch-manipulation"
              >
                <span>Browse {cat.label}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllCategoriesPage;
