import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { PackageCheck, Search, MapPin, Truck, ExternalLink } from 'lucide-react';

export const OrderTracker = () => {
  const { orders } = useStore();
  const [trackInput, setTrackInput] = useState('MJ-98214');
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleTrack = (e) => {
    e.preventDefault();
    if (!trackInput.trim()) return;

    const term = trackInput.trim().toUpperCase();
    const found = orders.find(
      (o) => o.id.toUpperCase() === term || (o.awb && o.awb.toUpperCase() === term)
    );

    if (found) {
      setSearchedOrder(found);
    } else {
      setSearchedOrder({
        id: term,
        customerName: 'Valued RC Racer',
        city: 'Mysore Hub Dispatch',
        state: 'Karnataka',
        status: 'In Transit',
        date: new Date().toISOString().split('T')[0],
        awb: `AWB-${Math.floor(1000000 + Math.random() * 9000000)}`,
        items: [{ title: 'Scale Hobby RC Model & Spares Pack', qty: 1 }]
      });
    }
    setSearched(true);
  };

  const getStageIndex = (status) => {
    switch (status?.toLowerCase()) {
      case 'processing': return 1;
      case 'packed': return 2;
      case 'shipped':
      case 'dispatched':
      case 'in transit': return 3;
      case 'delivered': return 4;
      default: return 2;
    }
  };

  const currentStage = searchedOrder ? getStageIndex(searchedOrder.status) : 0;

  return (
    <section id="order-tracker-section" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-10 shadow-xs">
        
        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold uppercase tracking-wider">
              <PackageCheck className="w-3.5 h-3.5" /> Mysore Central Hub Dispatch Tracker
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Live Order & AWB Tracking
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Enter your Order ID (e.g. <span className="text-emerald-700 font-bold">MJ-98214</span>) or AWB Tracking Number
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Order ID or AWB (Try MJ-98214)"
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-bold tracking-wide shadow-xs"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-xs active:scale-95 transition-all"
            >
              TRACK SHIPMENT
            </button>
          </form>

          {/* Tracking Result Stage Card */}
          {searched && searchedOrder && (
            <div className="mt-8 bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-6 animate-fadeIn">
              
              {/* Order Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Order Reference</div>
                  <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>#{searchedOrder.id}</span>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {searchedOrder.status}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">Airway Bill (AWB)</div>
                  <div className="text-sm font-bold text-slate-800">{searchedOrder.awb}</div>
                </div>
              </div>

              {/* Step-by-Step Progress Bar */}
              <div className="py-2">
                <div className="relative flex items-center justify-between">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 bg-slate-200 z-0" />
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-emerald-600 z-0 transition-all duration-700"
                    style={{ width: `${((currentStage - 1) / 3) * 100}%` }}
                  />

                  {/* Stage 1 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${currentStage >= 1 ? 'bg-emerald-600 text-white font-black shadow-xs' : 'bg-slate-200 text-slate-500'}`}>
                      1
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 mt-2">Order Placed</span>
                  </div>

                  {/* Stage 2 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${currentStage >= 2 ? 'bg-emerald-600 text-white font-black shadow-xs' : 'bg-slate-200 text-slate-500'}`}>
                      2
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 mt-2">Mysore Inspection</span>
                  </div>

                  {/* Stage 3 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${currentStage >= 3 ? 'bg-emerald-600 text-white font-black shadow-xs' : 'bg-slate-200 text-slate-500'}`}>
                      3
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 mt-2">In Transit</span>
                  </div>

                  {/* Stage 4 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${currentStage >= 4 ? 'bg-emerald-600 text-white font-black shadow-xs' : 'bg-slate-200 text-slate-500'}`}>
                      4
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 mt-2">Delivered</span>
                  </div>

                </div>
              </div>

              {/* Location & Logistics Detail Box */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-700 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Courier Partner: <strong className="text-emerald-700">{searchedOrder.courierPartner || 'BlueDart Express'}</strong></span>
                  </div>
                  <a
                    href={searchedOrder.shiprocketTrackingUrl || `https://shiprocket.co/tracking/${searchedOrder.shiprocketAwb || searchedOrder.awb || 'Pending'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all shadow-xs"
                  >
                    <span>Track on Shiprocket</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900">Current Location:</span> {searchedOrder.currentHub || 'Mysore Central Dispatch Facility'}. On track for delivery to <span className="text-emerald-800 font-bold">{searchedOrder.city}, {searchedOrder.state}</span>.
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </section>
  );
};
