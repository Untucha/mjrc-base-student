import React from 'react';
import { useStore } from '../context/StoreContext';
import { SlidersHorizontal } from 'lucide-react';

const SCALES = [
  { label: 'All Scales', value: 'ALL' },
  { label: '1/8 Scale', value: '1/8 Scale Toy' },
  { label: '1/10 Scale', value: '1/10 Scale Toy' },
  { label: '1/14 Scale', value: '1/14 Scale Toy' },
  { label: '1/16 Scale', value: '1/16 Scale Toy' },
  { label: '1/24 Micro', value: '1/24 Micro Scale' },
];

export const ScaleFilter = () => {
  const { selectedScale, setSelectedScale } = useStore();

  return (
    <div className="py-3 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          <span>Scale Filter:</span>
        </div>

        {/* Horizontal scroll strip on mobile, centered/wrapped pills on desktop */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto">
          {SCALES.map((scale) => {
            const isActive = selectedScale === scale.value;
            return (
              <button
                key={scale.value}
                onClick={() => setSelectedScale(scale.value)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400'
                    : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-soft-card'
                }`}
              >
                {isActive ? (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
                <span>{scale.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
