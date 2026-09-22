import React from 'react';
import { OrderTracker } from '../components/OrderTracker';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const TrackOrderPage = () => {
  const navigate = useNavigate();

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[70vh]">
      <button
        onClick={() => {
          navigate('/');
          window.scrollTo(0, 0);
        }}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 mb-4 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-emerald-600" />
        <span>← Back to Storefront</span>
      </button>

      <OrderTracker />
    </div>
  );
};

export default TrackOrderPage;
