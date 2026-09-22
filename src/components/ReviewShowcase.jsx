import React from 'react';
import { useStore } from '../context/StoreContext';
import { Star, CheckCircle2, ShieldCheck, Award } from 'lucide-react';

export const ReviewShowcase = () => {
  const { reviewsList } = useStore();

  // Filter ONLY published reviews strictly from Firestore
  const displayReviews = (reviewsList || []).filter(r => r.status === 'published');
  const totalReviewsCount = displayReviews.length;

  const averageRating = totalReviewsCount > 0
    ? (displayReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / totalReviewsCount).toFixed(1)
    : '0.0';

  return (
    <section className="py-4 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto my-3 sm:my-8">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
        <div className="space-y-1.5 sm:space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] sm:text-xs font-black px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shadow-2xs">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>VERIFIED HOBBYIST TESTIMONIALS</span>
          </div>

          <h2 className="text-xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {totalReviewsCount > 0 ? `Customer Reviews (${totalReviewsCount})` : 'Customer Reviews'}
          </h2>

          <p className="text-[11px] sm:text-sm text-slate-600 font-semibold">
            {totalReviewsCount > 0
              ? 'Post-delivery WhatsApp ratings auto-synced from Mysore Hub dispatches'
              : 'No reviews yet. Be the first to share your experience with MJ RC BASE!'}
          </p>
        </div>

        {/* Aggregate Stat Pill */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 shadow-xs shrink-0 self-start md:self-auto">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-xs">
            {averageRating}
          </div>
          <div>
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                    totalReviewsCount > 0 && i < Math.round(Number(averageRating))
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-600 font-extrabold mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> {totalReviewsCount} {totalReviewsCount === 1 ? 'Review' : 'Reviews'}
            </div>
          </div>
        </div>
      </div>

      {totalReviewsCount === 0 ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center text-slate-500 font-bold space-y-2">
          <Award className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-black text-slate-700">0 Reviews</p>
          <p className="text-xs text-slate-400 font-medium">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        /* Swipeable Single-Card Carousel on Mobile / Grid on Desktop */
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5 overflow-x-auto no-scrollbar snap-x pb-2">
          {displayReviews.map((rev) => {
            const initials = (rev.customerName || rev.name)
              ? (rev.customerName || rev.name).split(' ').map(n => n[0]).join('').slice(0, 2)
              : 'RC';

            return (
              <div
                key={rev.id || Math.random()}
                className="shrink-0 w-[88vw] max-w-[300px] md:w-auto snap-center bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4 shadow-xs hover:shadow-md transition-all duration-300 border-t-4 border-t-emerald-600 flex flex-col justify-between"
              >
                <div className="space-y-2.5 sm:space-y-3">
                  {/* Top Row: Stars & Verified Buyer */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex text-amber-500">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400" />
                      ))}
                    </div>

                    <span className="bg-emerald-50 text-emerald-800 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 shrink-0 whitespace-nowrap">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> Verified Buyer
                    </span>
                  </div>

                  {/* Review Body */}
                  <p className="text-[11px] sm:text-xs text-slate-800 font-medium leading-relaxed italic">
                    "{rev.comment || rev.text}"
                  </p>
                </div>

                {/* Bottom Row */}
                <div className="pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 border border-slate-200 text-emerald-800 font-black text-[10px] sm:text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] sm:text-xs font-black text-slate-900 truncate">
                        {rev.customerName || rev.name}
                      </div>
                      <div className="text-[9px] sm:text-[10px] font-semibold text-slate-500 truncate">
                        {rev.city || 'Verified Buyer'}
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] sm:text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 truncate max-w-[90px] sm:max-w-[100px]">
                    {rev.carModel || rev.model || 'Scale RC Machine'}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </section>
  );
};
