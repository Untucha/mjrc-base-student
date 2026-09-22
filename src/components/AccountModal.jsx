import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getEffectiveUserCoins } from '../utils/formatters';
import {
  X,
  User,
  Coins,
  PackageCheck,
  MapPin,
  LogOut,
  Sparkles,
  Award,
  Save,
  Truck,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const AccountModal = () => {
  const {
    isAccountOpen,
    setIsAccountOpen,
    setIsOtpOpen,
    user,
    setUser,
    orders,
    showToast,
    logout,
    saveUserAddress
  } = useStore();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'address' | 'terms'
  const [expandedPolicy, setExpandedPolicy] = useState(0); // Index of open policy card (0-3) or null
  const [userAddress, setUserAddress] = useState(user?.address || '142, Vijayanagar 2nd Stage, Mysore, Karnataka 570017');

  if (!isAccountOpen) return null;

  // Filter orders strictly for current user's mobile number
  const activePhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
  const userOrders = (user && activePhone)
    ? (orders || []).filter(o => {
        const orderPhone = (o.mobile || o.phone || o.customerPhone || '').replace(/\D/g, '').slice(-10);
        return orderPhone === activePhone;
      })
    : [];
  const displayOrders = user ? userOrders : [];

  const userCoinStats = getEffectiveUserCoins(user || {});
  const coinsBalance = userCoinStats.total;
  const storeCreditValue = Math.floor(coinsBalance / 5); // 500 coins = ₹100 credit

  const getUserInitials = (userData) => {
    if (!userData) return 'RC';
    const nameStr = (userData.name || userData.firstName || '').trim();
    if (!nameStr) return 'RC';
    const parts = nameStr.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (saveUserAddress) {
      await saveUserAddress({ address: userAddress });
    } else {
      setUser(prev => ({ ...prev, address: userAddress }));
      showToast('Saved delivery address updated!');
    }
  };

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      setUser(null);
      setIsAccountOpen(false);
      showToast('Logged out of account session.');
    }
  };

  const getStageIndex = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 4;
    if (s.includes('transit') || s.includes('shipped') || s.includes('out for delivery')) return 3;
    if (s.includes('dispatched') || s.includes('mysore hub')) return 3;
    if (s.includes('packed') || s.includes('bench-tested')) return 2;
    if (s.includes('order placed') || s.includes('processing')) return 1;
    return 2;
  };

  const togglePolicy = (index) => {
    setExpandedPolicy(prev => (prev === index ? null : index));
  };

  const policyList = [
    {
      emoji: '🛡️',
      title: 'Pre-Dispatch Quality Control & Testing',
      badge: '100% Bench-Tested',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
      description: 'Every scale RC car, boat, monster truck, and component undergoes thorough bench-testing, battery voltage verification, and radio receiver pairing at our Mysore Central Hub before sealed dispatch.',
      bullets: [
        '7-Day Replacement Warranty against manufacturing defects.',
        'Full functional testing of transmitter, ESC, and motor prior to packaging.'
      ]
    },
    {
      emoji: '🚚',
      title: 'Shipping & Express Delivery Timelines',
      badge: '24–48 Hours Dispatch',
      badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
      description: 'All orders are dispatched directly from our Mysore Central Facility within 24–48 business hours via premier logistics partners (BlueDart, Delhivery, Express Air).',
      bullets: [
        'Automated AWB tracking provided via WhatsApp & SMS upon dispatch.',
        'Estimated delivery: 2–4 business days for South India; 4–6 days for rest of India.'
      ]
    },
    {
      emoji: '🪙',
      title: 'RC Coins & Loyalty Program Terms',
      badge: '500 Coins = ₹100 Credit',
      badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
      description: 'RC Coins are credited directly to your digital wallet with every verified purchase and signup, valid for instant checkout discounts.',
      bullets: [
        '500 RC Coins = ₹100 Store Credit (auto-applied at checkout).',
        'Welcome bonus coins valid for 7 days; purchase loyalty coins are permanent.'
      ]
    },
    {
      emoji: '📦',
      title: 'Cancellation & Damage Replacement',
      badge: '100% Insured Transit',
      badgeColor: 'text-rose-400 bg-rose-950/60 border-rose-800/60',
      description: 'Your package is 100% insured against damage during transit from Mysore to your door.',
      bullets: [
        'Unboxing Video Mandatory: Please record an un-edited unboxing video clip showing the shipping label and package opening.',
        'Direct 1:1 WhatsApp resolution support for transit issues within 48 hours.'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 animate-fadeIn font-sans">
      
      {/* Pit-Stop Racing UI Shell */}
      <div className="relative w-full max-h-[88vh] bg-zinc-950 border border-zinc-800/90 rounded-t-3xl md:rounded-3xl md:max-w-2xl md:my-auto shadow-2xl shadow-black overflow-hidden flex flex-col text-zinc-100 font-sans">
        
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto my-2 md:hidden shrink-0" />

        {/* Profile Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-800/90 bg-zinc-900/95 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Dynamic Metallic Racing Avatar Badge */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border-2 border-amber-500/60 text-amber-400 flex items-center justify-center font-black text-xs sm:text-sm shadow-md shrink-0 font-mono tracking-wider">
              {getUserInitials(user)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-[140px] sm:max-w-xs">
                  {user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') || 'RC Racer'}
                </h3>
                <span className="bg-amber-500/10 text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 shrink-0 uppercase tracking-wide">
                  <Award className="w-2.5 h-2.5 text-amber-400" /> MYSORE VIP RACER
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                {user?.phone ? (user.phone.startsWith('+91') ? user.phone : `+91 ${user.phone}`) : (user?.cleanPhone ? `+91 ${user.cleanPhone}` : '')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 px-2.5 py-1 rounded-xl transition-all hidden sm:flex items-center gap-1 cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" /> <span>Log Out</span>
            </button>

            <button
              onClick={() => setIsAccountOpen(false)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Compact Glassmorphism Wallet Bar */}
        <div className="mx-4 sm:mx-6 my-2.5 px-3.5 py-2 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800/90 flex items-center justify-between gap-2 shadow-inner shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            </div>
            <div className="leading-tight">
              <span className="text-xs sm:text-sm font-black text-white">
                {coinsBalance.toLocaleString('en-IN')} <span className="text-[11px] font-bold text-amber-400">🪙 RC Coins</span>
              </span>
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] font-black text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-full shrink-0">
            ₹{storeCreditValue} Credit • Auto Applied
          </span>
        </div>

        {/* Segmented 3-Column Equal Tab Navigation Control */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800/90 mx-4 sm:mx-6 shrink-0">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 text-[11px] sm:text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>📦 Orders ({displayOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('address')}
            className={`py-2 px-1 text-[11px] sm:text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
              activeTab === 'address'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>📍 Address</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`py-2 px-1 text-[11px] sm:text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
              activeTab === 'terms'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0 text-sky-400" />
            <span>📜 Terms</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto max-h-[75vh] p-4 sm:p-5 space-y-4 bg-zinc-950 pb-6">
          
          {/* TAB 1: MY ORDERS & EMBEDDED SHIPROCKET TRACKING */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {!user ? (
                <div className="text-center py-10 space-y-3 bg-zinc-900/60 rounded-2xl border border-zinc-800 p-5">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto text-xl border border-emerald-500/20">
                    🔒
                  </div>
                  <h4 className="text-sm font-black text-white">Please Login to View Orders</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto font-medium">
                    Log in with your mobile number to view order history and live tracking.
                  </p>
                  <button
                    onClick={() => {
                      setIsAccountOpen(false);
                      if (setIsOtpOpen) setIsOtpOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    Login with Phone Number
                  </button>
                </div>
              ) : displayOrders.length === 0 ? (
                <div className="text-center py-10 space-y-3 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto text-xl">
                    📦
                  </div>
                  <h4 className="text-sm font-bold text-white">No Past Orders Found</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Place your first scale RC car order to unlock live tracking.
                  </p>
                </div>
              ) : (
                displayOrders.map((order) => {
                  const currentStage = getStageIndex(order.status);

                  return (
                    <div
                      key={order.id}
                      className="bg-zinc-900 border border-zinc-800/90 rounded-2xl p-3.5 space-y-3 shadow-md"
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-black text-white">#{order.id}</span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                              {order.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {order.date} • {order.paymentMethod || 'UPI Payment'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-zinc-400 font-semibold">Total</div>
                          <div className="text-xs sm:text-sm font-black text-white">
                            ₹{order.total?.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      {/* Items Summary */}
                      <div className="space-y-1.5">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 bg-zinc-950 p-2 rounded-xl border border-zinc-800/80 text-xs">
                            <img
                              src={item.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=200&q=80'}
                              loading="lazy"
                              decoding="async"
                              alt={item.title}
                              className="w-9 h-9 object-cover rounded-lg border border-zinc-800 shrink-0 bg-zinc-900"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-extrabold text-zinc-100 text-[11px] truncate">{item.title}</div>
                              <div className="text-[10px] text-zinc-400">Qty: {item.qty}</div>
                            </div>
                            <div className="font-bold text-white text-[11px]">₹{item.price?.toLocaleString('en-IN')}</div>
                          </div>
                        ))}
                      </div>

                      {/* Embedded Shiprocket Compact Dispatch Tracker */}
                      <div className="pt-2 border-t border-zinc-800/80">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between flex-wrap gap-1">
                          <span className="flex items-center gap-1 font-bold text-zinc-200">
                            <Truck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{order.courierPartner || 'BlueDart Express'}</span>
                          </span>
                          <a
                            href={order.shiprocketTrackingUrl || `https://shiprocket.co/tracking/${order.shiprocketAwb || order.awb || 'Pending'}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 font-black px-2 py-0.5 rounded-md text-[9px]"
                          >
                            <span>AWB: {order.shiprocketAwb || order.awb || 'Pending'}</span>
                            <span>↗</span>
                          </a>
                        </div>

                        {/* Mobile Stepper Timeline */}
                        <div className="relative flex items-center justify-between px-2 pt-2 pb-1">
                          <div className="absolute left-5 right-5 top-4 h-0.5 bg-zinc-800 z-0" />
                          <div
                            className="absolute left-5 top-4 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
                            style={{ width: `${((currentStage - 1) / 3) * 88}%` }}
                          />

                          {/* Stage 1 */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${currentStage >= 1 ? 'bg-emerald-500 text-black shadow-sm' : 'bg-zinc-800 text-zinc-500'}`}>
                              1
                            </div>
                            <span className="text-[9px] font-bold text-zinc-300 mt-1">Confirmed</span>
                          </div>

                          {/* Stage 2 */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${currentStage >= 2 ? 'bg-emerald-500 text-black shadow-sm' : 'bg-zinc-800 text-zinc-500'}`}>
                              2
                            </div>
                            <span className="text-[9px] font-bold text-zinc-300 mt-1">Mysore Hub</span>
                          </div>

                          {/* Stage 3 */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${currentStage >= 3 ? 'bg-emerald-500 text-black shadow-sm' : 'bg-zinc-800 text-zinc-500'}`}>
                              3
                            </div>
                            <span className="text-[9px] font-bold text-emerald-400 mt-1">In Transit</span>
                          </div>

                          {/* Stage 4 */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${currentStage >= 4 ? 'bg-emerald-500 text-black shadow-sm' : 'bg-zinc-800 text-zinc-500'}`}>
                              4
                            </div>
                            <span className="text-[9px] font-bold text-zinc-300 mt-1">Delivered</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: SAVED DELIVERY ADDRESS */}
          {activeTab === 'address' && (
            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3 shadow-md">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" /> Default Shipping Address
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Full Street Address & Pincode</label>
                  <textarea
                    rows={3}
                    required
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <Save className="w-4 h-4" /> Save Updated Delivery Address
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: TERMS & POLICIES (COMPACT ACCORDION CARDS) */}
          {activeTab === 'terms' && (
            <div className="space-y-2.5">
              {/* Header intro */}
              <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">MJ RC BASE Mysore Guarantee</h4>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Tap any policy card below to expand details.
                  </p>
                </div>
              </div>

              {/* Policy Accordions */}
              {policyList.map((policy, idx) => {
                const isOpen = expandedPolicy === idx;

                return (
                  <div
                    key={idx}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => togglePolicy(idx)}
                      className="w-full p-3 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{policy.emoji}</span>
                        <div className="min-w-0">
                          <h5 className="text-xs font-black text-white truncate">{policy.title}</h5>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border inline-block mt-0.5 ${policy.badgeColor}`}>
                            {policy.badge}
                          </span>
                        </div>
                      </div>
                      <div className="text-zinc-400 shrink-0">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-zinc-800/80 space-y-2 animate-fadeIn text-xs text-zinc-300">
                        <p className="leading-relaxed font-normal">{policy.description}</p>
                        <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside font-medium pt-1">
                          {policy.bullets.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Subtle Bottom Logout Footer */}
        <div className="px-4 py-2.5 border-t border-zinc-800 text-center bg-zinc-900/95 shrink-0">
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-zinc-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out of Account Session
          </button>
        </div>

      </div>
    </div>
  );
};
