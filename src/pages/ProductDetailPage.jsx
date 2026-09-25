import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { TrustCards } from '../components/TrustBadges';
import {
  ArrowLeft,
  ShoppingCart,
  Check,
  ShieldCheck,
  Truck,
  MessageCircle,
  Sparkles,
  Zap,
  Gauge,
  Cpu,
  Radio,
  BatteryCharging,
  Box,
  Film,
  Play,
  Heart,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const ProductDetailPage = () => {
  const { productId: paramProductId, id: paramId } = useParams();
  const productId = paramProductId || paramId || '';
  const navigate = useNavigate();
  const location = useLocation();
  const { products, allProducts, addToCart, setIsCartOpen, setIsCheckoutOpen, wishlist, toggleWishlist } = useStore();

  const [activeMediaType, setActiveMediaType] = useState('image'); // 'image' | '3d' | 'video'
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBoxOpen, setIsBoxOpen] = useState(true);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);

  const productList = (allProducts && allProducts.length > 0) ? allProducts : (products || []);
  const product = useMemo(() => {
    if (!productList || productList.length === 0) return null;
    if (!productId) return productList[0];
    const cleanId = String(productId).toLowerCase().trim();

    // 1. Direct ID match
    let found = productList.find(p => String(p.id || p._id || '').toLowerCase().trim() === cleanId);
    if (found) return found;

    // 2. Slug / Title / Name match
    found = productList.find(p => {
      const ptitle = String(p.title || p.name || '').toLowerCase().trim();
      const pslug = (p.slug || '').toLowerCase().trim();
      const titleSlug = ptitle.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return (
        (pslug && pslug === cleanId) ||
        (titleSlug && titleSlug === cleanId) ||
        ptitle.includes(cleanId) ||
        cleanId.includes(ptitle)
      );
    });
    if (found) return found;

    // 3. Normalized alphanumeric match (e.g. rc-002 -> rc002 or rc2)
    const normCleanId = cleanId.replace(/[^a-z0-9]/g, '');
    found = productList.find(p => {
      const normId = String(p.id || p._id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const normTitle = String(p.title || p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return normId === normCleanId || (normCleanId.length >= 3 && (normTitle.includes(normCleanId) || normCleanId.includes(normId)));
    });
    if (found) return found;

    // 4. Extracted digit index fallback (e.g. rc-002 -> 2, rc-005 -> 5, rc-019 -> 19)
    const digitsOnly = cleanId.replace(/\D/g, '');
    if (digitsOnly.length > 0) {
      const numVal = parseInt(digitsOnly, 10);
      if (!isNaN(numVal)) {
        const idx = numVal % productList.length;
        return productList[idx] || productList[0];
      }
    }

    // 5. Ultimate safe fallback: return first product if non-empty
    return productList[0] || null;
  }, [productId, productList]);

  const handleBack = () => {
    const returnSection = location.state?.returnSection || (typeof window !== 'undefined' ? sessionStorage.getItem('returnSection') : null);
    if (typeof window !== 'undefined' && window.history && window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/', { state: { returnSection } });
    }
  };

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

  // Auto fallback if active media tab is hidden by live admin toggle
  useEffect(() => {
    if (activeMediaType === '3d' && !show3d) {
      setActiveMediaType('image');
    }
    if (activeMediaType === 'video' && !showVideo) {
      setActiveMediaType('image');
    }
  }, [show3d, showVideo, activeMediaType]);

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

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-lg">
          <div className="text-4xl mb-3">🏎️</div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Vehicle Not Found</h2>
          <p className="text-xs text-slate-600 mb-6">The requested RC machine is unavailable or out of stock.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            ← Return to Storefront
          </button>
        </div>
      </div>
    );
  }

  const galleryImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const model3dUrl = product.model3d || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
  const videoUrl = product.videoUrl || '/videos/hero-rc.mp4';

  // Filter category-matched sibling products
  const siblingCategoryProducts = (products || []).filter(
    item => item && item.category === product.category && item.id !== product.id
  );

  // Fallback to other products if fewer than 2 sibling products in same category
  const relatedProducts = siblingCategoryProducts.length >= 2
    ? siblingCategoryProducts
    : [...siblingCategoryProducts, ...(products || []).filter(item => item && item.id !== product.id && !siblingCategoryProducts.some(sp => sp.id === item.id))].slice(0, 4);

  const totalPrice = product.price || 0;

  const handleAddToCart = () => {
    addToCart(product, [], selectedColor);
    setIsCartOpen(true);
  };

  const handleBuyNow = () => {
    addToCart(product, [], selectedColor);
    setIsCheckoutOpen(true);
  };

  const inStock = product ? (product.stock === undefined || product.stock > 0 || product.inStock !== false) : true;

  const whatsappUrl = `https://wa.me/919686078395?text=${encodeURIComponent(
    `Hi MJ RC BASE Expert, I am interested in buying the ${product.title} (₹${totalPrice.toLocaleString('en-IN')}). Can you assist with dispatch details?`
  )}`;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[75vh] font-sans text-slate-900">
      
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-emerald-600" />
        <span>← Back</span>
      </button>

      {/* Main Showcase Layout */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image & Media Controls (Sticky on Desktop) */}
        <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24 lg:self-start">
          
          {/* Top Interactive Media Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-black">
            <button
              onClick={() => setActiveMediaType('image')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeMediaType === 'image'
                  ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📷 Photos</span>
            </button>

            {show3d && (
              <button
                onClick={() => setActiveMediaType('3d')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeMediaType === '3d'
                    ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Box className="w-3.5 h-3.5 text-emerald-600" />
                <span>🔄 360° 3D Orbit</span>
              </button>
            )}

            {showVideo && (
              <button
                onClick={() => setActiveMediaType('video')}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeMediaType === 'video'
                    ? 'bg-white text-rose-800 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-rose-600" />
                <span>📹 Action Video</span>
              </button>
            )}
          </div>
          
          {/* Main Media Viewport */}
          <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs flex items-center justify-center p-0">
            
            {activeMediaType === 'image' && (
              <>
                <img
                  src={galleryImages[activeImageIndex] || product.image}
                  alt={product.title}
                  className="w-full h-full object-cover object-center block transition-all duration-300"
                />
                <div className="absolute top-3.5 left-3.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold text-amber-900 border border-amber-200 flex items-center gap-1.5 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> High-Speed Scale Bashing Ready
                </div>
                {product.allowCoinRedemption === false && (
                  <div className="absolute top-3.5 right-3.5 bg-rose-900/90 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold border border-rose-700 flex items-center gap-1.5 shadow-xs z-10">
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
                  style={{ width: '100%', height: '100%', backgroundColor: '#F8FAFC' }}
                />
                <div className="absolute top-4 left-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <Box className="w-4 h-4" /> 360° Orbit • Drag to Rotate & Zoom
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
                <div className="absolute top-4 left-4 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <Film className="w-4 h-4" /> Live Action Demo Video
                </div>
              </div>
            )}

          </div>

          {/* Media Selector Thumbnail Strip */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
            
            {/* Photo Thumbnails */}
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveMediaType('image');
                  setActiveImageIndex(idx);
                }}
                className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                  activeMediaType === 'image' && activeImageIndex === idx
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="Thumbnail" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-lg" />
              </button>
            ))}

            {/* 360° 3D Orbit Button */}
            {show3d && (
              <button
                onClick={() => setActiveMediaType('3d')}
                className={`h-16 px-3.5 rounded-xl border-2 text-xs font-black flex flex-col items-center justify-center gap-0.5 shrink-0 transition-all ${
                  activeMediaType === '3d'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Box className="w-5 h-5 text-emerald-600" />
                <span className="text-[10px] uppercase tracking-wider">360° 3D</span>
              </button>
            )}

            {/* Video Tab Button */}
            {showVideo && (
              <button
                onClick={() => setActiveMediaType('video')}
                className={`h-16 px-3.5 rounded-xl border-2 text-xs font-black flex flex-col items-center justify-center gap-0.5 shrink-0 transition-all ${
                  activeMediaType === 'video'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Play className="w-5 h-5 text-rose-600 fill-rose-500" />
                <span className="text-[10px] uppercase tracking-wider">Video</span>
              </button>
            )}

          </div>

          {/* DESKTOP ONLY: Technical Specifications & Box Contents (Fills empty left side void on desktop) */}
          <div className="hidden lg:block space-y-4 pt-4 border-t border-slate-200">
            {/* Technical Specifications Table */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-600" /> Technical Specifications
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-800 font-semibold">
                <div><span className="text-slate-500 font-normal">Motor System:</span> {product.specs?.motor || 'Brushless/Brushed'}</div>
                <div><span className="text-slate-500 font-normal">ESC Unit:</span> {product.specs?.esc || 'Waterproof ESC'}</div>
                <div><span className="text-slate-500 font-normal">Radio Transmitter:</span> {product.specs?.radio || '2.4GHz Digital'}</div>
                <div><span className="text-slate-500 font-normal">Drivetrain:</span> {product.specs?.drivetrain || '4WD Shaft Drive'}</div>
              </div>
            </div>

            {/* Included Parts & Box Contents (Collapsible Drawer) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <button
                type="button"
                onClick={() => setIsBoxOpen(!isBoxOpen)}
                className="w-full font-extrabold text-slate-900 uppercase tracking-wider flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-emerald-600" />
                  <span>Included Parts & Box Contents ({parsedBoxContents.length} items)</span>
                </div>
                {isBoxOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {isBoxOpen && (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-medium pt-2 border-t border-slate-200/60">
                  {parsedBoxContents.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Product Specifications (Collapsible Drawer) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <button
                type="button"
                onClick={() => setIsSpecsOpen(!isSpecsOpen)}
                className="w-full font-extrabold text-slate-900 uppercase tracking-wider flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <span>⚙️ PRODUCT SPECIFICATIONS ({parsedDetailedSpecs.length})</span>
                </div>
                {isSpecsOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {isSpecsOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-medium pt-2 border-t border-slate-200/60">
                  {parsedDetailedSpecs.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-slate-400 font-normal shrink-0">{item.label}:</span>
                      <span className="text-slate-900 font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Title, Price, Buy Buttons, Colors, Coins & Specs */}
        <div className="lg:col-span-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* STEP 2: Product Title, Brand Badge & Rating */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {product.brand && (
                    <span className="bg-emerald-50 text-emerald-800 text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider border border-emerald-200">
                      {product.brand}
                    </span>
                  )}
                  {product.scale && (
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{product.scale}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-extrabold text-amber-900">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                  <span>{product.rating || 4.9}</span>
                  <span className="text-slate-400 font-semibold text-[10px]">({product.reviewsCount || 128} Reviews)</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                {product.title}
              </h1>
            </div>

            {/* DESKTOP ONLY: 5 Quick Spec Badges (Right after Title, before Price Block) */}
            <div className="hidden lg:block space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <Gauge className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-500 font-medium">Top Speed</div>
                  <div className="font-extrabold text-slate-900 text-xs">{product.specs?.topSpeed || '60+ km/h'}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <Cpu className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-500 font-medium">Drivetrain</div>
                  <div className="font-extrabold text-slate-900 text-xs">{product.specs?.drivetrain || '4WD Shaft'}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <BatteryCharging className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-500 font-medium">Battery</div>
                  <div className="font-extrabold text-slate-900 text-xs">{product.specs?.battery || '3S LiPo'}</div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-around text-xs text-slate-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" /> 24h Mysore Express Dispatch
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Genuine Scale Model
                </span>
              </div>
            </div>

            {/* STEP 3: PRICE BLOCK */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Special Offer Price</span>
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight">
                      ₹{product.price?.toLocaleString('en-IN')}
                    </span>
                    {product.mrp && product.mrp > product.price && (
                      <span className="text-sm sm:text-base font-semibold text-slate-400 line-through">
                        ₹{product.mrp?.toLocaleString('en-IN')}
                      </span>
                    )}
                    {discountPercent > 0 && (
                      <span className="bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        SAVE {discountPercent}%
                      </span>
                    )}
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                  inStock ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {inStock ? 'In Stock • Mysore Express Ready' : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* STEP 4: Color / Variant Selection (if applicable) */}
            {hasColorVariants && colorList.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    🎨 SELECT COLOR
                  </span>
                  {selectedColor && (
                    <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                      {selectedColor}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {colorList.map((color, idx) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-emerald-500/30 shadow-md scale-105'
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

            {/* STEP 5: Primary Action Buttons ("BUY NOW" and "ADD TO CART") */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-sm py-3.5 sm:py-4 rounded-2xl shadow-md shadow-red-600/20 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Zap className="w-5 h-5 fill-white stroke-none" />
                  <span>BUY NOW • ₹{totalPrice.toLocaleString('en-IN')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm py-3.5 sm:py-4 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
                  <span>ADD TO CART</span>
                </button>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1.5 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Have questions? Chat with an Expert on WhatsApp</span>
              </a>
            </div>

            {/* MOBILE ONLY: 5 Quick Spec Badges (Placed directly below ADD TO CART button container) */}
            <div className="block lg:hidden space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <Gauge className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-500 font-medium">Top Speed</div>
                  <div className="font-extrabold text-slate-900 text-xs">{product.specs?.topSpeed || '60+ km/h'}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <Cpu className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-500 font-medium">Drivetrain</div>
                  <div className="font-extrabold text-slate-900 text-xs">{product.specs?.drivetrain || '4WD Shaft'}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <BatteryCharging className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-500 font-medium">Battery</div>
                  <div className="font-extrabold text-slate-900 text-xs">{product.specs?.battery || '3S LiPo'}</div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-around text-xs text-slate-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" /> 24h Mysore Express Dispatch
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Genuine Scale Model
                </span>
              </div>
            </div>

            {/* STEP 6: Rewards / Coin Earning Banner */}
            {product.allowCoinRedemption !== false && coinReward > 0 && (
              <div className="bg-amber-500/10 border border-amber-300/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-base font-black shrink-0 shadow-xs">
                    🪙
                  </div>
                  <div>
                    <div className="font-black text-amber-950">Earn up to {coinReward} RC Coins on this order</div>
                    <div className="text-[11px] font-semibold text-amber-800/80">Redeem coins for instant discounts on future scale parts & upgrades</div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: Detailed Description, Key Specifications, Features & Highlights */}
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {product.description}
              </p>

              {/* MOBILE ONLY: Technical Specifications & Box Contents */}
              <div className="block lg:hidden space-y-4">
                {/* Technical Specifications Table */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-600" /> Technical Specifications
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-slate-800 font-semibold">
                    <div><span className="text-slate-500 font-normal">Motor System:</span> {product.specs?.motor || 'Brushless/Brushed'}</div>
                    <div><span className="text-slate-500 font-normal">ESC Unit:</span> {product.specs?.esc || 'Waterproof ESC'}</div>
                    <div><span className="text-slate-500 font-normal">Radio Transmitter:</span> {product.specs?.radio || '2.4GHz Digital'}</div>
                    <div><span className="text-slate-500 font-normal">Drivetrain:</span> {product.specs?.drivetrain || '4WD Shaft Drive'}</div>
                  </div>
                </div>

                {/* Included Parts & Box Contents (Collapsible Drawer) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsBoxOpen(!isBoxOpen)}
                    className="w-full font-extrabold text-slate-900 uppercase tracking-wider flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <Box className="w-4 h-4 text-emerald-600" />
                      <span>Included Parts & Box Contents ({parsedBoxContents.length} items)</span>
                    </div>
                    {isBoxOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>

                  {isBoxOpen && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-medium pt-2 border-t border-slate-200/60">
                      {parsedBoxContents.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Product Specifications (Collapsible Drawer) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsSpecsOpen(!isSpecsOpen)}
                    className="w-full font-extrabold text-slate-900 uppercase tracking-wider flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-emerald-600" />
                      <span>⚙️ PRODUCT SPECIFICATIONS ({parsedDetailedSpecs.length})</span>
                    </div>
                    {isSpecsOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>

                  {isSpecsOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-medium pt-2 border-t border-slate-200/60">
                      {parsedDetailedSpecs.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
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

      {/* Category-Matched Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  More in {typeof product.category === 'string' ? product.category : (product.category?.name || product.category?.label || 'RC Models')} Series
                </h3>
                {siblingCategoryProducts.length > 0 && (
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {siblingCategoryProducts.length} Sibling Models
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Explore hand-tested models from the same category ready for Mysore Hub 24H dispatch
              </p>
            </div>

            <Link
              to={`/category/${(typeof product.category === 'string' ? product.category : (product.category?.name || product.category?.label || 'all')).toLowerCase().replace(/[:-\s]+/g, '-')}`}
              className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 hidden sm:inline-flex items-center gap-1 transition-colors"
            >
              <span>View All {typeof product.category === 'string' ? product.category : (product.category?.name || product.category?.label || 'RC Models')} →</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 px-3 sm:px-0 mt-4">
            {relatedProducts.map((item) => {
              const isWishlisted = wishlist?.some(w => (w.id === item.id || w === item.id));

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md border border-slate-200/80 hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between cursor-pointer select-none"
                >
                  {/* Edge-to-Edge Image Header */}
                  <div className="relative w-full aspect-[4/3] rounded-t-2xl overflow-hidden bg-neutral-100 p-0">
                    {item.discount > 0 && (
                      <div className="absolute top-2 left-2 z-10 bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        SAVE {item.discount}%
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(item);
                      }}
                      className={`absolute top-2 right-2 z-10 p-1.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                        isWishlisted
                          ? 'bg-rose-50 border-rose-200 text-rose-500 scale-105'
                          : 'bg-white/90 border-slate-200 text-slate-400 hover:text-rose-500 hover:scale-110'
                      }`}
                      title="Toggle Wishlist"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500 stroke-rose-500' : 'stroke-slate-400 fill-transparent'}`} />
                    </button>

                    <img
                      src={item.image || item.imageUrl}
                      loading="lazy"
                      decoding="async"
                      alt={item.title}
                      className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />

                    {item.scale && (
                      <div className="absolute bottom-2 left-2 z-10 bg-white/90 backdrop-blur-sm border border-slate-200 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                        {item.scale}
                      </div>
                    )}
                  </div>

                  {/* Compact Card Body */}
                  <div className="p-2.5 bg-white rounded-b-2xl border-x border-b border-slate-200/80 flex flex-col justify-between flex-1 space-y-2">
                    <div>
                      {/* Brand & Rating row */}
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                        <span className="truncate max-w-[65%]">{item.brand}</span>
                        <span className="flex items-center gap-0.5 text-amber-900 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded-md text-[9px] font-extrabold shrink-0">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" /> {item.rating || 4.9}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5 group-hover:text-emerald-700 transition-colors">
                        {item.title}
                      </h4>
                    </div>

                    {/* Bottom Row */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div className="text-sm font-black text-emerald-700 truncate">
                        ₹{item.price?.toLocaleString('en-IN')}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${item.id}`);
                        }}
                        className="h-7 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* High-Octane Trust Cards */}
      <TrustCards className="mt-12" />

    </div>
  );
};

export default ProductDetailPage;
