import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  ShoppingCart,
  Check,
  ShieldCheck,
  Truck,
  MessageCircle,
  Sparkles,
  Zap,
  Star,
  Gauge,
  Cpu,
  Radio,
  BatteryCharging,
  Box,
  Film,
  Play,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const ProductDetailModal = () => {
  const {
    activeProductModal,
    setActiveProductModal,
    addonsConfig,
    addToCart,
    setIsCartOpen,
    setIsCheckoutOpen,
    products,
    allProducts
  } = useStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('3d');
  const [selectedAddons, setSelectedAddons] = useState(['battery']);
  const [isBoxOpen, setIsBoxOpen] = useState(true);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [activeMediaType, setActiveMediaType] = useState('image'); // 'image' | '3d' | 'video'
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const activeProductId = activeProductModal
    ? (typeof activeProductModal === 'string' ? activeProductModal : (activeProductModal.id || activeProductModal._id))
    : null;

  const currentList = (allProducts && allProducts.length > 0) ? allProducts : (products || []);
  const product = useMemo(() => {
    if (!activeProductId) return typeof activeProductModal === 'object' ? activeProductModal : null;
    const found = currentList.find(p => String(p.id || p._id).toLowerCase() === String(activeProductId).toLowerCase());
    return found || (typeof activeProductModal === 'object' ? activeProductModal : null);
  }, [activeProductId, currentList, activeProductModal]);

  const parsedBoxContents = useMemo(() => {
    if (!product) return [];
    const raw = product.boxContents || product.includedParts;
    if (!raw) {
      return [
        '1x Pre-Assembled Ready-to-Run (RTR) Vehicle',
        '1x 2.4GHz Digital Transmitter Remote',
        '1x Rechargeable Battery Pack & USB Fast Charger',
        '1x Precision Tool Kit & Spare Body Clips',
        '1x Owner Instruction Manual & Spec Sheet'
      ];
    }
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      return raw
        .split('\n')
        .flatMap(line => line.split(','))
        .map(s => s.replace(/^[•\-\*]\s*/, '').trim())
        .filter(Boolean);
    }
    return [];
  }, [product]);

  const parsedDetailedSpecs = useMemo(() => {
    if (!product) return [];
    const raw = product.detailedSpecs || product.specificationsText;
    if (raw && typeof raw === 'string' && raw.trim().length > 0) {
      return raw
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
          const colonIndex = line.indexOf(':');
          if (colonIndex !== -1) {
            return {
              label: line.substring(0, colonIndex).trim(),
              value: line.substring(colonIndex + 1).trim()
            };
          }
          return { label: 'Spec', value: line };
        });
    }

    const list = [];
    if (product.scale) list.push({ label: 'Scale', value: product.scale });
    if (product.brand) list.push({ label: 'Brand', value: product.brand });
    if (product.category) list.push({ label: 'Category', value: product.category });
    if (product.specs?.motor) list.push({ label: 'Motor', value: product.specs.motor });
    if (product.specs?.esc) list.push({ label: 'ESC Unit', value: product.specs.esc });
    if (product.specs?.radio) list.push({ label: 'Radio System', value: product.specs.radio });
    if (product.specs?.drivetrain) list.push({ label: 'Drivetrain', value: product.specs.drivetrain });
    if (product.specs?.topSpeed) list.push({ label: 'Top Speed', value: product.specs.topSpeed });
    if (product.specs?.battery) list.push({ label: 'Battery', value: product.specs.battery });

    if (list.length === 0) {
      list.push(
        { label: 'Scale', value: '1:10 / 1:12' },
        { label: 'Radio System', value: '2.4GHz Digital' },
        { label: 'Drivetrain', value: '4WD Shaft Drive' }
      );
    }
    return list;
  }, [product]);

  const show3d = product ? (product.enable3DView !== false && product.show3dViewer !== false) : false;
  const showVideo = product ? (product.showVideoTab !== false) : false;

  useEffect(() => {
    if (activeMediaType === '3d' && !show3d) {
      setActiveMediaType('image');
    }
    if (activeMediaType === 'video' && !showVideo) {
      setActiveMediaType('image');
    }
  }, [show3d, showVideo, activeMediaType]);

  if (!activeProductModal || !product) return null;

  const galleryImages = (product.images && product.images.length > 0) ? product.images : (product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages : [product.image]);
  const model3dUrl = product.model3d || product.model3dUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
  const videoUrl = product.videoUrl || '/videos/hero-rc.mp4';

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setActiveProductModal(null);
    }
  };

  const hasColorVariants = Boolean(product?.hasColors !== false && Array.isArray(product?.availableColors) && product.availableColors.length > 0);
  const colorList = useMemo(() => (hasColorVariants ? product.availableColors : []), [hasColorVariants, product]);
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    if (hasColorVariants && colorList.length > 0) {
      setSelectedColor(colorList[0]);
    } else {
      setSelectedColor('');
    }
  }, [product, hasColorVariants, colorList]);

  const toggleAddon = (key) => {
    setSelectedAddons(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const extraAddonsPrice = selectedAddons.reduce((sum, key) => {
    if (addonsConfig[key] && addonsConfig.enabled) {
      return sum + addonsConfig[key].price;
    }
    return sum;
  }, 0);

  const totalPrice = product.price + extraAddonsPrice;

  const handleAddToCart = () => {
    addToCart(product, selectedAddons, selectedColor);
    setActiveProductModal(null);
    setIsCartOpen(true);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedAddons, selectedColor);
    setActiveProductModal(null);
    setIsCheckoutOpen(true);
  };

  const discountPercent = useMemo(() => {
    if (!product) return 0;
    if (product.discount && product.discount > 0) return Number(product.discount);
    if (product.mrp && product.price && product.mrp > product.price) {
      return Math.round(((product.mrp - product.price) / product.mrp) * 100);
    }
    return 0;
  }, [product]);

  const coinReward = useMemo(() => {
    if (!product) return 0;
    if (product.rcCoins) return product.rcCoins;
    if (product.coins) return product.coins;
    return Math.floor((product.price || 0) * 0.05);
  }, [product]);

  const inStock = product ? (product.stock === undefined || product.stock > 0 || product.inStock !== false) : true;

  const whatsappUrl = `https://wa.me/919686078395?text=${encodeURIComponent(
    `Hi MJ RC BASE Expert, I am interested in buying the ${product.title} (₹${totalPrice.toLocaleString('en-IN')}). Can you assist with dispatch details?`
  )}`;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fadeIn font-sans"
    >
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            {product.brand && (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-wider border border-emerald-200">
                {product.brand}
              </span>
            )}
            {product.scale && (
              <span className="text-xs font-bold text-slate-500">{product.scale}</span>
            )}
          </div>
          <button
            onClick={() => setActiveProductModal(null)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Interactive Multi-Asset Gallery & Highlights */}
          <div className="md:col-span-6 space-y-4">
            
            {/* Main Media Viewport */}
            <div className="relative h-72 sm:h-80 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
              
              {activeMediaType === 'image' && (
                <>
                  <img
                    src={galleryImages[activeImageIndex] || product.image}
                    alt={product.title}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-extrabold text-amber-700 border border-amber-200 flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3 text-amber-500" /> High-Speed Bashing Ready
                  </div>
                  {product.allowCoinRedemption === false && (
                    <div className="absolute top-3 right-3 bg-rose-900/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-rose-700 flex items-center gap-1 shadow-sm z-10">
                      Special Item - Coin Discount Not Applicable
                    </div>
                  )}
                </>
              )}

              {activeMediaType === '3d' && (
                <div className="w-full h-full relative">
                  <model-viewer
                    src={model3dUrl}
                    camera-controls
                    auto-rotate
                    shadow-intensity="1"
                    touch-action="pan-y"
                    style={{ width: '100%', height: '100%', backgroundColor: '#f8fafc' }}
                  />
                  <div className="absolute top-3 left-3 bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Box className="w-3.5 h-3.5" /> 360° Orbit • Drag to Rotate & Zoom
                  </div>
                </div>
              )}

              {activeMediaType === 'video' && (
                <div className="w-full h-full relative bg-black">
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute top-3 left-3 bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Film className="w-3.5 h-3.5" /> Live Action Demo Video
                  </div>
                </div>
              )}

            </div>

            {/* Media Selector Thumbnail Strip */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              
              {/* Photo Thumbnails */}
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveMediaType('image');
                    setActiveImageIndex(idx);
                  }}
                  className={`w-14 h-14 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                    activeMediaType === 'image' && activeImageIndex === idx
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </button>
              ))}

              {/* 360° 3D Orbit Button */}
              {show3d && (
                <button
                  onClick={() => setActiveMediaType('3d')}
                  className={`h-14 px-3 rounded-xl border-2 text-xs font-black flex flex-col items-center justify-center gap-0.5 shrink-0 transition-all ${
                    activeMediaType === '3d'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Box className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] uppercase tracking-wider">360° 3D</span>
                </button>
              )}

              {/* Video Tab Button */}
              {showVideo && (
                <button
                  onClick={() => setActiveMediaType('video')}
                  className={`h-14 px-3 rounded-xl border-2 text-xs font-black flex flex-col items-center justify-center gap-0.5 shrink-0 transition-all ${
                    activeMediaType === 'video'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Play className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span className="text-[10px] uppercase tracking-wider">Video</span>
                </button>
              )}

            </div>
          </div>

          {/* Right Column: Title, Price, Buy Buttons, Colors, Coins & Specs */}
          <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Product Title, Brand Badge & Rating */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {product.brand && (
                      <span className="bg-emerald-50 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-wider border border-emerald-200">
                        {product.brand}
                      </span>
                    )}
                    {product.scale && (
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{product.scale}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-extrabold text-amber-900">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                    <span>{product.rating || 4.9}</span>
                    <span className="text-slate-400 font-semibold text-[10px]">({product.reviewsCount || 128})</span>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
                  {product.title}
                </h2>
              </div>

              {/* PRICE & ADD TO CART CTA BLOCK (PHYSICALLY DIRECTLY BELOW TITLE) */}
              <div className="price-cta-container space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Special Offer Price</span>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        ₹{totalPrice.toLocaleString('en-IN')}
                      </span>
                      {product.mrp && product.mrp > product.price && (
                        <span className="text-xs sm:text-sm font-semibold text-slate-400 line-through">
                          ₹{(product.mrp + extraAddonsPrice).toLocaleString('en-IN')}
                        </span>
                      )}
                      {discountPercent > 0 && (
                        <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          SAVE {discountPercent}%
                        </span>
                      )}
                      {coinReward > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                          🪙 +{coinReward} Coins
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    inStock ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    {inStock ? 'In Stock • Mysore Express' : 'Out of Stock'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={!inStock}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md shadow-red-600/20 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-white stroke-none" />
                    <span>BUY NOW • ₹{totalPrice.toLocaleString('en-IN')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!inStock}
                    className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white font-black text-xs sm:text-sm py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                    <span>ADD TO CART • ₹{totalPrice.toLocaleString('en-IN')}</span>
                  </button>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-0.5 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Have questions? Chat with an Expert on WhatsApp</span>
                </a>
              </div>

              {/* Color / Variant Selection (if applicable) */}
              {hasColorVariants && colorList.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                      🎨 SELECT COLOR
                    </span>
                    {selectedColor && (
                      <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px]">
                        {selectedColor}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {colorList.map((color, idx) => {
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-emerald-500/30 shadow-xs scale-105'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/50 shrink-0"
                            style={{
                              backgroundColor:
                                color.toLowerCase().includes('blue') ? '#2563eb' :
                                color.toLowerCase().includes('yellow') ? '#eab308' :
                                color.toLowerCase().includes('green') ? '#16a34a' :
                                color.toLowerCase().includes('red') ? '#dc2626' :
                                color.toLowerCase().includes('black') ? '#0f172a' :
                                color.toLowerCase().includes('gray') || color.toLowerCase().includes('grey') ? '#64748b' :
                                color.toLowerCase().includes('white') ? '#f8fafc' :
                                color.toLowerCase().includes('orange') ? '#ea580c' : '#10b981'
                            }}
                          />
                          <span>{color}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Micro Feature Chips */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                  <Gauge className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-500">Top Speed</div>
                  <div className="font-extrabold text-slate-900 text-[11px]">{product.specs?.topSpeed || '60+ km/h'}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                  <Cpu className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-500">Drivetrain</div>
                  <div className="font-extrabold text-slate-900 text-[11px]">{product.specs?.drivetrain || '4WD Shaft'}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                  <BatteryCharging className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-500">Battery</div>
                  <div className="font-extrabold text-slate-900 text-[11px]">{product.specs?.battery || '3S LiPo'}</div>
                </div>
              </div>

              {/* Guarantee Pills */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-around text-xs text-slate-700">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Truck className="w-4 h-4 text-emerald-600" /> Mysore Express Dispatch
                </span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Genuine Hobby RC
                </span>
              </div>

              {/* Rewards / Coin Earning Banner */}
              {product.allowCoinRedemption !== false && coinReward > 0 && (
                <div className="bg-amber-500/10 border border-amber-300/80 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-xs">
                      🪙
                    </div>
                    <div>
                      <div className="font-black text-amber-950 text-xs">Earn up to {coinReward} RC Coins on this order</div>
                      <div className="text-[10px] font-semibold text-amber-800/80">Redeem coins for instant discounts on future scale parts</div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: Spares Add-on Checklist */}
              {addonsConfig.enabled && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Performance Spares & Add-ons
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">Bundle & Save</span>
                  </div>

                  <div className="space-y-1.5">
                    {Object.entries(addonsConfig).map(([key, addon]) => {
                      if (key === 'enabled') return null;
                      const isChecked = selectedAddons.includes(key);

                      return (
                        <label
                          key={key}
                          onClick={() => toggleAddon(key)}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-white border-emerald-500 text-slate-900 font-bold shadow-xs'
                              : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[#cbd5e1] bg-white'}`}>
                              {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className="text-[11px]">{addon.name}</span>
                          </div>
                          <span className="font-extrabold text-emerald-600 text-[11px]">+₹{addon.price.toLocaleString('en-IN')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 8: Detailed Description, Key Specifications & Box Contents */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {product.description}
                </p>

                {/* Technical Specifications Table */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 text-xs">
                  <div className="font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                    <Radio className="w-3.5 h-3.5 text-emerald-600" /> Technical Specifications
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-800 font-semibold text-[11px]">
                    <div><span className="text-slate-500 font-normal">Motor:</span> {product.specs?.motor || 'Brushless/Brushed'}</div>
                    <div><span className="text-slate-500 font-normal">ESC:</span> {product.specs?.esc || 'Waterproof ESC'}</div>
                    <div><span className="text-slate-500 font-normal">Radio:</span> {product.specs?.radio || '2.4GHz Digital'}</div>
                    <div><span className="text-slate-500 font-normal">Drivetrain:</span> {product.specs?.drivetrain || '4WD Shaft Drive'}</div>
                  </div>
                </div>

                {/* Included Parts & Box Contents (Collapsible Drawer) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsBoxOpen(!isBoxOpen)}
                    className="w-full font-extrabold text-slate-900 uppercase tracking-wider flex items-center justify-between cursor-pointer select-none text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Included Parts & Box Contents ({parsedBoxContents.length})</span>
                    </div>
                    {isBoxOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </button>

                  {isBoxOpen && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700 font-medium pt-1 border-t border-slate-200/60 text-[11px]">
                      {parsedBoxContents.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="line-clamp-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Product Specifications (Collapsible Drawer) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsSpecsOpen(!isSpecsOpen)}
                    className="w-full font-extrabold text-slate-900 uppercase tracking-wider flex items-center justify-between cursor-pointer select-none text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-emerald-600" />
                      <span>⚙️ PRODUCT SPECIFICATIONS ({parsedDetailedSpecs.length})</span>
                    </div>
                    {isSpecsOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </button>

                  {isSpecsOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700 font-medium pt-1 border-t border-slate-200/60 text-[11px]">
                      {parsedDetailedSpecs.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <span className="text-slate-400 font-normal shrink-0">{item.label}:</span>
                          <span className="text-slate-900 font-semibold">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
