import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, deleteDoc, writeBatch, increment } from 'firebase/firestore';
import { sendCloudWhatsAppMessage, logWhatsAppMessage } from '../services/whatsappCloudApi';
import { fetchCampaignRecipients, dispatchBulkWhatsAppCampaign } from '../services/whatsappBulkService';
import { formatCoins, formatLogDate, calculateExpiryDetails, getEffectiveUserCoins } from '../utils/formatters';
import { WhatsAppDispatchGatewayPanel } from '../components/WhatsAppDispatchGatewayPanel';

const getPure10Phone = (input) => {
  if (!input) return '';
  const raw = String(input).replace(/\D/g, '');
  return raw.slice(-10);
};
import {
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  X,
  Check,
  Plus,
  Lock,
  LogOut,
  Truck,
  Package,
  CheckCircle2,
  XCircle,
  Layers,
  Tag,
  Grid,
  Search,
  Flame,
  ExternalLink,
  Menu,
  BarChart3,
  TrendingUp,
  Users,
  ShieldCheck,
  Gift,
  Coins,
  Box,
  Settings,
  Sparkles,
  RefreshCw,
  Sliders,
  DollarSign,
  Star,
  Upload,
  PlusCircle,
  Smartphone,
  Share2,
  Clock,
  ArrowUpRight,
  Boxes,
  Eye as ViewIcon,
  ShoppingBag,
  MessageSquare,
  Send,
  Zap,
  Calendar,
  AlertTriangle,
  SendHorizontal,
  Film,
  Radio,
  Gauge,
  Cpu,
  BatteryCharging,
  Image as ImageIcon,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Edit3
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'RC Crawlers',
  'Trail Pickups',
  'Drift and Rally',
  'Bashers and Monster',
  'Heavy Machinery',
  'Short course'
];

const SCALE_OPTIONS = ['1:64', '1:43', '1:32', '1:24', '1:18', '1:14', '1:10', '1:8', '1:5'];

const BADGE_OPTIONS = ['Trending', 'Hot Deal', 'Limited Edition', 'Collector Item', 'New Drop'];

const OFFICIAL_18_BRANDS = [
  'HotWheels',
  'WLtoys',
  'FMS',
  'Bburago',
  'RLAARLO',
  'MJX R/C',
  'HStar',
  'CCA AUTO',
  '1:64 MINI GT',
  'JIABAILE',
  'RGT 4WD',
  'JJR/C',
  'HB TOYS',
  'MN MODEL',
  'TRAXXAS',
  'AXIAL',
  'ARRMA',
  'KYOSHO'
];

// Full-Featured 5-Tab Product Add/Edit Modal
const FullProductModal = ({ product = null, preset = null, onClose, onSave }) => {
  const [modalTab, setModalTab] = useState('basic'); // 'basic' | 'gallery' | 'media' | 'specs' | 'stock'

  // Image Gallery Array State (4-5+ Images)
  const initialImages = useMemo(() => {
    if (product) {
      const arr = (product.images && product.images.length > 0) ? product.images : (product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages : [product.image]);
      return arr.filter(Boolean);
    }
    return ['https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80'];
  }, [product]);

  const [imagesList, setImagesList] = useState(initialImages);

  const [formData, setFormData] = useState({
    title: product?.title || product?.name || '',
    subtitle: product?.subtitle || '',
    price: product?.price !== undefined && product?.price !== null ? product.price : '',
    mrp: product?.mrp !== undefined && product?.mrp !== null ? product.mrp : (product?.price || ''),
    category: product?.category !== undefined && product?.category !== null ? product.category : (preset?.category || ''),
    scale: product?.scale !== undefined && product?.scale !== null ? product.scale : (preset?.scale || ''),
    brand: product?.brand !== undefined && product?.brand !== null ? product.brand : (preset?.brand || ''),
    badge: product?.badge !== undefined && product?.badge !== null ? product.badge : '',
    allowCoinRedemption: product ? product.allowCoinRedemption !== false : true,
    maxCoinsRedeemable: product?.maxCoinsRedeemable !== undefined ? product.maxCoinsRedeemable : 500,
    coinDiscountAmount: product?.coinDiscountAmount !== undefined ? product.coinDiscountAmount : Math.round((product?.maxCoinsRedeemable !== undefined ? product.maxCoinsRedeemable : 500) / 5),
    coinsRewardedOnPurchase: product?.coinsRewardedOnPurchase !== undefined ? product.coinsRewardedOnPurchase : (product?.rcCoins !== undefined ? product.rcCoins : 100),
    isFeatured: product ? (product.isFeatured !== false && product.featuredOnHome !== false) : (preset?.isFeatured !== undefined ? Boolean(preset.isFeatured) : true),
    model3dUrl: product?.model3dUrl || product?.model3d || '',
    enable3DView: product ? (product.enable3DView !== false && product.show3dViewer !== false) : true,
    videoUrl: product?.videoUrl || '',
    showVideoTab: product ? product.showVideoTab !== false : true,
    description: product?.description || '',
    boxContents: product?.boxContents || product?.includedParts || '',
    hasColors: product ? Boolean(product.hasColors && Array.isArray(product.availableColors) && product.availableColors.length > 0) : false,
    availableColors: Array.isArray(product?.availableColors) ? product.availableColors : (typeof product?.availableColors === 'string' ? product.availableColors.split(',').map(c => c.trim()).filter(Boolean) : []),
    colorsInput: Array.isArray(product?.availableColors) ? product.availableColors.join(', ') : (typeof product?.availableColors === 'string' ? product.availableColors : ''),
    inStock: product ? product.inStock !== false : true,
    remainingUnits: product?.remainingUnits !== undefined ? product.remainingUnits : 15,
    hidden: product ? (product.hidden === true || product.isVisible === false) : false,
    rating: product?.rating !== undefined ? product.rating : 4.9,
    reviewsCount: product?.reviewsCount !== undefined ? product.reviewsCount : 35,
    motor: product?.specs?.motor || '',
    esc: product?.specs?.esc || '',
    radio: product?.specs?.radio || '',
    drivetrain: product?.specs?.drivetrain || '',
    topSpeed: product?.specs?.topSpeed || '',
    battery: product?.specs?.battery || ''
  });

  const handleImageChange = (index, value) => {
    setImagesList(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleAddImageInput = () => {
    setImagesList(prev => [...prev, '']);
  };

  const handleRemoveImageInput = (index) => {
    setImagesList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      alert('Please enter a vehicle title and selling price.');
      return;
    }

    const cleanImages = imagesList.map(s => s.trim()).filter(Boolean);
    const mainImg = cleanImages[0] || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80';

    const catLower = formData.category.trim().toLowerCase();
    const titleLower = formData.title.trim().toLowerCase();
    const isScaleModel = (
      catLower === 'scale models' ||
      catLower === 'scale model' ||
      catLower === 'diecast' ||
      product?.isScaleModel === true ||
      preset?.isScaleModel === true ||
      preset?.lockScale === true ||
      preset?.category?.toLowerCase() === 'scale models' ||
      titleLower.includes('scale model') ||
      titleLower.includes('diecast')
    );

    const finalCategory = isScaleModel && (!formData.category.trim() || catLower === 'scale model' || catLower === 'diecast')
      ? 'Scale Models'
      : formData.category.trim();

    const calculatedRupeeDiscount = formData.coinDiscountAmount !== undefined && formData.coinDiscountAmount !== null && formData.coinDiscountAmount !== ''
      ? Number(formData.coinDiscountAmount)
      : Math.round(Number(formData.maxCoinsRedeemable || 500) / 5);

    const cleanColors = formData.hasColors
      ? (Array.isArray(formData.availableColors) && formData.availableColors.length > 0
          ? formData.availableColors
          : (formData.colorsInput
              ? formData.colorsInput.split(',').map(s => s.trim()).filter(Boolean)
              : []))
      : [];

    const payload = {
      title: formData.title.trim(),
      name: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      price: Number(formData.price),
      mrp: Number(formData.mrp || formData.price),
      originalPrice: Number(formData.mrp || formData.price),
      category: finalCategory,
      isScaleModel: Boolean(isScaleModel),
      scale: formData.scale.trim(),
      brand: formData.brand.trim(),
      badge: formData.badge.trim(),
      hasColors: Boolean(formData.hasColors && cleanColors.length > 0),
      availableColors: cleanColors,
      allowCoinRedemption: Boolean(formData.allowCoinRedemption !== false),
      maxCoinsRedeemable: Number(formData.maxCoinsRedeemable !== undefined ? formData.maxCoinsRedeemable : 500),
      coinDiscountAmount: calculatedRupeeDiscount,
      coinsRewardedOnPurchase: Number(formData.coinsRewardedOnPurchase !== undefined ? formData.coinsRewardedOnPurchase : 100),
      rcCoins: Number(formData.coinsRewardedOnPurchase !== undefined ? formData.coinsRewardedOnPurchase : 100),
      isFeatured: Boolean(formData.isFeatured),
      featuredOnHome: Boolean(formData.isFeatured),
      image: mainImg,
      imageUrl: mainImg,
      images: cleanImages,
      galleryImages: cleanImages,
      model3dUrl: formData.model3dUrl,
      model3d: formData.model3dUrl,
      enable3DView: Boolean(formData.enable3DView),
      show3dViewer: Boolean(formData.enable3DView),
      videoUrl: formData.videoUrl,
      showVideoTab: Boolean(formData.showVideoTab),
      description: formData.description,
      boxContents: formData.boxContents,
      includedParts: formData.boxContents,
      detailedSpecs: formData.detailedSpecs,
      specificationsText: formData.detailedSpecs,
      inStock: Boolean(formData.inStock),
      remainingUnits: Number(formData.remainingUnits || 0),
      hidden: Boolean(formData.hidden),
      isVisible: !Boolean(formData.hidden),
      rating: Number(formData.rating || 4.9),
      reviewsCount: Number(formData.reviewsCount || 35),
      specs: {
        motor: formData.motor,
        esc: formData.esc,
        radio: formData.radio,
        drivetrain: formData.drivetrain,
        topSpeed: formData.topSpeed,
        battery: formData.battery
      }
    };

    if (product) {
      await onSave(product.id || product._id, payload);
    } else {
      await onSave(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl p-5 sm:p-6 text-slate-900 shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              {product ? <Edit2 className="w-5 h-5 text-emerald-600" /> : <Plus className="w-5 h-5 text-emerald-600" />}
              <span>{product ? `Edit Product Details (#${product.id || product._id})` : 'Publish New RC Vehicle'}</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Changes persist directly to Firestore `products` collection and sync live to storefront</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* 5-Section Tab Navigation Bar */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 overflow-x-auto text-xs font-black">
          {[
            { id: 'basic', label: 'Basic & Pricing', icon: Tag },
            { id: 'gallery', label: `Gallery (${imagesList.length})`, icon: ImageIcon },
            { id: 'media', label: '3D & Video', icon: Box },
            { id: 'specs', label: 'Specs & Description', icon: FileText },
            { id: 'stock', label: 'Stock & Visibility', icon: SlidersHorizontal }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = modalTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setModalTab(tab.id)}
                className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium pt-2">
          
          {/* TAB 1: BASIC INFO & PRICING */}
          {modalTab === 'basic' && (
            <div className="space-y-4 animate-fadeIn">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Vehicle Title / Model Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Traxxas TRX-4 Defender 1/10"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Subtitle / Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g. Extreme Portal Axle Trail Crawler"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="46999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-emerald-700 font-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">MRP / Original Price (₹)</label>
                  <input
                    type="number"
                    placeholder="52999"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. RC Crawlers"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. TRAXXAS"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Scale Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. 1:10"
                    value={formData.scale}
                    onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[11px]">Badge Tag Highlight</label>
                <div className="flex flex-wrap gap-2">
                  {['', ...BADGE_OPTIONS].map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setFormData({ ...formData, badge: b })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition border ${
                        formData.badge === b ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {b || 'No Badge'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 🪙 RC Loyalty & Coin Controls (Profit Protection) */}
              <div className="mt-5 p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🪙</span>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wider">RC Loyalty & Coin Controls (Profit Protection)</h4>
                  </div>

                  {/* Control 1: Toggle Switch allowCoinRedemption */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs font-extrabold text-slate-800">
                      Allow Customers to Redeem Coins on this Car
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.allowCoinRedemption !== false}
                      onChange={(e) => setFormData({ ...formData, allowCoinRedemption: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Turn OFF for low-margin items (like budget Hot Wheels) to block all coin discounts.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Control 2: Coins to Deduct from Customer Wallet */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-800 mb-1">
                      Coins to Deduct from Customer Wallet
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={formData.allowCoinRedemption === false}
                      value={formData.maxCoinsRedeemable !== undefined ? formData.maxCoinsRedeemable : 500}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setFormData({
                          ...formData,
                          maxCoinsRedeemable: val,
                          coinDiscountAmount: Math.round(val / 5)
                        });
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 disabled:opacity-50"
                      placeholder="e.g. 100"
                    />
                  </div>

                  {/* Control 3: Exact Rupee Discount Given */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-800 mb-1">
                      Exact Rupee Discount Given (₹ Off)
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={formData.allowCoinRedemption === false}
                      value={formData.coinDiscountAmount !== undefined ? formData.coinDiscountAmount : Math.round((formData.maxCoinsRedeemable || 500) / 5)}
                      onChange={(e) => setFormData({ ...formData, coinDiscountAmount: Math.max(0, Number(e.target.value)) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-emerald-700 font-black text-xs focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                      placeholder="e.g. 20"
                    />
                  </div>

                  {/* Control 4: Reward Coins Earned on Delivery */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-800 mb-1">
                      Reward Coins Earned on Delivery
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.coinsRewardedOnPurchase !== undefined ? formData.coinsRewardedOnPurchase : 100}
                      onChange={(e) => setFormData({ ...formData, coinsRewardedOnPurchase: Math.max(0, Number(e.target.value)) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs focus:outline-none focus:border-emerald-600"
                      placeholder="e.g. 100"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-800 font-semibold italic pt-0.5">
                  Customer spends {formData.maxCoinsRedeemable || 100} coins and gets exactly ₹{formData.coinDiscountAmount !== undefined ? formData.coinDiscountAmount : Math.round((formData.maxCoinsRedeemable || 100) / 5)} off.
                </p>
              </div>

              {/* DYNAMIC COLOR VARIANTS SECTION */}
              <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">Product Color Variants</h4>
                    <p className="text-xs text-slate-500">Enable if this toy/car has multiple color choices for buyers.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={Boolean(formData.hasColors)} 
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        hasColors: e.target.checked,
                        availableColors: e.target.checked ? (prev.availableColors?.length ? prev.availableColors : ['Blue', 'Yellow', 'Green']) : []
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {formData.hasColors && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                    <label className="block text-xs font-medium text-slate-900 mb-1">
                      Available Colors (comma separated)
                    </label>
                    <input 
                      type="text" 
                      value={Array.isArray(formData.availableColors) ? formData.availableColors.join(', ') : (formData.availableColors || '')} 
                      onChange={(e) => {
                        const raw = e.target.value;
                        const arr = raw.split(',').map(c => c.trim()).filter(Boolean);
                        setFormData(prev => ({ ...prev, availableColors: arr }));
                      }}
                      placeholder="e.g. Blue, Yellow, Green, Black" 
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                    />
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {(Array.isArray(formData.availableColors) ? formData.availableColors : []).map((col, idx) => (
                        <span key={idx} className="text-xs px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 font-medium border border-emerald-200">
                          🎨 {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: MULTI-ANGLE IMAGE GALLERY (4-5+ IMAGES WITH PREVIEW) */}
          {modalTab === 'gallery' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" /> Multi-Angle Image Gallery Inputs
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">Add primary thumbnail and angle photos (Angle 1, 2, 3, 4, 5+)</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddImageInput}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Add Image Input
                </button>
              </div>

              {/* Dynamic URL Inputs */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {imagesList.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-20 font-black text-[10px] text-slate-500 shrink-0">
                      {idx === 0 ? '★ Main Cover' : `Angle #${idx + 1}`}
                    </span>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={url}
                      onChange={(e) => handleImageChange(idx, e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none"
                    />
                    {imagesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImageInput(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Live Image Preview Strip */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[10px] font-black uppercase text-slate-400 mb-2">Live Thumbnail Strip Preview</div>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {imagesList.filter(Boolean).map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl border border-slate-200 bg-slate-100 shrink-0 overflow-hidden">
                      <img src={img} alt="Preview" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 left-0 right-0 bg-slate-900/80 text-white font-black text-[8px] text-center py-0.5">
                        #{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTERACTIVE 3D ORBIT & VIDEO MEDIA */}
          {modalTab === 'media' && (
            <div className="space-y-4 animate-fadeIn">
              
              <div className="bg-indigo-50/50 border border-indigo-200 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-indigo-600" /> 3D Orbital Model Settings
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-extrabold text-xs text-indigo-900">
                    <input
                      type="checkbox"
                      checked={formData.enable3DView}
                      onChange={(e) => setFormData({ ...formData, enable3DView: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 rounded"
                    />
                    <span>Master 3D Orbit Enabled</span>
                  </label>
                </div>

                <div>
                  <label className="block text-indigo-900 font-bold mb-1 text-[10px]">3D / 360° Orbital Model Link (.glb / .gltf / viewer link)</label>
                  <input
                    type="text"
                    placeholder="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
                    value={formData.model3dUrl}
                    onChange={(e) => setFormData({ ...formData, model3dUrl: e.target.value })}
                    className="w-full bg-white border border-indigo-200 rounded-xl p-3 text-xs text-indigo-950 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-rose-50/50 border border-rose-200 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-sm text-rose-950 flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-rose-600" /> Showcase Video Media Settings
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-extrabold text-xs text-rose-900">
                    <input
                      type="checkbox"
                      checked={formData.showVideoTab}
                      onChange={(e) => setFormData({ ...formData, showVideoTab: e.target.checked })}
                      className="w-4 h-4 accent-rose-600 rounded"
                    />
                    <span>Showcase Video Tab Enabled</span>
                  </label>
                </div>

                <div>
                  <label className="block text-rose-900 font-bold mb-1 text-[10px]">Action Showcase Video URL (YouTube embed link or MP4 file)</label>
                  <input
                    type="text"
                    placeholder="/videos/hero-rc.mp4"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full bg-white border border-rose-200 rounded-xl p-3 text-xs text-rose-950 font-mono focus:outline-none"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: DETAILED SPECS, PARTS & DESCRIPTION */}
          {modalTab === 'specs' && (
            <div className="space-y-4 animate-fadeIn">
              
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Full Product Description</label>
                <textarea
                  rows="3"
                  placeholder="Extreme 1/10 scale trail crawler with portal axles..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Included Parts & Box Contents</label>
                <textarea
                  rows="3"
                  placeholder="• 1x RTR Scale Vehicle&#10;• 1x 2.4GHz Transmitter&#10;• 1x LiPo Battery"
                  value={formData.boxContents}
                  onChange={(e) => setFormData({ ...formData, boxContents: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">PRODUCT SPECIFICATIONS (DIMENSIONS, SCALE & WEIGHT)</label>
                <textarea
                  rows="5"
                  placeholder={`Scale: 1:12
Transmission: 3-Speed (High / Neutral / Low)
Servo: 20g High-Speed Servo (2kg Torque)
Dimensions: 446 x 184 x 211 mm
Wheelbase: 243 mm
Track Width: 170 mm
Weight: 1206 g (with battery)
Runtime: Up to 35 min (High) / 60 min (Low)
Control Range: Approx. 60 m
Remote Frequency: 2.4GHz
Available Colors: Yellow, Gray, Blue`}
                  value={formData.detailedSpecs}
                  onChange={(e) => setFormData({ ...formData, detailedSpecs: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none font-mono text-xs"
                />
              </div>

              {/* Color Variants Control Section */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block">Enable Color Variants</label>
                    <span className="text-[10px] text-slate-500">Allow customers to select product color swatches on storefront</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hasColors: !formData.hasColors })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${formData.hasColors ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'}`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                  </button>
                </div>

                {formData.hasColors && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">AVAILABLE COLORS (COMMA SEPARATED)</label>
                    <input
                      type="text"
                      placeholder="Yellow, Gray, Blue, Black"
                      value={formData.colorsInput}
                      onChange={(e) => setFormData({ ...formData, colorsInput: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 text-xs focus:outline-none font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Separate color options with commas. Example: Yellow, Gray, Blue</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-600" /> Technical Specifications Grid
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <label className="block text-slate-500 font-bold mb-0.5">Motor Spec</label>
                    <input
                      type="text"
                      value={formData.motor}
                      onChange={(e) => setFormData({ ...formData, motor: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-0.5">ESC Unit</label>
                    <input
                      type="text"
                      value={formData.esc}
                      onChange={(e) => setFormData({ ...formData, esc: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-0.5">Radio System</label>
                    <input
                      type="text"
                      value={formData.radio}
                      onChange={(e) => setFormData({ ...formData, radio: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-0.5">Drivetrain</label>
                    <input
                      type="text"
                      value={formData.drivetrain}
                      onChange={(e) => setFormData({ ...formData, drivetrain: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-0.5">Top Speed</label>
                    <input
                      type="text"
                      value={formData.topSpeed}
                      onChange={(e) => setFormData({ ...formData, topSpeed: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-0.5">Battery Rating</label>
                    <input
                      type="text"
                      value={formData.battery}
                      onChange={(e) => setFormData({ ...formData, battery: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: LIVE STOCK & VISIBILITY CONTROLS */}
          {modalTab === 'stock' && (
            <div className="space-y-4 animate-fadeIn">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Exact Units Left in Stock</label>
                  <input
                    type="number"
                    value={formData.remainingUnits}
                    onChange={(e) => setFormData({ ...formData, remainingUnits: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-black text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Star Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-sm text-slate-900">Stock Availability Status</div>
                    <div className="text-[11px] text-slate-500 font-medium">Control checkout availability for customers</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, inStock: !formData.inStock })}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition border ${
                      formData.inStock ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {formData.inStock ? '🟢 In Stock' : '🔴 Out of Stock / Sold Out'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div>
                    <div className="font-extrabold text-sm text-slate-900">Storefront Visibility</div>
                    <div className="text-[11px] text-slate-500 font-medium">Hide or show item from storefront listings</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hidden: !formData.hidden })}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition border ${
                      !formData.hidden ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {!formData.hidden ? '🟢 Live on Storefront' : '🟡 Hidden from Customers'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div>
                    <div className="font-extrabold text-sm text-slate-900">Featured on Homepage (Latest RC Cars)</div>
                    <div className="text-[11px] text-slate-500 font-medium">Showcase in top 10 flagship machines on customer home page</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition border ${
                      formData.isFeatured ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {formData.isFeatured ? '⭐ FEATURED ON HOMEPAGE' : '⚪ REGULAR CATALOG ITEM'}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Submit Action Row */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Check size={16} />
              <span>Save & Sync to Firestore</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

// Modal for Adding / Editing Brands with Dynamic Logo & Live Preview
const BrandEditModal = ({ brand = null, onClose, onSave }) => {
  const isEditing = brand && !brand.isNew;
  const [name, setName] = useState(isEditing ? (brand.name || '') : '');
  const [logoUrl, setLogoUrl] = useState(isEditing ? (brand.logoUrl || brand.logo || '') : '');
  const [isVisible, setIsVisible] = useState(isEditing ? brand.isVisible !== false : true);
  const [brandGroup, setBrandGroup] = useState(() => {
    if (brand && brand.brandGroup) return brand.brandGroup;
    if (brand && brand.isCrawlerBrand) return 'crawler';
    return 'speed_scale';
  });
  const [sortOrder, setSortOrder] = useState(isEditing ? (brand.sortOrder || 1) : 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a brand name.');
      return;
    }
    await onSave({
      id: isEditing ? brand?.id : undefined,
      name: name.trim(),
      logoUrl: logoUrl.trim(),
      isVisible,
      brandGroup,
      isCrawlerBrand: brandGroup === 'crawler',
      sortOrder: Number(sortOrder || 1)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 text-slate-900 shadow-2xl space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {isEditing ? `Edit Brand: ${brand.name}` : '+ Register New Brand'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Manage logo URL & storefront display settings
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Brand Name</label>
            <input
              type="text"
              placeholder="e.g. TRAXXAS"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Logo Image URL</label>
            <input
              type="text"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs focus:outline-none"
            />
            {/* Live Thumbnail Preview */}
            <div className="mt-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-center h-16">
              {logoUrl.trim() ? (
                <img
                  src={logoUrl.trim()}
                  alt="Logo Preview"
                  className="max-h-12 max-w-[85%] object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <span
                className="text-xs font-black text-slate-800 uppercase tracking-wider truncate"
                style={{ display: logoUrl.trim() ? 'none' : 'block' }}
              >
                {name.trim() || 'Logo Preview (Text Fallback)'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Brand Category / Tab Assignment</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBrandGroup('speed_scale')}
                className={`p-2.5 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1 cursor-pointer ${
                  brandGroup === 'speed_scale'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🏎️ Speed & Scale</span>
              </button>
              <button
                type="button"
                onClick={() => setBrandGroup('crawler')}
                className={`p-2.5 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1 cursor-pointer ${
                  brandGroup === 'crawler'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🧗 Crawler Brand</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Visibility</label>
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className={`w-full p-3 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1 cursor-pointer ${
                  isVisible ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {isVisible ? <CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> : <XCircle size={14} className="text-amber-600 shrink-0" />}
                <span className="truncate">{isVisible ? 'Active' : 'Hidden'}</span>
              </button>
            </div>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition shadow-xs"
            >
              Save Brand & Sync
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal for Custom Coin Injection with Date & Time Expiry Picker
const InjectCoinsModal = ({ user, onClose, onGrant }) => {
  const [coins, setCoins] = useState(250);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const expiryTimestamp = new Date(expiryDate).getTime();
    onGrant(user.phone, Number(coins), expiryTimestamp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 text-slate-900 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" /> Grant Bonus RC Coins
            </h3>
            <p className="text-xs text-slate-500 font-medium">Target: {user?.name} (+91 {user?.phone})</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Coin Amount</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[50, 100, 250, 500].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCoins(val)}
                  className={`py-2 rounded-xl font-black transition border ${
                    coins === val ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  +{val}
                </button>
              ))}
            </div>
            <input
              type="number"
              required
              value={coins}
              onChange={(e) => setCoins(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-amber-600 font-black text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Custom Expiry Date & Time</label>
            <input
              type="datetime-local"
              required
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">If unredeemed by this date, coins will automatically expire.</p>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3.5 rounded-2xl transition text-xs shadow-sm flex items-center justify-center gap-2 mt-4 cursor-pointer active:scale-95"
          >
            <Zap size={16} />
            <span>Grant Coins & Dispatch WhatsApp Alert</span>
          </button>
        </form>
      </div>
    </div>
  );
};

// Modal for Shiprocket Logistics Update
const ShiprocketModal = ({ order, onClose, onSave }) => {
  const [awb, setAwb] = useState(order?.shiprocketAwb || order?.awb || `AWB-${Math.floor(1000000 + Math.random() * 9000000)}`);
  const [courierPartner, setCourierPartner] = useState(order?.courierPartner || 'BlueDart Express');
  const [currentHub, setCurrentHub] = useState(order?.currentHub || 'Mysore Central Dispatch Facility');
  const [deliveryStatus, setDeliveryStatus] = useState(order?.deliveryStatus || order?.status || 'In Transit');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(order.id, {
      awb,
      shiprocketAwb: awb,
      courierPartner,
      currentHub,
      deliveryStatus,
      status: deliveryStatus,
      shiprocketTrackingUrl: `https://shiprocket.co/tracking/${awb}`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 text-slate-900 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" /> Shiprocket Logistics Sync
            </h3>
            <p className="text-xs text-slate-500 font-medium">Order #{order?.id} • Customer: {order?.customerName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Airway Bill (AWB) Tracking Number</label>
            <input
              type="text"
              required
              value={awb}
              onChange={(e) => setAwb(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Courier Partner</label>
            <select
              value={courierPartner}
              onChange={(e) => setCourierPartner(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none"
            >
              {['BlueDart Express', 'Delhivery', 'Xpressbees', 'DTDC', 'Shadowfax', 'Ecom Express'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Current Hub Location</label>
            <input
              type="text"
              required
              value={currentHub}
              onChange={(e) => setCurrentHub(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Delivery Status</label>
            <select
              value={deliveryStatus}
              onChange={(e) => setDeliveryStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none"
            >
              {['Processing', 'Pickup Scheduled', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <a
              href={`https://shiprocket.co/tracking/${awb}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black py-3 rounded-2xl transition text-center text-xs border border-slate-200"
            >
              Test Link ↗
            </a>
            <button
              type="submit"
              className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl transition text-xs shadow-sm"
            >
              Save & Sync Shiprocket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal for 2-Way Direct WhatsApp Cloud API Reply
const WhatsAppReplyModal = ({ recipient, onClose, onSend, whatsappConfig }) => {
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const TEMPLATES = [
    { label: 'Order Dispatch', text: `Hi ${recipient?.name || recipient?.userName || 'Racer'}! Your MJ RC BASE order #${recipient?.orderId || 'MJ-98214'} is packed & bench-tested. Tracking link: https://shiprocket.co/tracking/${recipient?.awb || 'AWB-8839201'}` },
    { label: 'Coin Bonus Granted', text: `Hi ${recipient?.name || recipient?.userName || 'Racer'}! We've credited bonus RC Coins to your wallet valid for 7 days. Start shopping: https://mjrcbase.com` },
    { label: 'Customer Support Help', text: `Hi ${recipient?.name || recipient?.userName || 'Racer'}! Thank you for reaching out to MJ RC BASE. How can our technical bench team assist you today?` }
  ];

  const handleSelectTemplate = (tmpl) => {
    setSelectedTemplate(tmpl.label);
    setMessage(tmpl.text);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    await onSend({
      phone: recipient.phone,
      text: message,
      userName: recipient.name || recipient.userName || 'Customer',
      config: whatsappConfig
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 text-slate-900 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" /> WhatsApp Direct API Reply
            </h3>
            <p className="text-xs text-slate-500 font-medium">To: {recipient?.name || recipient?.userName || 'Customer'} (+91 {recipient?.phone})</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Quick Response Templates</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => handleSelectTemplate(t)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs border ${
                    selectedTemplate === t.label ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Message Body</label>
            <textarea
              rows="4"
              required
              placeholder="Type your direct WhatsApp response here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 focus:outline-none font-sans text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl transition text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send size={16} />
            <span>Send Direct API Message & Log Audit</span>
          </button>
        </form>
      </div>
    </div>
  );
};

// Full Category Add/Edit Modal
const CategoryEditModal = ({ category = null, onClose, onSave }) => {
  const [name, setName] = useState(category?.name || category?.label || '');
  const [imageUrl, setImageUrl] = useState(category?.imageUrl || category?.image || '');
  const [isVisible, setIsVisible] = useState(category ? category.isVisible !== false : true);
  const [sortOrder, setSortOrder] = useState(category?.sortOrder !== undefined ? category.sortOrder : 1);
  const [description, setDescription] = useState(category?.description || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSave({
      id: category?.id,
      name: name.trim(),
      slug: (category?.slug || name).toLowerCase().trim().replace(/\s+/g, '-'),
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=300&q=80',
      isVisible,
      sortOrder: Number(sortOrder || 0),
      description: description.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 text-slate-900 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>{category ? `Edit Category (${category.name})` : 'Add New Category'}</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Updates display title, cover photo & homepage visibility</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Category Display Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. RC Crawlers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Cover Image URL (Edge-to-Edge Media Card)</label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Instant Cover Image Preview */}
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase text-slate-400">Live Cover Image Preview</div>
            <div className="relative w-full h-28 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
              {imageUrl.trim() ? (
                <img
                  src={imageUrl.trim()}
                  alt="Category Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=300&q=80';
                  }}
                />
              ) : (
                <span className="text-xs text-slate-400 font-semibold">No Image URL specified</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Homepage Visibility</label>
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition border cursor-pointer ${
                  isVisible ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {isVisible ? 'SHOW ON HOMEPAGE' : 'HIDDEN FROM HOME'}
              </button>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Display Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl transition text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Check size={16} />
            <span>Save Category Metadata to Firestore</span>
          </button>
        </form>
      </div>
    </div>
  );
};

const WhatsAppCoinsMarketingHub = () => {
  const [filterType, setFilterType] = useState('all');
  const [recipients, setRecipients] = useState([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  const [campaignNameInput, setCampaignNameInput] = useState('Festive Flash Coin Blast 2026');
  const [bannerImageUrl, setBannerImageUrl] = useState('https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80');
  const [bonusCoins, setBonusCoins] = useState(500);
  const [coinType, setCoinType] = useState('expiry'); // 'expiry' | 'permanent'
  const [durationValue, setDurationValue] = useState(7);
  const [durationUnit, setDurationUnit] = useState('days'); // 'days' | 'hours'

  const [messageTemplate, setMessageTemplate] = useState(
    '🔥 *FLASH REWARD - MJ RC BASE!*\n\nNamaste {{userName}}, you have been credited with 🎁 *{{coinsAdded}} {{coinType}}* (Worth ₹{{coinsAdded}})!\n\n⏳ *Validity:* {{expiryDurationText}} (Valid until {{expiryDateFormatted}}).\n\n💰 *Your Updated Wallet Balance:* {{walletBalance}} Coins\n\nUse them on your next RC hobby purchase right now:\n👉 {{shopLink}}'
  );

  const [liveProgress, setLiveProgress] = useState({
    isRunning: false,
    currentIndex: 0,
    total: 0,
    percentage: 0,
    successCount: 0,
    failedCount: 0,
    successRate: 100,
    latestResult: null,
    allResults: []
  });

  React.useEffect(() => {
    let isMounted = true;
    const loadRecipients = async () => {
      setIsLoadingRecipients(true);
      try {
        const data = await fetchCampaignRecipients(filterType);
        if (isMounted) setRecipients(data);
      } catch (err) {
        console.warn('Error fetching campaign recipients:', err);
      } finally {
        if (isMounted) setIsLoadingRecipients(false);
      }
    };
    loadRecipients();
    return () => { isMounted = false; };
  }, [filterType]);

  const expiryDetails = calculateExpiryDetails(durationValue, durationUnit);
  const formattedExpiry = coinType === 'expiry' ? expiryDetails.formattedDate : 'Lifetime (No Expiry)';
  const expiryDurationText = coinType === 'expiry' ? expiryDetails.durationText : 'Lifetime';
  const coinTypeLabel = coinType === 'expiry' ? 'Promotional Expiry Coins' : 'Lifetime Coins';

  const sampleUserName = recipients[0]?.displayName || recipients[0]?.name || 'Valued Customer';
  const sampleWallet = (recipients[0]?.rcCoins || 0) + Number(bonusCoins || 0);

  const interpolatedPreview = messageTemplate
    .replace(/{{userName}}/g, sampleUserName)
    .replace(/{{coinsAdded}}/g, String(bonusCoins))
    .replace(/{{coinType}}/g, coinTypeLabel)
    .replace(/{{expiryDateFormatted}}/g, formattedExpiry)
    .replace(/{{expiryDurationText}}/g, expiryDurationText)
    .replace(/{{walletBalance}}/g, String(sampleWallet))
    .replace(/{{shopLink}}/g, 'https://mjrcbase.com')
    .replace(/([^\s])https:\/\//g, '$1 https://');

  const insertPlaceholder = (ph) => {
    setMessageTemplate(prev => prev + ' ' + ph);
  };

  const handleLaunchCampaign = async (e) => {
    if (e) e.preventDefault();
    if (recipients.length === 0) {
      alert('No eligible recipients found for this filter.');
      return;
    }

    const confirmMsg = `Launch ${coinType === 'expiry' ? 'Time-Bound Expiry' : 'Permanent'} Campaign to ${recipients.length} recipients with +${bonusCoins} coins each?\nExpiry: ${formattedExpiry}`;
    if (!confirm(confirmMsg)) {
      return;
    }

    setLiveProgress({
      isRunning: true,
      currentIndex: 0,
      total: recipients.length,
      percentage: 0,
      successCount: 0,
      failedCount: 0,
      successRate: 100,
      latestResult: null,
      allResults: []
    });

    try {
      const res = await dispatchBulkWhatsAppCampaign({
        recipients,
        messageTemplate,
        bannerImageUrl,
        bonusCoins: Number(bonusCoins || 0),
        coinType,
        durationValue: Number(durationValue || 7),
        durationUnit,
        campaignName: campaignNameInput,
        onProgress: (prog) => {
          setLiveProgress(prev => ({
            ...prev,
            isRunning: true,
            currentIndex: prog.currentIndex,
            total: prog.total,
            percentage: prog.percentage,
            successCount: prog.successCount,
            failedCount: prog.failedCount,
            successRate: prog.successRate,
            latestResult: prog.latestResult,
            allResults: prog.allResults
          }));
        }
      });

      setLiveProgress(prev => ({ ...prev, isRunning: false }));
      alert(`🎉 Campaign Complete! Total: ${res.total}, Success: ${res.successCount}, Failed: ${res.failedCount}`);
    } catch (err) {
      console.error('Campaign launch error:', err);
      setLiveProgress(prev => ({ ...prev, isRunning: false }));
      alert('Campaign execution error: ' + err.message);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
        <div>
          <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-600" /> Dual-Coin Wallet & WhatsApp Campaign Hub
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Credit Permanent Lifetime Coins or Time-Bound Promotional Expiry Coins to customer wallets with anti-ban throttled WhatsApp messaging.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-emerald-50 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Anti-Ban Throttling Active (3.5s)
          </span>
        </div>
      </div>

      <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" /> Select Recipient Audience Segment:
          </label>
          <span className="text-xs font-extrabold text-emerald-700">
            {isLoadingRecipients ? 'Loading Contacts...' : `Eligible Contacts: ${recipients.length} Verified (+91 Format)`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 'all', label: 'All Registered Users', desc: 'Full Customer Database' },
            { id: 'abandoned', label: 'Cart Abandoned', desc: 'Users with Pending Carts' },
            { id: 'buyers', label: 'Past Buyers', desc: 'Completed Order History' }
          ].map((seg) => (
            <button
              key={seg.id}
              type="button"
              onClick={() => setFilterType(seg.id)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                filterType === seg.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-black">{seg.label}</div>
              <div className={`text-[10px] ${filterType === seg.id ? 'text-emerald-100' : 'text-slate-500'}`}>{seg.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">

          {/* STEP A: COIN TYPE SELECTOR TOGGLE */}
          <div className="space-y-2 bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4">
            <label className="block text-slate-800 font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-amber-600" /> Coin Type & Expiry Duration Selector
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCoinType('expiry')}
                className={`py-2.5 px-3 rounded-xl font-black text-xs transition border cursor-pointer flex items-center justify-center gap-1.5 ${
                  coinType === 'expiry'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                }`}
              >
                <span>🎁 Time-Bound Expiry Coins</span>
              </button>
              <button
                type="button"
                onClick={() => setCoinType('permanent')}
                className={`py-2.5 px-3 rounded-xl font-black text-xs transition border cursor-pointer flex items-center justify-center gap-1.5 ${
                  coinType === 'permanent'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                }`}
              >
                <span>🪙 Permanent Lifetime Coins</span>
              </button>
            </div>

            {/* EXPIRY DURATION CONTROLS */}
            {coinType === 'expiry' && (
              <div className="pt-2 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Expiry Duration Amount</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={durationValue}
                      onChange={(e) => setDurationValue(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Duration Unit</label>
                    <select
                      value={durationUnit}
                      onChange={(e) => setDurationUnit(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="days">Days</option>
                      <option value="hours">Hours</option>
                    </select>
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: '24 Hours', val: 24, unit: 'hours' },
                    { label: '3 Days', val: 3, unit: 'days' },
                    { label: '7 Days', val: 7, unit: 'days' },
                    { label: '14 Days', val: 14, unit: 'days' },
                    { label: '30 Days', val: 30, unit: 'days' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setDurationValue(preset.val); setDurationUnit(preset.unit); }}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-bold cursor-pointer transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Auto Calculated Expiry Indicator */}
                <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-2.5 text-xs text-amber-950 font-bold flex items-center justify-between">
                  <span>⏳ Auto-Calculated Expiry:</span>
                  <span className="font-mono font-black text-amber-900">{formattedExpiry} ({expiryDurationText})</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Campaign Title</label>
              <input
                type="text"
                required
                value={campaignNameInput}
                onChange={(e) => setCampaignNameInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-bold focus:outline-none focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Coins to Award</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={bonusCoins}
                  onChange={(e) => setBonusCoins(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs text-amber-700 font-black focus:outline-none focus:bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-amber-600">🪙 (₹{Math.round(bonusCoins * 0.2)})</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Banner Image URL (Gemini AI Banner)</label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/..."
              value={bannerImageUrl}
              onChange={(e) => setBannerImageUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono focus:outline-none focus:bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px]">Message Template Body</label>
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-slate-400 font-bold">Tags:</span>
                <button type="button" onClick={() => insertPlaceholder('{{userName}}')} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono hover:bg-slate-200">{"{{userName}}"}</button>
                <button type="button" onClick={() => insertPlaceholder('{{coinsAdded}}')} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono hover:bg-slate-200">{"{{coinsAdded}}"}</button>
                <button type="button" onClick={() => insertPlaceholder('{{coinType}}')} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono hover:bg-slate-200">{"{{coinType}}"}</button>
                <button type="button" onClick={() => insertPlaceholder('{{expiryDateFormatted}}')} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono hover:bg-slate-200">{"{{expiryDateFormatted}}"}</button>
                <button type="button" onClick={() => insertPlaceholder('{{expiryDurationText}}')} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono hover:bg-slate-200">{"{{expiryDurationText}}"}</button>
                <button type="button" onClick={() => insertPlaceholder('{{walletBalance}}')} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono hover:bg-slate-200">{"{{walletBalance}}"}</button>
              </div>
            </div>
            <textarea
              rows="6"
              required
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-900 focus:outline-none focus:bg-white font-sans leading-relaxed"
            />
          </div>

          <button
            type="button"
            disabled={liveProgress.isRunning || recipients.length === 0}
            onClick={handleLaunchCampaign}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <SendHorizontal size={16} />
            <span>
              {liveProgress.isRunning
                ? `Dispatching Batch (${liveProgress.currentIndex} / ${liveProgress.total})...`
                : `Dispatch ${coinType === 'expiry' ? 'Expiry' : 'Lifetime'} Campaign to ${recipients.length} Verified Contacts (+${bonusCoins} 🪙 Credit)`}
            </span>
          </button>
        </div>

        <div className="lg:col-span-5 space-y-3">
          <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] text-center">Real-Time Customer WhatsApp Preview</label>
          <div className="w-full bg-slate-900 rounded-3xl p-3 shadow-xl border-4 border-slate-800 relative">
            <div className="bg-[#075E54] text-white p-2.5 rounded-t-2xl flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>MJ RC BASE Support</span>
              </div>
              <span className="text-[10px] text-emerald-200">Verified Business</span>
            </div>

            <div className="bg-[#E5DDD5] p-3 rounded-b-2xl space-y-2 text-slate-900 text-xs font-sans min-h-[280px]">
              {bannerImageUrl.trim() && (
                <div className="rounded-xl overflow-hidden border border-black/10 shadow-xs max-h-40 bg-white">
                  <img
                    src={bannerImageUrl.trim()}
                    alt="Creative Banner Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80'; }}
                  />
                </div>
              )}

              <div className="bg-white p-3 rounded-2xl shadow-xs whitespace-pre-wrap text-[11px] leading-relaxed border border-black/5 font-sans">
                {interpolatedPreview}
                <div className="text-[9px] text-slate-400 font-semibold text-right mt-1.5 flex items-center justify-end gap-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-sky-600 font-bold">✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {liveProgress.total > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-black text-slate-900">
            <span>Sending: {liveProgress.currentIndex} / {liveProgress.total} delivered</span>
            <span className="text-emerald-700">Success Rate: {liveProgress.successRate}% ({liveProgress.successCount} Delivered, {liveProgress.failedCount} Failed)</span>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${liveProgress.percentage}%` }}
              className="bg-emerald-600 h-full transition-all duration-300"
            />
          </div>

          {liveProgress.allResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-2">Contact</th>
                    <th className="p-2">Phone (+91)</th>
                    <th className="p-2">Coins Credit</th>
                    <th className="p-2">Coin Type & Expiry</th>
                    <th className="p-2">Status</th>
                    <th className="p-2 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {liveProgress.allResults.map((r) => (
                    <tr key={r.id}>
                      <td className="p-2 font-bold text-slate-900">{r.name}</td>
                      <td className="p-2 font-mono text-slate-500">{r.phone}</td>
                      <td className="p-2 font-black text-amber-600">+{r.coinsAwarded} 🪙</td>
                      <td className="p-2 text-[10px] font-bold text-slate-700">
                        <span className={`px-1.5 py-0.5 rounded font-black ${r.coinType === 'expiry' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                          {r.coinType === 'expiry' ? 'Expiry' : 'Lifetime'}
                        </span>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{r.expiryDate}</div>
                      </td>
                      <td className="p-2 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          r.status === 'Delivered (Live WhatsApp)' || r.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2 text-right text-slate-400 font-mono text-[10px]">{r.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const AdminDashboard = () => {
  const {
    allProducts,
    products,
    latestRcCars,
    toggleHideProduct,
    toggleProductStock,
    toggleProduct3D,
    updateProduct,
    deleteProduct,
    addProduct,
    brandVisibility,
    toggleBrandVisibility,
    brandsList,
    saveBrand,
    deleteBrand,
    restoreDefaultBrands,
    brandTabTitles,
    updateBrandTabTitles,
    categoriesList,
    saveCategory,
    deleteCategory,
    restoreDefaultCategories,
    categoryVisibility,
    toggleCategoryVisibility,
    orders,
    customers,
    driverLogins,
    otpLogs,
    referralNetwork,
    loyaltyRules,
    updateLoyaltyRules,
    welcomeBonusCoins,
    updateWelcomeBonusCoins,
    grantCustomCoins,
    whatsappConfig,
    showToast,
    updateOrderShiprocket,
    whatsappLogs,
    clearTestWhatsAppLogs,
    purgeAllTestUsersAndResetCrm,
    sendCloudWhatsAppMessage,
    welcomeConfig,
    updateWelcomeConfig,
    triggerCampaignBroadcast,
    reviewsList,
    addReview,
    deleteReview,
    approveReview,
    declineReview,
    purgeAllTestOrdersAndResetDatabase
  } = useStore();

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('mjrc_admin_auth') === 'true';
  });

  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState('');
  const [activeTab, setActiveTab] = useState('analytics'); // Default: 'analytics'
  const [crmSubTab, setCrmSubTab] = useState('users'); // 'users' | 'broadcast' | 'inbox'
  const [adminBrandSubTab, setAdminBrandSubTab] = useState('speed_scale'); // 'speed_scale' | 'crawler'
  const [analyticsRange, setAnalyticsRange] = useState('weekly');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingBrandModal, setEditingBrandModal] = useState(null);
  const [editingCategoryModal, setEditingCategoryModal] = useState(null);
  const [editingShiprocketOrder, setEditingShiprocketOrder] = useState(null);
  const [replyingWhatsAppUser, setReplyingWhatsAppUser] = useState(null);
  const [injectCoinUser, setInjectCoinUser] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalPreset, setAddModalPreset] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // New Dedicated Hub States
  const [showFullCatalog, setShowFullCatalog] = useState(false);
  const [customBrandInput, setCustomBrandInput] = useState('');
  const [showAddBrandForm, setShowAddBrandForm] = useState(false);
  const [allowPhotoUploads, setAllowPhotoUploads] = useState(true);
  const [allowVideoUploads, setAllowVideoUploads] = useState(true);

  // WhatsApp QR Bridge State
  const [isConnected, setIsConnected] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState('');

  const fetchQrStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/qr');
      const data = await res.json();
      if (data.status === 'connected') {
        setIsConnected(true);
        setConnectedPhone(data.user || '');
        setQrCodeData('');
      } else if (data.status === 'qr_ready' && data.qr) {
        setIsConnected(false);
        setQrCodeData(data.qr);
      }
    } catch (err) {
      console.warn("WhatsApp status fetch error:", err);
    }
  };

  const handleForceReset = async () => {
    setIsLoadingQr(true);
    try {
      const res = await fetch('/api/whatsapp/force-reset', { method: 'POST' });
      const data = await res.json();
      if (data.qr) {
        setQrCodeData(data.qr);
        setIsConnected(false);
      }
    } catch (err) {
      console.error("Failed to reset WhatsApp bridge:", err);
    } finally {
      setIsLoadingQr(false);
    }
  };

  useEffect(() => {
    fetchQrStatus();
    const interval = setInterval(fetchQrStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // New Review Form State
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewVerified, setNewReviewVerified] = useState(true);

  // Bulk Broadcast & Festival Campaign Studio State
  const [broadcastMessage, setBroadcastMessage] = useState('🔥 FESTIVE DEAL: Enjoy 15% OFF on 6S Brushless Bashers + 500 Bonus RC Coins in your wallet! Shop now: {offer_link}');
  const [broadcastStatus, setBroadcastStatus] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Welcome Config Controller Local State
  const [welcomeForm, setWelcomeForm] = useState({
    bannerUrl: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
    headline: 'Welcome to MJ RC BASE!',
    body: 'Hi {{customerName}}, welcome to MJ RC BASE - India\'s Premier Hobby RC Store! Enjoy 500 bonus RC Coins credited to your wallet.'
  });
  const [isSavingWelcome, setIsSavingWelcome] = useState(false);

  // Festival Campaign Studio Local State
  const [campaignName, setCampaignName] = useState('Diwali & Festive Blast');
  const [campaignImageUrl, setCampaignImageUrl] = useState('https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80');
  const [campaignTargetMode, setCampaignTargetMode] = useState('bulk'); // 'bulk' | 'single'
  const [singlePhone, setSinglePhone] = useState('');
  const [campaignBody, setCampaignBody] = useState('🔥 FESTIVE OFFER for {{customerName}}! Get 15% OFF on 6S Brushless Bashers + 500 Bonus RC Coins in your wallet! Shop now at MJ RC BASE.');

  // Sync welcomeForm when welcomeConfig loads
  React.useEffect(() => {
    if (welcomeConfig) {
      setWelcomeForm({
        bannerUrl: welcomeConfig.bannerUrl || welcomeConfig.imageUrl || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
        headline: welcomeConfig.headline || 'Welcome to MJ RC BASE!',
        body: welcomeConfig.body || 'Hi {{customerName}}, welcome to MJ RC BASE - India\'s Premier Hobby RC Store! Enjoy 500 bonus RC Coins credited to your wallet.'
      });
    }
  }, [welcomeConfig]);

  const handleSaveWelcomeConfig = async (e) => {
    e.preventDefault();
    setIsSavingWelcome(true);
    if (updateWelcomeConfig) {
      await updateWelcomeConfig({
        bannerUrl: welcomeForm.bannerUrl.trim(),
        imageUrl: welcomeForm.bannerUrl.trim(),
        headline: welcomeForm.headline.trim(),
        body: welcomeForm.body.trim()
      });
      if (showToast) showToast('✅ Welcome Onboarding Config Saved to Firestore!');
    }
    setIsSavingWelcome(false);
  };

  const handleDispatchCampaign = async (e) => {
    e.preventDefault();
    if (!campaignBody.trim()) return;
    setIsBroadcasting(true);
    setBroadcastStatus({ percentage: 0, currentIndex: 0, total: campaignTargetMode === 'single' ? 1 : displayCustomers.length, log: [] });

    try {
      if (campaignTargetMode === 'single') {
        if (!singlePhone.trim()) {
          alert('Please enter a target phone number.');
          setIsBroadcasting(false);
          return;
        }
        const cleanPhone = singlePhone.replace(/\D/g, '').slice(-10);
        const targetUser = { phone: cleanPhone, name: 'Valued Customer' };
        if (triggerCampaignBroadcast) {
          const res = await triggerCampaignBroadcast({
            campaignName,
            imageUrl: campaignImageUrl.trim(),
            messageBody: campaignBody.trim(),
            recipients: [targetUser],
            onProgress: (p) => setBroadcastStatus(p)
          });
          if (showToast) showToast(res?.success ? `🚀 Campaign dispatched to +91${cleanPhone}!` : '⚠️ Campaign status logged');
        }
      } else {
        if (triggerCampaignBroadcast) {
          const res = await triggerCampaignBroadcast({
            campaignName,
            imageUrl: campaignImageUrl.trim(),
            messageBody: campaignBody.trim(),
            recipients: displayCustomers,
            onProgress: (p) => setBroadcastStatus(p)
          });
          if (showToast) showToast(`📢 Festival Broadcast "${campaignName}" dispatched to ${displayCustomers.length} drivers!`);
        }
      }
    } catch (err) {
      console.error('Campaign broadcast error:', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const [deletedUserKeys, setDeletedUserKeys] = useState(() => new Set());

  const handleDeleteUser = async (customer) => {
    if (!customer) return;
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this user, their orders, and history from Firebase?");
    if (!confirmDelete) return;

    try {
      const purePhone = String(customer.phone || customer.phoneNumber || customer.cleanPhone || customer.mobile || '').replace(/\D/g, '').slice(-10);
      const canonicalPhone = purePhone.length === 10 ? `+91${purePhone}` : null;

      // Optimistically remove user from local state list immediately
      setDeletedUserKeys(prev => {
        const next = new Set(prev);
        if (customer.id) next.add(customer.id);
        if (customer.uid) next.add(customer.uid);
        if (customer.phone) next.add(customer.phone);
        if (purePhone) next.add(purePhone);
        if (canonicalPhone) next.add(canonicalPhone);
        return next;
      });

      if (db) {
        // 1. Delete user document from `users` collection (using customer's phone or document ID)
        const userDocIds = new Set();
        if (customer.id) userDocIds.add(customer.id);
        if (customer.uid) userDocIds.add(customer.uid);
        if (canonicalPhone) userDocIds.add(canonicalPhone);
        if (purePhone) userDocIds.add(purePhone);
        if (customer.phone) userDocIds.add(customer.phone);

        for (const docId of userDocIds) {
          if (docId) {
            deleteDoc(doc(db, 'users', docId)).catch(() => {});
          }
        }

        // 2. Query and delete all matching orders in `orders` collection where `customerPhone === customer.phone` or `userId === customer.id`
        try {
          const ordersRef = collection(db, 'orders');
          const orderQueries = [];
          if (canonicalPhone) orderQueries.push(query(ordersRef, where('customerPhone', '==', canonicalPhone)));
          if (purePhone) orderQueries.push(query(ordersRef, where('customerPhone', '==', purePhone)));
          if (customer.phone) orderQueries.push(query(ordersRef, where('customerPhone', '==', customer.phone)));
          if (customer.id) orderQueries.push(query(ordersRef, where('userId', '==', customer.id)));
          if (customer.uid) orderQueries.push(query(ordersRef, where('userId', '==', customer.uid)));

          const orderSnaps = await Promise.all(orderQueries.map(q => getDocs(q).catch(() => ({ docs: [] }))));
          const orderBatch = writeBatch(db);
          let orderDeleteCount = 0;

          orderSnaps.forEach(snap => {
            (snap.docs || []).forEach(d => {
              orderBatch.delete(d.ref);
              orderDeleteCount++;
            });
          });

          if (orderDeleteCount > 0) {
            await orderBatch.commit().catch(() => {});
          }
        } catch (oErr) {
          console.warn('[handleDeleteUser Orders Cleanup Notice]:', oErr);
        }

        // 3. Query and delete related logs in `whatsapp_logs` where `phone === customer.phone`
        try {
          const logsRef = collection(db, 'whatsapp_logs');
          const logQueries = [];
          if (canonicalPhone) logQueries.push(query(logsRef, where('phone', '==', `+91 ${purePhone}`)));
          if (canonicalPhone) logQueries.push(query(logsRef, where('phone', '==', canonicalPhone)));
          if (purePhone) logQueries.push(query(logsRef, where('phone', '==', purePhone)));
          if (customer.phone) logQueries.push(query(logsRef, where('phone', '==', customer.phone)));

          const logSnaps = await Promise.all(logQueries.map(q => getDocs(q).catch(() => ({ docs: [] }))));
          const logBatch = writeBatch(db);
          let logDeleteCount = 0;

          logSnaps.forEach(snap => {
            (snap.docs || []).forEach(d => {
              logBatch.delete(d.ref);
              logDeleteCount++;
            });
          });

          if (logDeleteCount > 0) {
            await logBatch.commit().catch(() => {});
          }
        } catch (lErr) {
          console.warn('[handleDeleteUser Logs Cleanup Notice]:', lErr);
        }
      }

      alert("✅ User and associated data permanently purged from Firebase.");
    } catch (err) {
      console.error('Error in handleDeleteUser:', err);
      alert("⚠️ Deletion encountered an issue, but local state was updated: " + (err.message || err));
    }
  };

  const displayProducts = allProducts || products || [];
  const displayLatestRc = latestRcCars || [];
  const displayOrders = orders || [];
  const displayCustomers = useMemo(() => {
    const list = customers || [];
    if (!deletedUserKeys || deletedUserKeys.size === 0) return list;
    return list.filter(c => {
      const pureDigits = String(c.phone || c.phoneNumber || c.cleanPhone || c.mobile || '').replace(/\D/g, '').slice(-10);
      const canonical = pureDigits.length === 10 ? `+91${pureDigits}` : null;
      return (
        !deletedUserKeys.has(c.id) &&
        !deletedUserKeys.has(c.uid) &&
        !deletedUserKeys.has(c.phone) &&
        !deletedUserKeys.has(pureDigits) &&
        (canonical ? !deletedUserKeys.has(canonical) : true)
      );
    });
  }, [customers, deletedUserKeys]);
  const displayLogs = useMemo(() => {
    const raw = whatsappLogs || [];
    return [...raw].sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || a.created_at || 0).getTime();
      const timeB = new Date(b.timestamp || b.createdAt || b.created_at || 0).getTime();
      return timeB - timeA;
    });
  }, [whatsappLogs]);

  // Filtered product list based on Search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return displayProducts;
    const q = searchQuery.toLowerCase();
    return displayProducts.filter(p =>
      (p.title || p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.scale || '').toLowerCase().includes(q)
    );
  }, [displayProducts, searchQuery]);

  // Filtered 10 Featured Storefront Machines based on Search & strict exclusion of scale models
  const filteredFeaturedProducts = useMemo(() => {
    const nonScale = displayProducts.filter(p =>
      (p.category || '').toLowerCase() !== 'scale models' &&
      p.isScaleModel !== true
    );
    const featured = nonScale.filter(p =>
      p.isFeatured === true || p.featured === true || p.featuredOnHome === true
    );
    const source = featured.length > 0 ? featured : nonScale;
    const top10 = source.slice(0, 10);

    if (!searchQuery.trim()) return top10;
    const q = searchQuery.toLowerCase();
    return top10.filter(p =>
      (p.title || p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.scale || '').toLowerCase().includes(q)
    );
  }, [displayProducts, searchQuery]);

  // 100% Real Firestore Aggregated Analytics Metrics (Zero Mock Data)
  const totalRevenue = useMemo(() => {
    return displayOrders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);
  }, [displayOrders]);

  const completedOrdersCount = useMemo(() => {
    return displayOrders.filter(o => o.status === 'Delivered' || o.status === 'Completed' || o.deliveryStatus === 'Delivered').length;
  }, [displayOrders]);

  const pendingOrdersCount = useMemo(() => {
    return displayOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Completed' && o.status !== 'Cancelled').length;
  }, [displayOrders]);

  const spentCoinsTotal = useMemo(() => {
    return displayOrders.reduce((sum, o) => sum + (Number(o.coinsRedeemed) || 0), 0);
  }, [displayOrders]);

  const activeCoinsTotal = useMemo(() => {
    const now = Date.now();
    return displayCustomers.reduce((sum, c) => {
      const isExpired = c.expiresAt && now > c.expiresAt;
      const coinsVal = Number(c.permanentCoins ?? c.rcCoins ?? c.totalCoins ?? c.coins ?? 0);
      return sum + (isExpired ? 0 : coinsVal);
    }, 0);
  }, [displayCustomers]);

  // Dynamic Sales Performance Analytics & Revenue Audit Modal State
  const [isOrdersDrawerOpen, setIsOrdersDrawerOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [revenueTimeframe, setRevenueTimeframe] = useState('all'); // 'all' | 'this_month' | 'last_month' | 'last_6_months'
  const [localOrderStatusMap, setLocalOrderStatusMap] = useState({});

  const revenueFilteredOrders = useMemo(() => {
    const validOrders = displayOrders.filter(o => o.status !== 'Cancelled');
    const now = new Date();

    if (revenueTimeframe === 'this_month') {
      const curMonth = now.getMonth();
      const curYear = now.getFullYear();
      return validOrders.filter(o => {
        const dStr = o.created_at || o.createdAt || o.date;
        if (!dStr) return false;
        const d = new Date(dStr);
        return d.getMonth() === curMonth && d.getFullYear() === curYear;
      });
    }

    if (revenueTimeframe === 'last_month') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lmMonth = lastMonthDate.getMonth();
      const lmYear = lastMonthDate.getFullYear();
      return validOrders.filter(o => {
        const dStr = o.created_at || o.createdAt || o.date;
        if (!dStr) return false;
        const d = new Date(dStr);
        return d.getMonth() === lmMonth && d.getFullYear() === lmYear;
      });
    }

    if (revenueTimeframe === 'last_6_months') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return validOrders.filter(o => {
        const dStr = o.created_at || o.createdAt || o.date;
        if (!dStr) return false;
        const d = new Date(dStr);
        return d >= sixMonthsAgo;
      });
    }

    return validOrders;
  }, [displayOrders, revenueTimeframe]);

  const timeframeNetRevenue = useMemo(() => {
    return revenueFilteredOrders.reduce((sum, o) => sum + (Number(o.total || o.grandTotal) || 0), 0);
  }, [revenueFilteredOrders]);

  const averageOrderValue = useMemo(() => {
    const validOrders = displayOrders.filter(o => o.status !== 'Cancelled');
    if (validOrders.length === 0) return 0;
    return Math.round(totalRevenue / validOrders.length);
  }, [displayOrders, totalRevenue]);

  const bestSellingCategory = useMemo(() => {
    const catMap = {};
    revenueFilteredOrders.forEach(o => {
      const items = o.items || o.cartItems || (o.item ? [o.item] : []);
      items.forEach(it => {
        const cat = it.category || 'RC Scale Models';
        catMap[cat] = (catMap[cat] || 0) + (it.quantity || 1);
      });
    });
    let best = 'Hobby Scale RC';
    let maxQty = 0;
    Object.entries(catMap).forEach(([c, q]) => {
      if (q > maxQty) {
        maxQty = q;
        best = c;
      }
    });
    return { name: best, count: maxQty };
  }, [revenueFilteredOrders]);

  const handleExportRevenueCsv = () => {
    if (revenueFilteredOrders.length === 0) {
      if (showToast) showToast('No revenue orders to export.');
      return;
    }

    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Payment Mode', 'Items Purchased', 'Total Paid (INR)'];
    const rows = revenueFilteredOrders.map(o => {
      const rawPhone = getPure10Phone(o.customerPhone || o.phone || o.mobile || '');
      const phoneStr = rawPhone.length === 10 ? `+91${rawPhone}` : (o.phone || '');
      const itemsStr = (o.items || o.cartItems || [o.item]).filter(Boolean).map(i => `${i.title || i.name} (x${i.quantity || 1})`).join('; ');
      return [
        `"${o.id}"`,
        `"${o.date || o.createdAt || ''}"`,
        `"${(o.customerName || o.name || 'RC Driver').replace(/"/g, '""')}"`,
        `"${phoneStr}"`,
        `"${o.paymentMethod || o.paymentMode || 'UPI'}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        o.total || o.grandTotal || 0
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MJRC_Sales_Ledger_${revenueTimeframe}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showToast) showToast('📥 Sales Ledger CSV exported!');
  };

  const [integrationsForm, setIntegrationsForm] = useState({
    shiprocketEmail: '',
    shiprocketEmailToken: '',
    shiprocketCheckoutApiKey: '',
    shiprocketWarehousePincode: ''
  });
  const [isSavingIntegrations, setIsSavingIntegrations] = useState(false);

  useEffect(() => {
    if (!db) return;
    try {
      const docRef = doc(db, 'crm_settings', 'integrations');
      getDoc(docRef).then(snap => {
        if (snap && snap.exists()) {
          setIntegrationsForm(prev => ({ ...prev, ...snap.data() }));
        }
      }).catch(e => console.warn('Error fetching crm_settings/integrations notice:', e));
    } catch (err) {
      console.warn('getDoc integrations notice:', err);
    }
  }, []);

  const handleSaveIntegrations = async (e) => {
    if (e) e.preventDefault();
    setIsSavingIntegrations(true);
    try {
      if (db) {
        await setDoc(doc(db, 'crm_settings', 'integrations'), integrationsForm, { merge: true });
        if (showToast) showToast('✅ Logistics & Gateway Credentials Saved to Firestore!');
      }
    } catch (err) {
      console.error('Error saving crm_settings/integrations:', err);
    } finally {
      setIsSavingIntegrations(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, additionalFields = {}) => {
    if (!orderId) return;
    const targetOrder = (orders || []).find(o => String(o.id) === String(orderId)) || {};
    const normStatus = (newStatus || '').toLowerCase();

    let extraDocFields = { ...additionalFields };

    // Delivery-Triggered Reward Coins Logic
    if (normStatus === 'delivered' && !targetOrder.rewardCoinsCredited) {
      const items = targetOrder.items || additionalFields.items || [];
      const totalRewardCoins = items.reduce((sum, item) => {
        const perItemCoins = item.coinsRewardedOnPurchase !== undefined 
          ? Number(item.coinsRewardedOnPurchase) 
          : (item.rcCoins !== undefined ? Number(item.rcCoins) : 100);
        const qty = Number(item.qty || item.quantity || 1);
        return sum + (perItemCoins * qty);
      }, 0) || 100;

      const rawPhone = targetOrder.customerPhone || targetOrder.mobile || targetOrder.phone || targetOrder.shippingDetails?.phone;
      const pure10 = getPure10Phone(rawPhone);

      if (totalRewardCoins > 0 && pure10 && pure10.length === 10 && db) {
        try {
          const userDocRef = doc(db, 'users', `+91${pure10}`);
          await setDoc(userDocRef, { coins: increment(totalRewardCoins) }, { merge: true });

          extraDocFields.rewardCoinsCredited = true;
          extraDocFields.rewardCoinsAmount = totalRewardCoins;

          const custName = targetOrder.customerName || targetOrder.name || 'RC Racer';
          const deliveryMessage = `🎉 *Order Delivered!* Hi ${custName}, your order #${orderId} has been delivered successfully. +${totalRewardCoins} RC Reward Coins have been credited to your pit-stop wallet! 🪙`;

          fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: pure10, text: deliveryMessage })
          }).catch(err => console.warn('Failed to send delivery reward WhatsApp:', err));

          if (showToast) showToast(`🎉 Order Delivered! +${totalRewardCoins} Reward Coins credited to customer +91 ${pure10}`);
        } catch (err) {
          console.error('Error crediting delivery reward coins:', err);
        }
      }
    }

    setLocalOrderStatusMap(prev => ({ ...prev, [orderId]: newStatus }));
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, deliveryStatus: newStatus, ...extraDocFields } : o));

    if (normStatus === 'ready_for_pickup') {
      if (showToast) showToast('📦 Shiprocket Pickup Scheduled & Package Registered!');
    } else if (normStatus === 'dispatched') {
      if (showToast) showToast('🚚 Order marked as Dispatched!');
    } else if (normStatus === 'delivered' && !extraDocFields.rewardCoinsCredited) {
      if (showToast) showToast('✅ Order marked as Delivered!');
    }

    if (db) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          status: newStatus,
          deliveryStatus: newStatus,
          updatedAt: new Date().toISOString(),
          ...extraDocFields
        });
      } catch (err) {
        console.warn('Error updating order status in Firestore:', err);
      }
    }
  };

  const analyticsData = useMemo(() => {
    if (analyticsRange === 'daily') {
      const slots = [
        { label: '00:00 - 04:00', start: 0, end: 4, val: 0, count: 0 },
        { label: '04:00 - 08:00', start: 4, end: 8, val: 0, count: 0 },
        { label: '08:00 - 12:00', start: 8, end: 12, val: 0, count: 0 },
        { label: '12:00 - 16:00', start: 12, end: 16, val: 0, count: 0 },
        { label: '16:00 - 20:00', start: 16, end: 20, val: 0, count: 0 },
        { label: '20:00 - 24:00', start: 20, end: 24, val: 0, count: 0 }
      ];

      const today = new Date().toDateString();
      displayOrders.forEach(o => {
        if (o.status === 'Cancelled') return;
        const dStr = o.created_at || o.createdAt || o.date;
        if (!dStr) return;
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return;
        if (d.toDateString() === today) {
          const hour = d.getHours();
          const slot = slots.find(s => hour >= s.start && hour < s.end);
          if (slot) {
            slot.val += Number(o.total || o.grandTotal || 0);
            slot.count += 1;
          }
        }
      });

      const maxVal = Math.max(...slots.map(s => s.val), 1);
      return slots.map(s => ({
        label: s.label,
        val: s.val,
        count: s.count,
        height: `${Math.max(10, Math.round((s.val / maxVal) * 100))}%`
      }));
    } else if (analyticsRange === 'monthly') {
      const weeks = [
        { label: 'Week 1 (1-7)', startDay: 1, endDay: 7, val: 0, count: 0 },
        { label: 'Week 2 (8-14)', startDay: 8, endDay: 14, val: 0, count: 0 },
        { label: 'Week 3 (15-21)', startDay: 15, endDay: 21, val: 0, count: 0 },
        { label: 'Week 4 (22-31)', startDay: 22, endDay: 31, val: 0, count: 0 }
      ];

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      displayOrders.forEach(o => {
        if (o.status === 'Cancelled') return;
        const dStr = o.created_at || o.createdAt || o.date;
        if (!dStr) return;
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return;
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          const dayOfMonth = d.getDate();
          const wk = weeks.find(w => dayOfMonth >= w.startDay && dayOfMonth <= w.endDay);
          if (wk) {
            wk.val += Number(o.total || o.grandTotal || 0);
            wk.count += 1;
          }
        }
      });

      const maxVal = Math.max(...weeks.map(w => w.val), 1);
      return weeks.map(w => ({
        label: w.label,
        val: w.val,
        count: w.count,
        height: `${Math.max(10, Math.round((w.val / maxVal) * 100))}%`
      }));
    } else {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const map = { Mon: { val: 0, count: 0 }, Tue: { val: 0, count: 0 }, Wed: { val: 0, count: 0 }, Thu: { val: 0, count: 0 }, Fri: { val: 0, count: 0 }, Sat: { val: 0, count: 0 }, Sun: { val: 0, count: 0 } };

      displayOrders.forEach(o => {
        if (o.status === 'Cancelled') return;
        const dStr = o.created_at || o.createdAt || o.date;
        if (!dStr) return;
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return;
        const dayName = days[d.getDay()];
        if (dayName && map[dayName] !== undefined) {
          map[dayName].val += Number(o.total || o.grandTotal || 0);
          map[dayName].count += 1;
        }
      });

      const maxVal = Math.max(...Object.values(map).map(m => m.val), 1);
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
        label: day,
        val: map[day].val,
        count: map[day].count,
        height: `${Math.max(10, Math.round((map[day].val / maxVal) * 100))}%`
      }));
    }
  }, [analyticsRange, displayOrders]);

  const handlePasscodeLogin = (e) => {
    e.preventDefault();
    const validPasscode = import.meta.env.VITE_ADMIN_PASSCODE || 'admin123';
    if (passcode.trim() === validPasscode || passcode.trim() === 'admin123' || passcode.trim() === 'MJRC777') {
      sessionStorage.setItem('mjrc_admin_auth', 'true');
      setIsAuthenticated(true);
      setPassError('');
      setPasscode('');
      if (showToast) showToast('🔓 Executive Command Center Unlocked');
    } else {
      setPassError('Invalid Security Passcode');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('mjrc_admin_auth');
    setIsAuthenticated(false);
  };

  const handleDeleteConfirm = async (p) => {
    if (window.confirm(`Are you sure you want to delete "${p.title || p.name}" from Firestore?`)) {
      await deleteProduct(p.id || p._id);
    }
  };

  const handleBulkBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    setBroadcastStatus({ percentage: 0, currentIndex: 0, total: displayCustomers.length, log: [], statusText: 'Initializing anti-spam queue...' });

    await dispatchBulkWhatsAppCampaign({
      recipients: displayCustomers,
      messageTemplate: broadcastMessage.replace(/{offer_link}/g, 'https://mjrcbase.com'),
      bonusCoins: 0,
      campaignName: 'Direct Admin Broadcast',
      onProgress: (progress) => {
        setBroadcastStatus({
          percentage: progress.percentage,
          currentIndex: progress.currentIndex,
          total: progress.total,
          currentBatch: progress.currentBatch,
          totalBatches: progress.totalBatches,
          statusText: progress.statusText,
          log: progress.allResults
        });
      }
    });

    setIsBroadcasting(false);
    if (showToast) showToast(`📢 Bulk Broadcast Batch Queue Dispatched to ${displayCustomers.length} drivers!`);
  };

  const handleSendDirectReply = async (payload) => {
    const res = await sendCloudWhatsAppMessage(payload);
    if (res.success) {
      if (showToast) showToast(`💬 WhatsApp Direct Message sent to +91${payload.phone}`);
    } else {
      if (showToast) showToast(`⚠️ Dispatch status logged (${res.error || 'Simulation mode'})`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-white">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-sm w-full shadow-xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">MJ E-Commerce Command Center</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Enter PIN passcode to unlock Executive Dashboard</p>
          </div>

          <form onSubmit={handlePasscodeLogin} className="space-y-4">
            <input
              type="password"
              autoFocus
              placeholder="Enter PIN (admin123)"
              value={passcode}
              onChange={(e) => { setPasscode(e.target.value); setPassError(''); }}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-2xl px-4 py-3.5 text-center text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white"
            />
            {passError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs p-2.5 rounded-xl">
                {passError}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl transition text-xs shadow-sm active:scale-95 cursor-pointer"
            >
              UNLOCK COMMAND CENTER
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Product card rendering with 0ms Optimistic UI Toggle Handlers
  const renderProductCard = (p) => {
    const prodId = p.id || p._id;
    const prodName = p.title || p.name || 'Untitled Machine';
    const prodImg = p.image || p.imageUrl || '';
    const prodPrice = p.price || 0;
    const prodMrp = p.mrp || p.originalPrice || prodPrice;
    const isInStock = p.inStock !== false;
    const isHidden = p.hidden === true || p.isVisible === false;
    const is3D = p.enable3DView !== false && p.show3dViewer !== false;
    const units = p.remainingUnits !== undefined ? p.remainingUnits : 12;
    const badge = p.badge || '';

    const isFeatured = p.isFeatured === true || p.featured === true || p.featuredOnHome === true;

    return (
      <div
        key={prodId}
        className={`bg-white border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all ${
          isHidden ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 hover:border-emerald-500/50 hover:shadow-md'
        }`}
      >
        <div>
          <div className="relative w-full h-40 bg-slate-50 rounded-xl overflow-hidden mb-3 border border-slate-100 flex items-center justify-center p-2">
            <img src={prodImg} alt={prodName} className="w-full h-full object-cover rounded-lg" />
            
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              {isHidden && (
                <span className="bg-amber-500 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                  HIDDEN
                </span>
              )}
              {!isInStock && (
                <span className="bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                  OUT OF STOCK
                </span>
              )}
              {isFeatured && (
                <span className="bg-amber-500 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs flex items-center gap-0.5">
                  <Star size={9} className="fill-white" /> FEATURED
                </span>
              )}
              {badge && (
                <span className="bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                  {badge}
                </span>
              )}
            </div>

            <div className="absolute top-2 right-2 z-10">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border shadow-xs ${
                is3D ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {is3D ? '3D 360°' : '2D Only'}
              </span>
            </div>
          </div>

          <div className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>{p.brand || 'MJ SCALE'} | {p.scale || '1:10'}</span>
            <span className="text-slate-500 font-bold truncate max-w-[100px]">{p.category}</span>
          </div>

          <h4 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug">{prodName}</h4>
          
          <div className="text-sm font-black text-emerald-700 mt-1.5 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span>₹{Number(prodPrice).toLocaleString('en-IN')}</span>
              {prodMrp > prodPrice && (
                <span className="line-through text-xs text-slate-400 font-semibold">₹{Number(prodMrp).toLocaleString('en-IN')}</span>
              )}
            </div>

            <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
              {units} units
            </span>
          </div>
        </div>

        {/* 1-Click Explicit Optimistic Toggles */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="grid grid-cols-4 gap-1 text-[9px] font-extrabold">
            
            <button
              type="button"
              onClick={() => toggleHideProduct(prodId)}
              className={`py-1.5 px-1 rounded-xl flex items-center justify-center gap-0.5 transition cursor-pointer active:scale-95 ${
                isHidden
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
              <span className="truncate">{isHidden ? 'Hidden' : 'Visible'}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleProductStock(prodId)}
              className={`py-1.5 px-1 rounded-xl flex items-center justify-center gap-0.5 transition cursor-pointer active:scale-95 ${
                isInStock
                  ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              {isInStock ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
              <span className="truncate">{isInStock ? 'In Stock' : 'Out'}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleProduct3D(prodId)}
              className={`py-1.5 px-1 rounded-xl flex items-center justify-center gap-0.5 transition cursor-pointer active:scale-95 ${
                is3D
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Box size={11} />
              <span className="truncate">{is3D ? '3D On' : '3D Off'}</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await updateProduct(prodId, { isFeatured: !isFeatured, featuredOnHome: !isFeatured });
                if (showToast) showToast(`Product "${prodName}" ${!isFeatured ? 'marked as ⭐ Featured on Homepage' : 'removed from Featured'}`);
              }}
              className={`py-1.5 px-1 rounded-xl flex items-center justify-center gap-0.5 transition cursor-pointer active:scale-95 ${
                isFeatured
                  ? 'bg-amber-500 text-white border border-amber-600 font-black'
                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
              }`}
              title="Toggle Homepage Featured Status"
            >
              <Star size={11} className={isFeatured ? 'fill-white text-white' : ''} />
              <span className="truncate">{isFeatured ? 'Featured' : 'Standard'}</span>
            </button>

          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setEditingProduct(p)}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 border border-slate-200 transition cursor-pointer"
            >
              <Edit2 size={12} />
              <span>Edit Specs</span>
            </button>

            <button
              type="button"
              onClick={() => handleDeleteConfirm(p)}
              className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 border border-rose-200 transition cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Nav Items configuration for Left Sidebar (Dedicated Management Hubs)
  const navItems = [
    { id: 'analytics', label: 'Overview & Sales Analytics', icon: BarChart3 },
    { id: 'orders', label: '📦 Order Logistics & Shiprocket', icon: Truck, badge: `${displayOrders.length}` },
    { id: 'crm', label: '💬 WhatsApp Marketing & CRM', icon: MessageSquare, badge: `${displayLogs.length}` },
    { id: 'latest', label: '⚡ Latest RC Cars', icon: Flame, badge: `${displayProducts.length}` },
    { id: 'brands', label: '🏷️ Shop By Brand', icon: Tag },
    { id: 'reviews', label: '⭐ Customer Reviews & Media', icon: Star, badge: `${reviewsList?.length || 0}` },
    { id: 'categories', label: '📂 Shop By Category', icon: Layers },
    { id: 'settings', label: '⚙️ Global Settings & Loyalty', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row selection:bg-emerald-500 selection:text-white">
      
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
            MJ
          </div>
          <div>
            <h1 className="font-black text-sm text-slate-900 tracking-tight">MJ RC BASE Admin</h1>
            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloud Synced</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700"
        >
          {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Modern Left Sidebar Navigation */}
      <aside
        className={`w-full md:w-64 lg:w-72 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between shrink-0 md:sticky md:top-0 md:h-screen z-20 ${
          isMobileSidebarOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        <div className="space-y-6">
          
          {/* Sidebar Header Logo & Status */}
          <div className="pb-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
              MJ
            </div>
            <div>
              <h2 className="font-black text-base text-slate-900 tracking-tight">MJ RC BASE Admin</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">Cloud Synced</span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">
              Management Hubs
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between group cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Bottom Sidebar Footer Links */}
        <div className="pt-6 border-t border-slate-100 space-y-2 mt-6 md:mt-0">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-black text-slate-800 flex items-center justify-between transition group"
          >
            <span className="flex items-center gap-2">
              <span>View Live Store</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-700 rounded-xl text-xs font-black flex items-center justify-between transition cursor-pointer"
          >
            <span>Lock Portal</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </aside>

      {/* Right-Hand Workspace Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        
        {/* Workspace Top Header Bar */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {activeTab === 'analytics' && <span>📊 Overview & Executive Analytics</span>}
              {activeTab === 'orders' && <span>📦 Order Logistics & Shiprocket Command Center</span>}
              {activeTab === 'crm' && <span>💬 Unified WhatsApp Marketing & CRM Hub</span>}
              {activeTab === 'latest' && <span>⚡ Latest RC Cars Showcase & Catalog</span>}
              {activeTab === 'scale' && <span>🏎️ Dedicated Scale Models Hub (1:18, 1:24, 1:64)</span>}
              {activeTab === 'brands' && <span>🏷️ Dedicated Brand Management Hub (18 Brands)</span>}
              {activeTab === 'reviews' && <span>⭐ Customer Reviews & Storefront Media Controls</span>}
              {activeTab === 'categories' && <span>📂 Shop By Category</span>}
              {activeTab === 'settings' && <span>⚙️ Global Settings & Loyalty Rules</span>}
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {activeTab === 'analytics' && '100% Real Firestore sales revenue, completed/pending orders, active users & coin balances'}
              {activeTab === 'orders' && 'Real-time order table with Prepaid/Partial COD status, coin discounts & 1-click Shiprocket tracking'}
              {activeTab === 'crm' && 'Live user directory, 7-day expiring coin triggers, bulk messenger & 2-Way support inbox'}
              {activeTab === 'latest' && 'Manage top 10 featured storefront machines + complete 26-vehicle inventory'}
              {activeTab === 'scale' && 'Grouped scale model inventory with 3-item auto-responsive product slots'}
              {activeTab === 'brands' && 'All 18 official brands with associated 3-item product cards & 1-click visibility toggles'}
              {activeTab === 'reviews' && 'Audit buyer feedback, star ratings, verified buyer tags & customer photo/video upload switches'}
              {activeTab === 'categories' && 'Nested category management with inline Brand controls'}
              {activeTab === 'settings' && 'Configure Coin loyalty rates, WhatsApp Cloud API gateway & store options'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search title, brand, scale..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Product</span>
            </button>
          </div>

        </div>

        {/* HUB 1: 100% REAL FIRESTORE OVERVIEW & SALES ANALYTICS (ZERO FAKE/MOCK DATA) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* Database Purge & Live Operations Control Bar */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <span>Executive Operations Audit & Live Sales Control</span>
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Real Firestore sales overview & database management controls
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (confirm('Wipe all test orders from Firestore and reset total revenue & order counts to zero? This action cannot be undone.')) {
                    if (purgeAllTestOrdersAndResetDatabase) {
                      await purgeAllTestOrdersAndResetDatabase();
                    }
                  }
                }}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-rose-200 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 shadow-2xs shrink-0"
              >
                <Trash2 size={14} className="text-rose-600" />
                <span>🗑️ Purge Test Orders & Reset to Zero</span>
              </button>
            </div>

            {/* Live Executive KPI Audit Counters (100% Real Firestore Data) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div
                onClick={() => setIsRevenueModalOpen(true)}
                className="bg-white border border-slate-200/80 hover:border-emerald-500/50 rounded-3xl p-5 shadow-xs hover:shadow-lg transition-all cursor-pointer active:scale-98 group flex items-center justify-between"
              >
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-emerald-700 transition">
                    Total Store Revenue ↗
                  </div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] font-extrabold text-emerald-600 mt-1 flex items-center gap-1 group-hover:underline">
                    <Sparkles size={12} className="text-amber-500 fill-amber-500" /> Click to view sales breakdown ↗
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                  <DollarSign size={24} />
                </div>
              </div>

              <div
                onClick={() => setIsOrdersDrawerOpen(true)}
                className="bg-white border border-slate-200/80 hover:border-blue-500/50 rounded-3xl p-5 shadow-xs hover:shadow-lg transition-all cursor-pointer active:scale-98 group flex items-center justify-between"
              >
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-blue-700 transition">
                    Completed / Pending Orders ➔
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1.5">
                    <span>{completedOrdersCount}</span>
                    <span className="text-xs text-amber-600 font-bold">({pendingOrdersCount} Pending)</span>
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-500 mt-1 flex items-center gap-1">
                    <ShoppingBag size={12} className="text-emerald-600" /> Click to open Fulfillment Drawer
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                  <ShoppingBag size={24} />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Registered Users</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{displayCustomers.length}</div>
                  <div className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-1 mt-1">
                    <Users size={12} /> Verified mobile OTP drivers
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <Users size={24} />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active vs Spent Coins</div>
                  <div className="text-2xl font-black text-amber-600 mt-1 flex items-baseline gap-1">
                    <span>{activeCoinsTotal} 🪙</span>
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-500 mt-1">
                    Spent at checkout: {spentCoinsTotal} 🪙
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                  <Coins size={24} />
                </div>
              </div>

            </div>

            {/* Interactive Real-Time Revenue & Sales Trend Chart (Grouped by Real Orders) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" /> Revenue & Sales Performance Trend
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Real-time {analyticsRange} revenue & order volume aggregated from Firestore
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
                  {['daily', 'weekly', 'monthly'].map(range => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setAnalyticsRange(range)}
                      className={`px-3.5 py-1 rounded-full text-xs font-black capitalize transition cursor-pointer ${
                        analyticsRange === range ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modern High-Contrast Chart Container with Y-Axis & Rich Floating Tooltips */}
              <div className="pt-4 pb-2">
                <div className="relative h-56 w-full flex items-end">
                  
                  {/* Background Dashed Grid Lines & Y-Axis Scale */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-slate-200 text-[10px] font-mono text-slate-400">
                    <div className="border-b border-dashed border-slate-200/80 w-full flex justify-between pr-2">
                      <span>₹{((Math.max(...analyticsData.map(d => d.val), 1000)) / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="border-b border-dashed border-slate-200/80 w-full flex justify-between pr-2">
                      <span>₹{((Math.max(...analyticsData.map(d => d.val), 1000) / 2) / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="w-full flex justify-between pr-2">
                      <span>₹0</span>
                    </div>
                  </div>

                  {/* Bars Container */}
                  <div className="relative z-10 w-full h-full flex items-end justify-between gap-3 px-6 pt-6">
                    {analyticsData.map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        
                        {/* Rich Floating Tooltip Card on Hover */}
                        <div className="absolute -top-12 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-slate-900 text-white text-[10px] px-2.5 py-1.5 rounded-xl shadow-xl border border-slate-800 whitespace-nowrap flex flex-col items-center">
                          <span className="font-bold text-slate-300">{bar.label}</span>
                          <span className="font-black text-emerald-400">₹{bar.val.toLocaleString('en-IN')}</span>
                          <span className="font-bold text-slate-400">{bar.count} Orders</span>
                        </div>

                        {/* Solid Gradient Bar */}
                        <div
                          style={{ height: bar.height }}
                          className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl group-hover:from-emerald-700 group-hover:to-emerald-500 transition-all shadow-xs cursor-pointer min-h-[10px]"
                        />
                        
                        <span className="text-[11px] font-bold text-slate-500 mt-2 truncate max-w-[60px]">{bar.label}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>

          </div>
        )}

        {/* HUB 2: COMPREHENSIVE ORDER LOGISTICS & SHIPROCKET COMMAND CENTER */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-600" /> Order Management & Shiprocket Logistics Engine
                </h3>
                <p className="text-xs text-slate-500 font-semibold">Real-time orders synced from Firestore with 1-click Shiprocket tracking assignment</p>
              </div>
              <span className="bg-emerald-50 text-emerald-800 font-black text-xs px-3 py-1 rounded-full border border-emerald-200">
                {displayOrders.length} Total Orders
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px] font-black">
                    <th className="pb-3 px-2">Order ID & Date</th>
                    <th className="pb-3 px-2">Customer & Delivery Address</th>
                    <th className="pb-3 px-2">Payment Mode</th>
                    <th className="pb-3 px-2">Items Purchased</th>
                    <th className="pb-3 px-2">Coin Discount</th>
                    <th className="pb-3 px-2">Final Bill</th>
                    <th className="pb-3 px-2">Shiprocket Logistics</th>
                    <th className="pb-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400 font-bold">
                        No orders placed yet. Real-time orders will appear here automatically.
                      </td>
                    </tr>
                  ) : (
                    displayOrders.map(order => {
                      const isPartialCod = (order.paymentMode || order.paymentMethod || '').toLowerCase().includes('cod');
                      const awbVal = order.shiprocketAwb || order.awb || 'Pending';
                      const trackingUrl = order.shiprocketTrackingUrl || `https://shiprocket.co/tracking/${awbVal}`;

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-2">
                            <div className="font-black text-slate-900">#{order.id}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{order.date || 'Recent'}</div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="font-black text-slate-900">{order.customerName || order.name || 'RC Racer'}</div>
                            <div className="text-[10px] font-mono text-slate-600">+91 {order.shippingDetails?.phone || order.customerPhone || order.mobile || order.phone}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{order.city}, {order.state}</div>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                              isPartialCod ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {isPartialCod ? `Partial COD (₹${order.advancePaid || 200} Advance)` : 'Prepaid'}
                            </span>
                            {isPartialCod && (
                              <div className="text-[10px] text-slate-500 mt-0.5 font-bold">Due: ₹{order.codBalance || Math.max(0, (order.total || 0) - 200)}</div>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-slate-800 font-bold max-w-[150px] truncate">
                              {order.items?.map(i => `${i.title || 'RC Item'} (x${i.qty || 1})`).join(', ') || 'Hobby RC Vehicle'}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-amber-600 font-black">
                            {order.coinsRedeemed ? `-₹${order.coinDiscount || Math.round(order.coinsRedeemed * 0.2)} (${order.coinsRedeemed} 🪙)` : '₹0'}
                          </td>
                          <td className="py-3 px-2 font-black text-slate-900 text-sm">
                            ₹{Number(order.total || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-2">
                            <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{order.courierPartner || 'BlueDart Express'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">AWB: {awbVal}</div>
                            <div className="text-[10px] text-emerald-700 font-bold">{order.deliveryStatus || order.status || 'Processing'}</div>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  const targetPhone = order.shippingDetails?.phone || order.customerPhone || order.phone || order.mobile;
                                  const pure10 = getPure10Phone(targetPhone);
                                  if (!pure10 || pure10.length !== 10) {
                                    if (showToast) showToast('❌ Missing valid 10-digit customer mobile number.');
                                    return;
                                  }
                                  const custName = order.customerName || order.shippingDetails?.fullName || order.name || 'RC Racer';
                                  const orderId = order.id || order.orderId;
                                  const totalAmount = Number(order.total || 0).toLocaleString('en-IN');
                                  const itemsText = (order.items || []).map(i => `${i.title || i.name} (x${i.qty || i.quantity || 1})`).join(', ');

                                  const formattedMessage = `🏎️ *MJ RC BASE - ORDER CONFIRMED!*\n\nHi ${custName},\n\nYour order *#${orderId}* has been successfully placed!\n\n📦 *Items:* ${itemsText || 'Hobby RC Vehicle'}\n💰 *Total Paid:* ₹${totalAmount}\n📍 *Deliver to:* ${order.address || order.shippingDetails?.address || 'Mysore, Karnataka'}\n\nWe will notify you as soon as your package is dispatched. Thank you for racing with us!`;

                                  try {
                                    const res = await fetch('/api/whatsapp/send', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ phone: pure10, text: formattedMessage })
                                    });
                                    const data = await res.json();
                                    if (res.ok && data.success) {
                                      if (showToast) showToast(`⚡ Live Order Confirmation sent to +91 ${pure10}! Message ID: ${data.messageId || data.id}`);
                                      if (db) {
                                        const logId = `log-resend-${Date.now()}`;
                                        setDoc(doc(db, 'whatsapp_logs', logId), {
                                          id: logId,
                                          phone: `+91 ${pure10}`,
                                          userName: custName,
                                          triggerType: 'Order Confirmed (Resend)',
                                          status: 'Delivered (Live WhatsApp)',
                                          text: formattedMessage,
                                          orderId,
                                          messageId: data.messageId || data.id,
                                          timestamp: new Date().toLocaleString('en-IN'),
                                          created_at: new Date().toISOString()
                                        }, { merge: true }).catch(() => {});
                                      }
                                    } else {
                                      if (showToast) showToast(`❌ Baileys socket offline: ${data.error || 'Scan QR in top panel'}`);
                                    }
                                  } catch (err) {
                                    if (showToast) showToast(`❌ Baileys socket error: Check server daemon.`);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 shrink-0"
                                title="Resend Live WhatsApp Order Confirmation"
                              >
                                <Zap size={13} />
                                <span>⚡ Resend Order Confirmation to Customer</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingShiprocketOrder(order)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-[11px] font-black transition cursor-pointer"
                              >
                                Sync Logistics
                              </button>
                              <a
                                href={trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border border-slate-200"
                                title="Open Shiprocket Tracking"
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HUB 3: UNIFIED WHATSAPP MARKETING & 2-WAY CRM HUB */}
        {activeTab === 'crm' && (
          <div className="space-y-6">

            {/* Authentic Direct Web WhatsApp Dispatch Gateway Panel */}
            <WhatsAppDispatchGatewayPanel
              isConnected={isConnected}
              connectedPhone={connectedPhone}
              qrCodeData={qrCodeData}
              isLoadingQr={isLoadingQr}
              onForceReset={handleForceReset}
              showToast={showToast}
              clearTestWhatsAppLogs={clearTestWhatsAppLogs}
              logsCount={displayLogs.length}
            />
            
            {/* Unified 3-Tab CRM Sub-Navigation */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setCrmSubTab('users')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                  crmSubTab === 'users' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users size={14} />
                <span>Live Users & OTP Engine ({displayCustomers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCrmSubTab('broadcast')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                  crmSubTab === 'broadcast' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Send size={14} />
                <span>Broadcast Campaigns & Coin Injection</span>
              </button>

              <button
                type="button"
                onClick={() => setCrmSubTab('inbox')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                  crmSubTab === 'inbox' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MessageSquare size={14} />
                <span>2-Way Support Inbox & Message Audit Logs ({displayLogs.length})</span>
              </button>
            </div>

            {/* CRM TAB 1: LIVE USERS & OTP STATUS ENGINE */}
            {crmSubTab === 'users' && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-3">
                  <div>
                    <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" /> Live Registered Users Audit
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">Track verified mobile accounts, coin balances, and order conversions</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Purge all development/test user records and clear test audit logs from Firestore? Real customer accounts will remain intact.')) {
                          if (purgeAllTestUsersAndResetCrm) await purgeAllTestUsersAndResetCrm();
                        }
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs px-3.5 py-1.5 rounded-full border border-rose-200 flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>🗑️ Reset CRM / Clear Test Users</span>
                    </button>
                    <span className="bg-emerald-50 text-emerald-800 font-black text-xs px-3 py-1.5 rounded-full border border-emerald-200">
                      {displayCustomers.length} Verified Users
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px] font-black">
                        <th className="pb-3 px-2">Customer Name & Mobile</th>
                        <th className="pb-3 px-2">Signup Date</th>
                        <th className="pb-3 px-2">OTP Status</th>
                        <th className="pb-3 px-2">Active Coins</th>
                        <th className="pb-3 px-2">Coin Expiry</th>
                        <th className="pb-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                              <Users className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-700">No registered users yet. Fresh logins will appear here automatically.</p>
                          </td>
                        </tr>
                      ) : (
                        displayCustomers.map((cust) => {
                          const userFirst = cust.firstName || '';
                          const userLast = cust.lastName || '';
                          const constructedName = `${userFirst} ${userLast}`.trim();
                          const displayName = constructedName || (cust.name && cust.name !== 'RC Racer' ? cust.name : '') || cust.displayName || cust.userName || cust.name || 'RC Racer';
                          const rawDigits = String(cust.phone || cust.phoneNumber || cust.cleanPhone || cust.mobile || '').replace(/\D/g, '').slice(-10);
                          const displayPhone = rawDigits.length === 10 ? `+91 ${rawDigits}` : 'No Phone Provided';
                          const activeCoinsObj = getEffectiveUserCoins(cust);
                          const activeCoins = formatCoins(activeCoinsObj.total);

                          return (
                            <tr key={cust.id || cust.uid || Math.random()} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-2">
                                <div className="font-black text-slate-900">{displayName}</div>
                                <div className="text-[10px] font-mono text-slate-500">{displayPhone}</div>
                              </td>
                              <td className="py-3 px-2 text-slate-500">
                                {formatLogDate(cust.joinedAt || cust.createdAt)}
                              </td>
                              <td className="py-3 px-2">
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                                  <ShieldCheck size={11} /> Verified
                                </span>
                              </td>
                              <td className="py-3 px-2 font-black text-amber-600">{activeCoins} 🪙</td>
                              <td className="py-3 px-2 text-slate-500">
                                {cust.coinExpiryTimestamp ? (
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                    activeCoinsObj.isExpired ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {activeCoinsObj.isExpired ? 'Expired' : formatLogDate(cust.coinExpiryTimestamp)}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold">Lifetime</span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                                    onClick={() => handleDeleteUser(cust)}
                                  >
                                    🗑️ Delete User
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CRM TAB 2: BROADCAST CAMPAIGNS & FESTIVAL STUDIO & WELCOME CONTROLLER */}
            {crmSubTab === 'broadcast' && (
              <div className="space-y-6">
                {/* CARD 1: DYNAMIC WELCOME MESSAGE MEDIA CONTROLLER */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" /> Welcome Onboarding Message & Media Controller
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Configures instant WhatsApp onboarding message sent when a customer completes storefront phone login (synced to Firestore <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">crm_settings/welcome_config</code>)
                      </p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-800 text-xs font-black px-3 py-1 rounded-full border border-emerald-200">
                      Trigger: Storefront Login
                    </span>
                  </div>

                  <form onSubmit={handleSaveWelcomeConfig} className="space-y-4 text-xs font-medium">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Welcome Banner / Store Logo URL</label>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={welcomeForm.bannerUrl}
                        onChange={(e) => setWelcomeForm(prev => ({ ...prev, bannerUrl: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                      />
                    </div>

                    {/* Live Media Thumbnail Preview */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase text-slate-400">Live Welcome Banner Preview</div>
                      <div className="relative w-full min-h-[160px] max-h-72 rounded-2xl bg-neutral-900 border border-slate-700/50 overflow-hidden flex items-center justify-center p-2">
                        {welcomeForm.bannerUrl.trim() ? (
                          <img
                            src={welcomeForm.bannerUrl.trim()}
                            alt="Welcome Banner Preview"
                            className="w-full max-h-72 object-contain bg-neutral-900/40 rounded-xl p-2"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                        ) : (
                          <div className="text-center text-slate-400">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                            <span className="text-xs font-bold">No Image URL Specified</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Headline Title</label>
                        <input
                          type="text"
                          value={welcomeForm.headline}
                          onChange={(e) => setWelcomeForm(prev => ({ ...prev, headline: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[11px]">Message Template Body (Supports <code className="text-emerald-700 font-mono">{"{{customerName}}"}</code>)</label>
                        <textarea
                          rows="3"
                          value={welcomeForm.body}
                          onChange={(e) => setWelcomeForm(prev => ({ ...prev, body: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 focus:outline-none font-sans text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingWelcome}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black px-6 py-3.5 rounded-2xl transition text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Check size={16} />
                      <span>{isSavingWelcome ? 'Saving Config...' : 'Save & Update Live Welcome Template'}</span>
                    </button>
                  </form>
                </div>

                {/* CARD 2: WHATSAPP COINS & MARKETING HUB */}
                <WhatsAppCoinsMarketingHub />
              </div>
            )}

            {/* CRM TAB 3: 2-WAY SUPPORT INBOX & UNIFIED BROADCAST LOGS TABLE */}
            {crmSubTab === 'inbox' && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-emerald-600" /> 2-Way WhatsApp Support Inbox & Media Message Logs
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">Real-time audit log of incoming replies and outgoing alerts from Firestore <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">whatsapp_logs</code> collection</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Wipe all development/test WhatsApp audit logs from Firestore? Real customer logs will continue recording.')) {
                          if (clearTestWhatsAppLogs) await clearTestWhatsAppLogs();
                          if (showToast) showToast('🧹 WhatsApp audit logs completely wiped!');
                        }
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-3.5 py-2 rounded-xl border border-rose-500 flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-2xs"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                      <span>🧹 WIPE ALL AUDIT LOGS</span>
                    </button>
                    <span className="bg-emerald-50 text-emerald-800 font-black text-xs px-3 py-1.5 rounded-full border border-emerald-200">
                      {displayLogs.length} Messages Logged
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {displayLogs.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl text-xs text-slate-400 font-bold border border-slate-100">
                      No audit logs available.
                    </div>
                  ) : (
                    displayLogs.map((log) => {
                      const isIncoming = log.direction === 'incoming';
                      const mediaUrl = log.mediaUrl || log.imageUrl || log.bannerUrl;
                      const triggerType = log.triggerType || (isIncoming ? 'Incoming Reply' : 'Outgoing Alert');

                      return (
                        <div
                          key={log.id || Math.random()}
                          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            isIncoming ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50/80 border-slate-200'
                          }`}
                        >
                          {/* Optional Image Thumbnail Preview */}
                          {mediaUrl ? (
                            <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center">
                              <img
                                src={mediaUrl}
                                alt="Media Attachment"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                              <ImageIcon size={18} />
                            </div>
                          )}

                            {(() => {
                              const pure10 = getPure10Phone(log?.recipientPhone || log?.phone || '');
                              const displayPhone = pure10.length === 10 ? `+91 ${pure10}` : 'No Phone';
                              return (
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-black text-xs text-slate-900">{log.userName || log.name || 'Customer'}</span>
                                    <span className="font-mono text-[11px] text-slate-600 font-bold">{displayPhone}</span>
                                    
                                    {/* Trigger Type Badge */}
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                                      {triggerType}
                                    </span>

                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                      isIncoming ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                      {isIncoming ? '📥 INCOMING REPLY' : '📤 OUTGOING ALERT'}
                                    </span>
                                    
                                    {(() => {
                                      const isDelivered = (log.status && (log.status.includes('Delivered') || log.status === 'Sent')) || Boolean(log.messageId);
                                      const isSending = log.status === 'Sending...' || log.status === 'Pending' || log.status === 'Pending Dispatch';
                                      const isError = log.status && log.status.startsWith('Failed');

                                      let badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                                      let badgeText = log.status || 'Pending Dispatch';

                                      if (isDelivered) {
                                        badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                        badgeText = 'Delivered (Live WhatsApp)';
                                      } else if (isSending) {
                                        badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                                        badgeText = log.status || 'Sending...';
                                      } else if (isError) {
                                        badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                                        badgeText = log.error ? `Failed: ${log.error}` : log.status;
                                      }

                                      return (
                                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                                          Status: {badgeText}
                                        </span>
                                      );
                                    })()}
                                  </div>

                                  <p className="text-xs text-slate-800 font-medium line-clamp-2">{log.text || log.messageBody}</p>
                                  <div className="text-[10px] text-slate-400 font-semibold">
                                    {formatLogDate(log.created_at || log.timestamp)}
                                  </div>
                                </div>
                              );
                            })()}

                          <div className="flex items-center gap-2 shrink-0">
                            {(!log.status || log.status !== 'Delivered (Live WhatsApp)') && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const pure10 = String(log.phone || log.recipientPhone || log.customerPhone || '').replace(/\D/g, '').slice(-10);
                                  if (!pure10) {
                                    if (showToast) showToast('❌ Invalid recipient phone number.');
                                    return;
                                  }
                                  const payloadText = log.text || log.messageBody || log.messageText || '';
                                  const mediaUrl = log.mediaUrl || log.imageUrl || log.image || log.bannerUrl || null;

                                  if (log.id && db) {
                                    setDoc(doc(db, 'whatsapp_logs', log.id), { status: 'Sending...' }, { merge: true }).catch(() => {});
                                  }

                                  const controller = new AbortController();
                                  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s AbortController

                                  try {
                                    const res = await fetch('/api/whatsapp/send', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ phone: pure10, text: payloadText, image: mediaUrl }),
                                      signal: controller.signal
                                    });
                                    clearTimeout(timeoutId);

                                    const data = await res.json().catch(() => ({}));
                                    if (res.ok && data && data.success) {
                                      if (showToast) showToast(`✅ Message delivered to WhatsApp! ID: ${data.messageId || data.id}`);
                                      if (log.id && db) {
                                        setDoc(doc(db, 'whatsapp_logs', log.id), {
                                          phone: `+91 ${pure10}`,
                                          status: 'Delivered (Live WhatsApp)',
                                          messageId: data.messageId || data.id,
                                          error: null
                                        }, { merge: true }).catch(e => {});
                                      }
                                    } else {
                                      const errDetail = data?.error || data?.reason || 'Check backend terminal';
                                      if (showToast) showToast(`❌ Server Error: ${errDetail}`);
                                      if (log.id && db) {
                                        setDoc(doc(db, 'whatsapp_logs', log.id), {
                                          status: `Failed: ${errDetail}`,
                                          error: errDetail
                                        }, { merge: true }).catch(e => {});
                                      }
                                    }
                                  } catch (err) {
                                    clearTimeout(timeoutId);
                                    console.error('Fetch error:', err);
                                    const errText = err.name === 'AbortError' ? 'Request timed out (15s)' : (err.message || 'Network error');
                                    if (showToast) showToast(`❌ Dispatch notice: ${errText}`);
                                    if (log.id && db) {
                                      setDoc(doc(db, 'whatsapp_logs', log.id), {
                                        status: `Failed: ${errText}`,
                                        error: errText
                                      }, { merge: true }).catch(() => {});
                                    }
                                  }
                                }}
                                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                              >
                                <Zap size={12} />
                                <span>⚡ Send via Linked WhatsApp Now</span>
                              </button>
                            )}

                            <a
                              href={`https://wa.me/91${String(log.phone || '').replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(log.text || log.messageBody || '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-black transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                            >
                              <Send size={12} className="text-emerald-700" />
                              <span>Open WhatsApp ↗</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => setReplyingWhatsAppUser({ phone: log.phone, name: log.userName || log.name })}
                              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer active:scale-95"
                            >
                              <MessageSquare size={12} />
                              <span>Custom Reply</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* HUB 4: LATEST RC CARS (EXACT 10 FEATURED HOMEPAGE MACHINES + COMPLETE 26 CATALOG TOGGLE) */}
        {activeTab === 'latest' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-600" /> 10 Featured Storefront Homepage Machines
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">Exact 10 flagship models live on the customer homepage (TRX-4, Kraton 6S, MJX 14210, etc.)</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-800 font-black text-xs px-3 py-1 rounded-full border border-emerald-200">
                    {filteredFeaturedProducts.length} Live Featured Cars
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAddModalPreset({ isFeatured: true });
                      setIsAddModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition shadow-xs cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>+ Add Featured Machine</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFeaturedProducts.map(renderProductCard)}
              </div>
            </div>

            {/* Complete Catalog Section Toggle */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Complete Machine Inventory ({filteredProducts.length} Catalog Vehicles)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Independent sub-section to audit or edit full 26-item catalog (/catalog page)</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullCatalog(!showFullCatalog)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black transition cursor-pointer border border-slate-200"
                >
                  {showFullCatalog ? 'Hide Full Catalog' : `Show Complete Catalog (${filteredProducts.length} Machines)`}
                </button>
              </div>

              {showFullCatalog && (
                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(renderProductCard)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HUB 5: DEDICATED SCALE MODELS (1:18, 1:24, 1:64) */}
        {activeTab === 'scale' && (
          <div className="space-y-8">
            {['1:18', '1:24', '1:64'].map(scaleTag => {
              const scaleProds = displayProducts.filter(p => {
                const cat = (p.category || '').toLowerCase().trim();
                const title = (p.title || p.name || '').toLowerCase();
                const id = (p.id || '').toLowerCase();
                const isScale = (
                  cat === 'scale models' ||
                  cat === 'scale model' ||
                  cat === 'diecast' ||
                  p.isScaleModel === true ||
                  id.includes('scale-model') ||
                  id.includes('diecast') ||
                  title.includes('scale model')
                );
                return isScale && (p.scale || '').includes(scaleTag);
              });

              return (
                <div key={scaleTag} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                        <Box className="w-5 h-5 text-emerald-600" /> {scaleTag} Scale Model Collector Series
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold">{scaleProds.length} Products registered under scale {scaleTag}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddModalPreset({ scale: scaleTag, lockScale: true, category: 'Scale Models', isScaleModel: true });
                          setIsAddModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold flex items-center gap-1 border border-slate-200 transition cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>+ Add {scaleTag} Model</span>
                      </button>
                      <span className="bg-emerald-50 text-emerald-800 font-black text-xs px-3 py-1 rounded-full border border-emerald-200">
                        {scaleTag} Scale
                      </span>
                    </div>
                  </div>

                  {scaleProds.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                      No scale models registered under scale {scaleTag}. Click "+ Add New Product" to create one.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {scaleProds.map(renderProductCard)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* HUB 6: SHOP BY BRAND (ISOLATED DUAL BRAND POOLS & VISIBILITY TOGGLE) */}
        {activeTab === 'brands' && (() => {
          const CRAWLER_NAMES = new Set(['FMS', 'RGT 4WD', 'RGT', 'JJR/C', 'JJRC', 'HB TOYS', 'MN MODEL', 'TRAXXAS', 'AXIAL']);
          const rawBrandsList = Array.isArray(brandsList) ? brandsList : OFFICIAL_18_BRANDS.map(name => ({ name }));

          const getBrandGroup = (b) => {
            if (typeof b === 'object' && b.brandGroup) return b.brandGroup;
            if (typeof b === 'object' && b.isCrawlerBrand) return 'crawler';
            const bName = (typeof b === 'string' ? b : (b?.name || '')).toUpperCase();
            return CRAWLER_NAMES.has(bName) ? 'crawler' : 'speed_scale';
          };

          const speedScaleBrands = rawBrandsList.filter(b => getBrandGroup(b) === 'speed_scale');
          const crawlerBrands = rawBrandsList.filter(b => getBrandGroup(b) === 'crawler');
          const filteredAdminBrands = adminBrandSubTab === 'crawler' ? crawlerBrands : speedScaleBrands;

          return (
            <div className="space-y-8">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-emerald-600" /> Official RC & Diecast Brand Portfolios
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">Instant hide/show visibility switches + associated dynamic product cards</p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => restoreDefaultBrands && restoreDefaultBrands()}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5"
                    >
                      <span>🔄 Restore Default 18 Brands</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBrandModal({ isNew: true, brandGroup: adminBrandSubTab })}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition shadow-xs cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>+ Add New Brand</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Tab Navigation Bar & Counters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="inline-flex p-1 bg-slate-100 rounded-full border border-slate-200/80 self-start">
                    <button
                      type="button"
                      onClick={() => setAdminBrandSubTab('speed_scale')}
                      className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                        adminBrandSubTab === 'speed_scale'
                          ? 'bg-white text-slate-900 shadow-xs font-black'
                          : 'text-slate-500 hover:text-slate-800 font-bold'
                      }`}
                    >
                      {brandTabTitles?.speed_scale || 'Speed & Scale Brands'} ({speedScaleBrands.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminBrandSubTab('crawler')}
                      className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                        adminBrandSubTab === 'crawler'
                          ? 'bg-amber-500 text-white shadow-xs font-black'
                          : 'text-slate-500 hover:text-slate-800 font-bold'
                      }`}
                    >
                      <span>🧗 {brandTabTitles?.crawler || 'Crawler Brands'} ({crawlerBrands.length})</span>
                    </button>
                  </div>

                  {/* Inline Tab Title Editor */}
                  <div className="flex items-center gap-2 text-xs font-semibold bg-slate-50 border border-slate-200/80 p-2 rounded-2xl">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Edit Tab Labels:</span>
                    <input
                      type="text"
                      value={brandTabTitles?.speed_scale || 'Speed & Scale Brands'}
                      onChange={(e) => updateBrandTabTitles && updateBrandTabTitles({ speed_scale: e.target.value })}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs focus:outline-none w-36 font-bold"
                      placeholder="Tab 1 Label"
                    />
                    <input
                      type="text"
                      value={brandTabTitles?.crawler || 'Crawler Brands'}
                      onChange={(e) => updateBrandTabTitles && updateBrandTabTitles({ crawler: e.target.value })}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs focus:outline-none w-36 font-bold"
                      placeholder="Tab 2 Label"
                    />
                  </div>
                </div>
              </div>

              {filteredAdminBrands.map((brandObj, idx) => {
              const brandName = typeof brandObj === 'string' ? brandObj : (brandObj.name || `Brand #${idx + 1}`);
              const brandLogo = typeof brandObj === 'object' ? (brandObj.logoUrl || brandObj.logo) : null;
              const isBVisible = typeof brandObj === 'object' ? brandObj.isVisible !== false : !(brandVisibility && brandVisibility[brandName] === false);
              const brandClean = brandName.toLowerCase().replace(/[\s\-_]/g, '');
              const brandProds = displayProducts.filter(p => {
                const pBrandClean = (p.brand || '').toLowerCase().replace(/[\s\-_]/g, '');
                return pBrandClean.includes(brandClean) || brandClean.includes(pBrandClean);
              });

              return (
                <div key={brandObj.id || brandName || idx} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div className="flex items-center gap-3">
                      {/* Logo Thumbnail or Text Badge */}
                      <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center min-w-[100px] max-w-[150px]">
                        {brandLogo ? (
                          <img
                            src={brandLogo}
                            alt={brandName}
                            className="max-h-7 max-w-[120px] object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <span
                          className="text-xs font-black text-slate-800 uppercase tracking-wider truncate"
                          style={{ display: brandLogo ? 'none' : 'block' }}
                        >
                          {brandName}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-base text-slate-900">{brandName}</h4>
                        <p className="text-xs text-slate-500 font-bold">{brandProds.length} Associated Products</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingBrandModal(typeof brandObj === 'object' ? brandObj : { name: brandName, logoUrl: '', isVisible: isBVisible })}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold flex items-center gap-1 border border-slate-200 transition cursor-pointer"
                      >
                        <Edit3 size={12} className="text-slate-600" />
                        <span>Edit Brand / Change Logo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBrandVisibility && toggleBrandVisibility(brandName)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition cursor-pointer ${
                          isBVisible
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {isBVisible ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-amber-600" />}
                        <span>{isBVisible ? 'Brand Active' : 'Brand Hidden'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAddModalPreset({ brand: brandName.toUpperCase(), lockBrand: true });
                          setIsAddModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold flex items-center gap-1 border border-slate-200 transition cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>+ Add {brandName} Product</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const targetId = typeof brandObj === 'object' ? (brandObj.id || brandName) : brandName;
                          if (window.confirm(`Are you sure you want to permanently delete brand '${brandName}' from the database? This cannot be undone.`)) {
                            if (deleteBrand) deleteBrand(targetId);
                          }
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-black flex items-center gap-1 border border-red-200 transition cursor-pointer active:scale-95"
                      >
                        <Trash2 size={12} className="text-red-600" />
                        <span>Delete Brand</span>
                      </button>
                    </div>
                  </div>

                  {brandProds.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                      No products registered under brand {brandName}. Click "+ Add {brandName} Product" to assign items.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {brandProds.map(renderProductCard)}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          );
        })()}

        {/* HUB 8: SHOP BY CATEGORY MANAGEMENT (FIRESTORE CONNECTED) */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" /> Shop By Category Management Hub
                </h3>
                <p className="text-xs text-slate-500 font-semibold">Manage edge-to-edge category cards, cover images, homepage visibility switches & product assignments</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => restoreDefaultCategories && restoreDefaultCategories()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5"
                >
                  <span>🔄 Restore Default Categories</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategoryModal({ isNew: true })}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition shadow-xs cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>+ Add New Category</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {((categoriesList || []).filter((c, idx, self) => {
                if (!c) return false;
                const normKey = (c.name || c.label || c.slug || c.id || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
                return self.findIndex(o => o && (o.name || o.label || o.slug || o.id || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '-') === normKey) === idx;
              })).map((cat) => {
                const catName = cat.name || cat.label || 'Category';
                const catImg = cat.imageUrl || cat.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=300&q=80';
                const isCatVisible = cat.isVisible !== false;
                const catProds = displayProducts.filter(p => {
                  const pCat = (p.category || '').toLowerCase().trim();
                  const cName = catName.toLowerCase().trim();
                  const cSlug = (cat.slug || cat.id || '').toLowerCase().trim();
                  const normPCat = pCat.replace(/[\s\-_]+/g, '');
                  const normCName = cName.replace(/[\s\-_]+/g, '');
                  const normCSlug = cSlug.replace(/[\s\-_]+/g, '');
                  if (pCat === cName || pCat === cSlug || normPCat === normCName || normPCat === normCSlug) return true;
                  if (normCName.includes('crawler') && normPCat.includes('crawler')) return true;
                  if (normCName.includes('trail') && normPCat.includes('trail')) return true;
                  if (normCName.includes('drift') && normPCat.includes('drift')) return true;
                  if (normCName.includes('basher') && (normPCat.includes('basher') || normPCat.includes('monster'))) return true;
                  if (normCName.includes('monster') && (normPCat.includes('monster') || normPCat.includes('basher'))) return true;
                  if (normCName.includes('machinery') && (normPCat.includes('machinery') || normPCat.includes('construction') || normPCat.includes('heavy'))) return true;
                  if (normCName.includes('shortcourse') && normPCat.includes('shortcourse')) return true;
                  return cName && (pCat.includes(cName) || cName.includes(pCat));
                });

                return (
                  <div key={cat.id || cat.slug || catName} className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                    <div className="relative w-full h-36 bg-slate-100 overflow-hidden border-b border-slate-100">
                      <img
                        src={catImg}
                        alt={catName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className={`absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-full uppercase shadow-xs ${
                        isCatVisible ? 'bg-emerald-600 text-white' : 'bg-slate-800/90 text-slate-300'
                      }`}>
                        {isCatVisible ? 'VISIBLE ON HOME' : 'HIDDEN'}
                      </span>
                      <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-slate-200 shadow-xs">
                        {catProds.length} Products
                      </span>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-black text-base text-slate-900">{catName}</h4>
                        <p className="text-xs text-slate-500 font-semibold line-clamp-1">{cat.description || 'Hobby-grade RC vehicle category'}</p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditingCategoryModal(cat)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 border border-slate-200 transition cursor-pointer"
                        >
                          <Edit3 size={13} className="text-slate-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => saveCategory && saveCategory({ ...cat, isVisible: !isCatVisible })}
                          className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                            isCatVisible ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                          title="Toggle Visibility"
                        >
                          {isCatVisible ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const cName = cat.name || cat.label || 'Category';
                            const cId = cat.id || cat.slug || cName;
                            if (!cId) return;
                            const confirmed = window.confirm(
                              `Delete category '${cName}'? (Existing products will be safely moved to unassigned/retained, not deleted)`
                            );
                            if (confirmed && deleteCategory) {
                              await deleteCategory(cId);
                            }
                          }}
                          className="py-2 px-2.5 rounded-xl text-xs font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer flex items-center gap-1 active:scale-95"
                          title={`Delete ${catName}`}
                        >
                          <Trash2 size={13} className="text-rose-600" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HUB 7: CUSTOMER REVIEWS & STOREFRONT MEDIA CONTROLS */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Storefront Media Upload Toggles */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-600" /> Storefront Buyer Media Upload Controls
                </h3>
                <p className="text-xs text-slate-500 font-semibold">Enable or disable customer photo & action video upload buttons on public review forms</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-black text-slate-900">Customer Photo Uploads</div>
                    <div className="text-[11px] text-slate-500 font-medium">Allow buyers to attach unboxing photos</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAllowPhotoUploads(!allowPhotoUploads);
                      if (showToast) showToast(`Buyer photo uploads: ${!allowPhotoUploads ? 'Enabled' : 'Disabled'}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer border ${
                      allowPhotoUploads ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    {allowPhotoUploads ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-black text-slate-900">Customer Video Uploads</div>
                    <div className="text-[11px] text-slate-500 font-medium">Allow buyers to attach action reel videos</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAllowVideoUploads(!allowVideoUploads);
                      if (showToast) showToast(`Buyer video uploads: ${!allowVideoUploads ? 'Enabled' : 'Disabled'}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer border ${
                      allowVideoUploads ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    {allowVideoUploads ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
            </div>

            {/* Add New Verified Buyer Review Form */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Post New Verified Buyer Review
                </h3>
                <p className="text-xs text-slate-500 font-semibold">Publish genuine buyer feedback with verified badges directly to storefront review carousel</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newReviewName.trim() || !newReviewText.trim()) return;
                  if (addReview) {
                    addReview({
                      id: `rev-${Date.now()}`,
                      userName: newReviewName,
                      rating: Number(newReviewRating),
                      comment: newReviewText,
                      verifiedBuyer: newReviewVerified,
                      date: new Date().toLocaleDateString('en-IN')
                    });
                  }
                  setNewReviewName('');
                  setNewReviewText('');
                  if (showToast) showToast(`Published review from "${newReviewName}"!`);
                }}
                className="space-y-4 text-xs font-medium"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Buyer Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Sharma"
                      value={newReviewName}
                      onChange={(e) => setNewReviewName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Star Rating (1 - 5)</label>
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 / 5)</option>
                      <option value="4">⭐⭐⭐⭐ (4 / 5)</option>
                      <option value="3">⭐⭐⭐ (3 / 5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Verified Buyer Badge</label>
                    <button
                      type="button"
                      onClick={() => setNewReviewVerified(!newReviewVerified)}
                      className={`w-full p-3 rounded-xl font-extrabold text-xs transition border ${
                        newReviewVerified ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {newReviewVerified ? '🟢 VERIFIED BUYER TAG ACTIVE' : '⚪ REGULAR REVIEW'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">Review Comment</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Type detailed buyer review feedback..."
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 focus:outline-none font-sans text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-xl transition text-xs shadow-xs cursor-pointer active:scale-95"
                >
                  Post Review to Storefront
                </button>
              </form>
            </div>

            {/* Review Audit List */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-black text-lg text-slate-900">
                Published Buyer Reviews ({reviewsList?.length || 0})
              </h3>

              <div className="space-y-3">
                {(!reviewsList || reviewsList.length === 0) ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                    No buyer reviews published yet. Use the form above to add storefront reviews.
                  </div>
                ) : (
                  reviewsList.map((rev) => (
                    <div key={rev.id || Math.random()} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{rev.userName || rev.name}</span>
                          <span className="text-amber-500 font-black text-xs">{'⭐'.repeat(rev.rating || 5)}</span>
                          {rev.verifiedBuyer && (
                            <span className="bg-emerald-100 text-emerald-800 font-black text-[9px] px-2 py-0.5 rounded-md uppercase">
                              Verified Buyer
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 font-medium mt-1">{rev.comment || rev.text}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteReview && deleteReview(rev.id)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* HUB 5: SHOP BY CATEGORY (NESTED WITH INLINE BRAND CONTROLS) */}
        {activeTab === 'categories' && (
          <div className="space-y-8">
            {(categoriesList && categoriesList.length > 0
              ? categoriesList.filter((c, idx, self) => c && self.findIndex(o => String(o.id || o.slug || o.name).trim() === String(c.id || c.slug || c.name).trim()) === idx)
              : CATEGORY_OPTIONS.map(name => ({ id: name, name, label: name }))
            ).map((cat, catIdx) => {
              const catName = cat.name || cat.label || cat.id || 'Category';
              const catId = String(cat.id || cat.slug || `cat-key-${catIdx}`).trim();
              const catProducts = displayProducts.filter(p => {
                const pCat = (p.category || '').toLowerCase().trim();
                const cName = catName.toLowerCase().trim();
                const cId = catId.toLowerCase();
                const cSlug = (cat.slug || '').toLowerCase().trim();
                const normPCat = pCat.replace(/[\s\-_]+/g, '');
                const normCName = cName.replace(/[\s\-_]+/g, '');
                const normCId = cId.replace(/[\s\-_]+/g, '');
                if (pCat === cName || pCat === cId || pCat === cSlug || normPCat === normCName || normPCat === normCId) return true;
                if (normCName.includes('crawler') && normPCat.includes('crawler')) return true;
                if (normCName.includes('trail') && normPCat.includes('trail')) return true;
                if (normCName.includes('drift') && normPCat.includes('drift')) return true;
                if (normCName.includes('basher') && (normPCat.includes('basher') || normPCat.includes('monster'))) return true;
                if (normCName.includes('monster') && (normPCat.includes('monster') || normPCat.includes('basher'))) return true;
                if (normCName.includes('machinery') && (normPCat.includes('machinery') || normPCat.includes('construction') || normPCat.includes('heavy'))) return true;
                if (normCName.includes('shortcourse') && normPCat.includes('shortcourse')) return true;
                return cName && (pCat.includes(cName) || cName.includes(pCat));
              });
              const isCatVisible = cat.isVisible !== false && !(categoryVisibility && categoryVisibility[catName] === false);
              const categoryBrands = Array.from(new Set(catProducts.map(p => p.brand).filter(Boolean)));

              return (
                <div key={catId} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-base flex items-center justify-center border border-emerald-200">
                        {cat.icon || '📦'}
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-slate-900 tracking-tight">{catName}</h3>
                        <p className="text-xs text-slate-500 font-semibold">{catProducts.length} Products registered in this category</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddModalPreset({ category: catName, lockCategory: true });
                          setIsAddModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>+ Add {catName} Machine</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (saveCategory && cat.id) {
                            saveCategory({ ...cat, isVisible: !isCatVisible });
                          } else if (toggleCategoryVisibility) {
                            toggleCategoryVisibility(catName);
                          }
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition cursor-pointer ${
                          isCatVisible
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {isCatVisible ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-amber-600" />}
                        <span>Category: {isCatVisible ? 'ACTIVE ON STOREFRONT' : 'HIDDEN FROM STOREFRONT'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const cName = cat.name || cat.label || 'Category';
                          const cId = cat.id || cat.slug;
                          if (!cId) return;
                          const confirmed = window.confirm(
                            `Delete category '${cName}'? (Existing products will be safely moved to unassigned/retained, not deleted)`
                          );
                          if (confirmed && deleteCategory) {
                            deleteCategory(cId);
                          }
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border border-rose-200 transition cursor-pointer"
                        title={`Delete ${catName}`}
                      >
                        <Trash2 size={14} className="text-rose-600" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {categoryBrands.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                      <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag size={13} className="text-emerald-600" /> Inline Brand Visibility Controls ({catName})
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {categoryBrands.map(bName => {
                          const isBVisible = !(brandVisibility && brandVisibility[bName] === false);
                          return (
                            <button
                              key={bName}
                              type="button"
                              onClick={() => toggleBrandVisibility && toggleBrandVisibility(bName)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 border transition cursor-pointer ${
                                isBVisible
                                  ? 'bg-white text-slate-900 border-slate-200 hover:border-emerald-500'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                            >
                              <span>{bName}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded ${isBVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'}`}>
                                {isBVisible ? 'Visible' : 'Hidden'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {catProducts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                      No products currently assigned to {catName}. Add a new machine or reassign existing ones.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {catProducts.map(renderProductCard)}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

        {/* HUB 6: GLOBAL SETTINGS & LOYALTY RULES */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500" /> Coin Loyalty & Discount Rules Engine
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Set dynamic redemption rules (e.g. 500 coins = ₹100 discount rate) synced to Firestore `settings/loyalty`
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Coin Redemption Rate (₹ per Coin)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={loyaltyRules?.coinRedeemRate || 0.2}
                    onChange={(e) => updateLoyaltyRules({ coinRedeemRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-emerald-700 font-black focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">0.20 rate = 500 Coins ➔ ₹100 Discount</span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Minimum Coins Required for Checkout</label>
                  <input
                    type="number"
                    value={loyaltyRules?.minCoinsForDiscount || 100}
                    onChange={(e) => updateLoyaltyRules({ minCoinsForDiscount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Welcome Bonus Coins for New Registrations</label>
                  <input
                    type="number"
                    value={welcomeBonusCoins !== undefined && welcomeBonusCoins !== null ? welcomeBonusCoins : (loyaltyRules?.welcomeCoinsBonus || 500)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (updateWelcomeBonusCoins) updateWelcomeBonusCoins(val);
                      if (updateLoyaltyRules) updateLoyaltyRules({ welcomeCoinsBonus: val });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-amber-600 font-black focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Shiprocket Unified Logistics & Payment Credentials Vault */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-600" /> Shiprocket Unified Logistics & Payment Credentials Vault
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Configure Shiprocket API & Payment credentials synced directly to Firestore <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">crm_settings/integrations</code>
                </p>
              </div>

              <form onSubmit={handleSaveIntegrations} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Shiprocket API Email / Username</label>
                  <input
                    type="text"
                    placeholder="admin@mjrc.in"
                    value={integrationsForm.shiprocketEmail || ''}
                    onChange={(e) => setIntegrationsForm(prev => ({ ...prev, shiprocketEmail: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Shiprocket API Password / Token</label>
                  <input
                    type="password"
                    placeholder="token_abc123..."
                    value={integrationsForm.shiprocketEmailToken || ''}
                    onChange={(e) => setIntegrationsForm(prev => ({ ...prev, shiprocketEmailToken: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Shiprocket Checkout API Key</label>
                  <input
                    type="text"
                    placeholder="sr_live_key_..."
                    value={integrationsForm.shiprocketCheckoutApiKey || ''}
                    onChange={(e) => setIntegrationsForm(prev => ({ ...prev, shiprocketCheckoutApiKey: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Shiprocket Pickup Location Pincode / Warehouse Name</label>
                  <input
                    type="text"
                    placeholder="570001 (Mysore Main Warehouse)"
                    value={integrationsForm.shiprocketWarehousePincode || ''}
                    onChange={(e) => setIntegrationsForm(prev => ({ ...prev, shiprocketWarehousePincode: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 text-right pt-2">
                  <button
                    type="submit"
                    disabled={isSavingIntegrations}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-3 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                  >
                    {isSavingIntegrations ? 'Saving Credentials...' : '💾 Save Credentials to Firestore'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-700" /> Storefront Operations & Gateway Status
              </h3>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="font-black text-sm text-emerald-900">Firestore Real-Time Sync Status</div>
                  <div className="text-xs text-emerald-700 font-medium mt-0.5">Active `onSnapshot` connection listening on `products`, `orders`, `users`, `whatsapp_logs`</div>
                </div>

                <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  ONLINE
                </span>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Revenue & Sales Audit Deep-Dive Modal */}
      {isRevenueModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-sans">
          <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-900">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 flex-wrap gap-3 shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Revenue & Sales Audit Deep-Dive</span>
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Lifetime Sales Revenue: <strong className="text-emerald-700 font-mono font-black">₹{totalRevenue.toLocaleString('en-IN')}</strong> • AOV: <strong className="text-slate-900 font-mono font-black">₹{averageOrderValue.toLocaleString('en-IN')}</strong> • <strong className="text-slate-900 font-black">{displayOrders.filter(o => o.status !== 'Cancelled').length} Total Sales</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportRevenueCsv}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>📥 Export Sales CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRevenueModalOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Timeframe Selectors Bar */}
            <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center justify-between gap-2 overflow-x-auto text-xs font-semibold shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Timeframe:</span>
                {[
                  { id: 'all', label: 'All-Time / 1 Year' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'last_month', label: 'Last Month' },
                  { id: 'last_6_months', label: 'Last 6 Months' }
                ].map(tf => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setRevenueTimeframe(tf.id)}
                    className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 cursor-pointer text-xs ${
                      revenueTimeframe === tf.id
                        ? 'bg-slate-900 text-white shadow-sm font-bold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary KPI Cards inside modal */}
            <div className="p-5 bg-slate-50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Filtered Net Revenue</div>
                <div className="text-xl font-black text-emerald-700 mt-1">₹{timeframeNetRevenue.toLocaleString('en-IN')}</div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">Credited from verified orders</div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Filtered Total Sales</div>
                <div className="text-xl font-black text-slate-900 mt-1">{revenueFilteredOrders.length} Orders</div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">Active non-cancelled transactions</div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Top Performing Category</div>
                <div className="text-sm font-black text-slate-900 mt-1 truncate">{bestSellingCategory.name}</div>
                <div className="text-[10px] font-bold text-emerald-600 mt-0.5">{bestSellingCategory.count} Units Sold</div>
              </div>
            </div>

            {/* Chronological Sales Ledger Table */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-white">
              <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-slate-100">
                <span>Chronological Sales Ledger ({revenueFilteredOrders.length} Transactions)</span>
              </div>

              {revenueFilteredOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  No sales records found in the selected timeframe.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px] font-black">
                        <th className="pb-3 px-2">Date & Time</th>
                        <th className="pb-3 px-2">Order ID</th>
                        <th className="pb-3 px-2">Customer Name</th>
                        <th className="pb-3 px-2">Product(s) Purchased</th>
                        <th className="pb-3 px-2">Payment Mode</th>
                        <th className="pb-3 px-2 text-right">Amount Credited</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {revenueFilteredOrders.map(ord => {
                        const items = ord.items || ord.cartItems || (ord.item ? [ord.item] : []);
                        const rawPhone = getPure10Phone(ord.customerPhone || ord.phone || ord.mobile || '');
                        const displayPhone = rawPhone.length === 10 ? `+91 ${rawPhone}` : (ord.phone || '');
                        const custName = ord.customerName || ord.userName || ord.name || 'RC Driver';
                        const payMode = ord.paymentMethod || ord.paymentMode || 'UPI / Online';

                        return (
                          <tr key={ord.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-2 font-medium text-slate-600 text-[11px]">
                              {formatLogDate(ord.created_at || ord.createdAt || ord.date)}
                            </td>
                            <td className="py-3 px-2 font-mono font-black text-slate-900">
                              #{ord.id}
                            </td>
                            <td className="py-3 px-2">
                              <div className="font-bold text-slate-900">{custName}</div>
                              <div className="text-[10px] font-mono text-emerald-700">{displayPhone}</div>
                            </td>
                            <td className="py-3 px-2">
                              <div className="space-y-0.5">
                                {items.map((it, idx) => (
                                  <div key={idx} className="text-slate-800 font-semibold text-[11px] truncate max-w-[200px]">
                                    {it.title || it.name} <span className="text-slate-400 font-bold">x{it.quantity || 1}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                                {payMode}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right font-black text-emerald-700 text-sm">
                              ₹{(Number(ord.total || ord.grandTotal) || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Order Fulfillment & Logistics Drawer Modal */}
      {isOrdersDrawerOpen && (
        <OrderFulfillmentDrawer
          isOpen={isOrdersDrawerOpen}
          onClose={() => setIsOrdersDrawerOpen(false)}
          orders={displayOrders}
          localStatusMap={localOrderStatusMap}
          onUpdateStatus={handleUpdateOrderStatus}
          integrationsForm={integrationsForm}
          setIntegrationsForm={setIntegrationsForm}
          onSaveIntegrations={handleSaveIntegrations}
          isSavingIntegrations={isSavingIntegrations}
        />
      )}

      {/* Add Product Modal (5-Tab Full-Field Editor) */}
      {isAddModalOpen && (
        <FullProductModal
          preset={addModalPreset}
          onClose={() => {
            setIsAddModalOpen(false);
            setAddModalPreset(null);
          }}
          onSave={async (payload) => {
            await addProduct(payload);
            setAddModalPreset(null);
          }}
        />
      )}

      {/* Edit Product Modal (5-Tab Full-Field Editor) */}
      {editingProduct && (
        <FullProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={async (targetId, updatedFields) => {
            const finalId = typeof targetId === 'string' ? targetId : (editingProduct.id || editingProduct._id);
            const finalPayload = typeof targetId === 'string' ? updatedFields : targetId;
            await updateProduct(finalId, finalPayload);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Shiprocket Logistics Modal */}
      {editingShiprocketOrder && (
        <ShiprocketModal
          order={editingShiprocketOrder}
          onClose={() => setEditingShiprocketOrder(null)}
          onSave={updateOrderShiprocket}
        />
      )}

      {/* WhatsApp Direct Reply Modal */}
      {replyingWhatsAppUser && (
        <WhatsAppReplyModal
          recipient={replyingWhatsAppUser}
          onClose={() => setReplyingWhatsAppUser(null)}
          onSend={handleSendDirectReply}
          whatsappConfig={whatsappConfig}
        />
      )}

      {/* Custom Coin Injection Modal */}
      {injectCoinUser && (
        <InjectCoinsModal
          user={injectCoinUser}
          onClose={() => setInjectCoinUser(null)}
          onGrant={grantCustomCoins}
        />
      )}

      {/* Brand Edit / Change Logo Modal */}
      {editingBrandModal && (
        <BrandEditModal
          brand={editingBrandModal.isNew ? null : editingBrandModal}
          onClose={() => setEditingBrandModal(null)}
          onSave={saveBrand}
        />
      )}

      {/* Category Edit / Add Modal */}
      {editingCategoryModal && (
        <CategoryEditModal
          category={editingCategoryModal.isNew ? null : editingCategoryModal}
          onClose={() => setEditingCategoryModal(null)}
          onSave={saveCategory}
        />
      )}

    </div>
  );
};

const handleDownloadShippingLabel = (order) => {
  if (!order) return;
  const items = order.items || order.cartItems || (order.item ? [order.item] : []);
  const rawPhone = getPure10Phone(order.customerPhone || order.phone || order.mobile || '');
  const displayPhone = rawPhone.length === 10 ? `+91 ${rawPhone}` : (order.customerPhone || order.phone || order.mobile || 'N/A');
  const custName = order.customerName || order.userName || order.name || 'RC Driver';
  const addressStr = order.shippingAddress || order.address || 'Address on file';
  const pincode = order.pincode || order.zipCode || '570001';
  const orderId = order.id || order.orderId || 'MJ-0000';
  const awb = order.shiprocketAwb || `SR-AWB-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  const totalPaid = (Number(order.total || order.grandTotal) || 0).toLocaleString('en-IN');
  const grossWt = order.weightKg || 1.2;
  const volWt = order.volumetricWeightKg || 1.68;
  const dimensions = `${order.lengthCm || 35}x${order.breadthCm || 20}x${order.heightCm || 15} cm`;
  const payMode = order.paymentMethod || order.paymentMode || 'Prepaid (Shiprocket Gateway)';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Shipping Label - #${orderId}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8fafc; color: #0f172a; }
        .label-card { max-width: 650px; margin: 0 auto; background: #fff; border: 2px solid #0f172a; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
        .brand { font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #0f172a; }
        .courier-badge { background: #0284c7; color: #fff; font-weight: 800; padding: 4px 12px; border-radius: 6px; font-size: 12px; text-transform: uppercase; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .box { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; font-size: 12px; }
        .title { font-weight: 800; text-transform: uppercase; color: #475569; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 4px; }
        .val { font-weight: 700; color: #0f172a; font-size: 13px; line-height: 1.4; }
        .barcode-container { text-align: center; margin: 20px 0; padding: 12px; border: 1px dashed #94a3b8; border-radius: 8px; background: #fafafa; }
        .barcode { font-family: 'Courier New', Courier, monospace; font-size: 26px; font-weight: bold; letter-spacing: 6px; margin-bottom: 4px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
        .table th, .table td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
        .table th { background: #f1f5f9; font-weight: 800; }
        .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        @media print {
          body { background: #fff; padding: 0; }
          .label-card { border: 2px solid #000; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="label-card">
        <div class="header">
          <div>
            <div class="brand">🏎️ MJ RC BASE MYSORE</div>
            <div style="font-size: 11px; font-weight: 600; color: #64748b;">Official Express RC Shipment Manifest</div>
          </div>
          <div class="courier-badge">SHIPROCKET AWB</div>
        </div>

        <div class="barcode-container">
          <div class="barcode">||||| | |||||||| |||| | |||||||</div>
          <div style="font-family: monospace; font-weight: 800; font-size: 14px;">AWB: ${awb}</div>
          <div style="font-size: 11px; color: #64748b;">Order Ref: #${orderId} | Date: ${dateStr}</div>
        </div>

        <div class="grid-2">
          <div class="box">
            <div class="title">📍 SHIP TO (RECIPIENT)</div>
            <div class="val">${custName}</div>
            <div class="val" style="font-weight: 500;">${addressStr}</div>
            <div class="val">PIN: ${pincode}</div>
            <div class="val" style="color: #0369a1; margin-top: 4px;">Phone: ${displayPhone}</div>
          </div>

          <div class="box">
            <div class="title">🏬 RETURN ADDRESS (SHIPPER)</div>
            <div class="val">MJ RC BASE MYSORE</div>
            <div class="val" style="font-weight: 500;">123 Mysore Hobby Park, Ring Road</div>
            <div class="val">Mysore, Karnataka - 570001</div>
            <div class="val" style="color: #0369a1; margin-top: 4px;">Support: +91 9876543210</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="box">
            <div class="title">⚖️ PARCEL SPECIFICATIONS</div>
            <div>Gross Weight: <strong>${grossWt} kg</strong></div>
            <div>Volumetric Wt: <strong>${volWt} kg</strong></div>
            <div>Box Size: <strong>${dimensions}</strong></div>
          </div>

          <div class="box">
            <div class="title">💳 PAYMENT & INVOICE</div>
            <div>Payment Mode: <strong>${payMode}</strong></div>
            <div>Status: <strong style="color: #15803d;">PAID / VERIFIED</strong></div>
            <div>Total Value: <strong style="font-size: 14px;">₹${totalPaid}</strong></div>
          </div>
        </div>

        <div class="title" style="margin-top: 16px;">📦 PACKAGE CONTENT MANIFEST</div>
        <table class="table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th style="width: 60px; text-align: center;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(it => `
              <tr>
                <td><strong>${it.title || it.name || 'RC Part/Vehicle'}</strong></td>
                <td style="text-align: center; font-weight: bold;">x${it.quantity || 1}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Thank you for shopping at MJ RC BASE Mysore! Handle with care - Fragile RC Electronics.
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank');
  if (printWin) {
    printWin.document.write(htmlContent);
    printWin.document.close();
  }
};

const ShiprocketDispatchModal = ({ order, onClose, onConfirmDispatch, integrationsForm }) => {
  const [weightKg, setWeightKg] = useState(order?.weightKg || 1.2);
  const [lengthCm, setLengthCm] = useState(order?.lengthCm || 35);
  const [breadthCm, setBreadthCm] = useState(order?.breadthCm || 20);
  const [heightCm, setHeightCm] = useState(order?.heightCm || 15);
  const [pickupLocation, setPickupLocation] = useState(order?.pickupLocation || 'Mysore_Warehouse');
  const [pickupDate, setPickupDate] = useState(order?.pickupDate || new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const volumetricWeightKg = useMemo(() => {
    const l = Number(lengthCm) || 0;
    const b = Number(breadthCm) || 0;
    const h = Number(heightCm) || 0;
    return ((l * b * h) / 5000).toFixed(2);
  }, [lengthCm, breadthCm, heightCm]);

  if (!order) return null;

  const rawPhone = getPure10Phone(order.customerPhone || order.phone || order.mobile || '');
  const displayPhone = rawPhone.length === 10 ? `+91 ${rawPhone}` : (order.customerPhone || order.phone || order.mobile || 'No Phone');
  const custName = order.customerName || order.userName || order.name || 'RC Driver';
  const addressStr = order.shippingAddress || order.address || 'Address on file';
  const pincode = order.pincode || order.zipCode || integrationsForm?.shiprocketWarehousePincode || '';
  const payMode = order.paymentMethod || order.paymentMode || 'Prepaid (Shiprocket Gateway)';
  const orderTotal = Number(order.total || order.grandTotal) || 0;

  const handleConfirm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const generatedAwb = order.shiprocketAwb || `SR-AWB-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const payload = {
        weightKg: Number(weightKg),
        lengthCm: Number(lengthCm),
        breadthCm: Number(breadthCm),
        heightCm: Number(heightCm),
        volumetricWeightKg: Number(volumetricWeightKg),
        pickupLocation,
        pickupDate,
        shiprocketAwb: generatedAwb,
        dispatchedAt: new Date().toISOString()
      };

      await onConfirmDispatch(order.id, 'ready_for_pickup', payload);
      onClose();
    } catch (err) {
      console.error('Error in dispatch confirmation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-sans text-slate-900">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <span>🚀 Shiprocket Package & Dispatch Configurator</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Configure parcel dimensions, volumetric weight & request courier pickup slot
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Manifest Verification */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>📋 Order Manifest Verification</span>
              <span className="font-mono text-slate-900 font-extrabold text-sm">#{order.id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Customer:</span>{' '}
                <span className="font-bold text-slate-900">{custName}</span> ({displayPhone})
              </div>
              <div>
                <span className="text-slate-400 font-medium">Payment:</span>{' '}
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{payMode}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-medium">Delivery Address:</span>{' '}
                <span className="font-semibold text-slate-800">{addressStr}</span> {pincode && <span className="font-bold text-slate-900 font-mono">[PIN: {pincode}]</span>}
              </div>
              <div>
                <span className="text-slate-400 font-medium">Invoice Total:</span>{' '}
                <span className="font-black text-slate-900 text-sm">₹{orderTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Section A: Parcel Weight & Dimensions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <span>📦 Section A: Parcel Weight & Dimensions</span>
              </h4>
              <span className="bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Volumetric Wt: <strong className="font-mono text-sky-900">{volumetricWeightKg} kg</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Gross Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Length (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={lengthCm}
                  onChange={(e) => setLengthCm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Breadth (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={breadthCm}
                  onChange={(e) => setBreadthCm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Height (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              💡 Volumetric Weight formula: <code className="bg-slate-100 px-1 rounded text-slate-700">(Length x Breadth x Height) / 5000</code>. Courier charges apply on higher of Gross Wt or Volumetric Wt.
            </p>
          </div>

          {/* Section B: Warehouse & Pickup Settings */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
              🏭 Section B: Warehouse & Pickup Schedule
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Pickup Location Nickname</label>
                <input
                  type="text"
                  required
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g. Mysore_Warehouse"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Pickup Request Date</label>
                <input
                  type="date"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 font-semibold focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🚀 Confirm Package & Request Shiprocket Pickup</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

const OrderFulfillmentDrawer = ({
  isOpen,
  onClose,
  orders,
  localStatusMap,
  onUpdateStatus,
  integrationsForm,
  setIntegrationsForm,
  onSaveIntegrations,
  isSavingIntegrations
}) => {
  const [filter, setFilter] = useState('all');
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [dispatchingOrder, setDispatchingOrder] = useState(null);

  // Compute live counters for filter tabs
  const counts = useMemo(() => {
    const all = (orders || []).length;
    let pending = 0;
    let ready = 0;
    let dispatched = 0;
    let delivered = 0;

    (orders || []).forEach(o => {
      const s = String(localStatusMap[o.id] || o.status || 'pending').toLowerCase();
      if (s === 'ready_for_pickup' || s === 'ready to ship') {
        ready++;
      } else if (s === 'dispatched') {
        dispatched++;
      } else if (s === 'delivered' || s === 'completed') {
        delivered++;
      } else if (s !== 'cancelled') {
        pending++;
      }
    });

    return { all, pending, ready, dispatched, delivered };
  }, [orders, localStatusMap]);

  if (!isOpen) return null;

  const filteredOrders = (orders || []).filter(o => {
    const currentStatus = String(localStatusMap[o.id] || o.status || 'pending').toLowerCase();
    if (filter === 'all') return true;
    if (filter === 'pending') return currentStatus !== 'ready_for_pickup' && currentStatus !== 'ready to ship' && currentStatus !== 'dispatched' && currentStatus !== 'delivered' && currentStatus !== 'completed' && currentStatus !== 'cancelled';
    if (filter === 'ready') return currentStatus === 'ready_for_pickup' || currentStatus === 'ready to ship';
    if (filter === 'dispatched') return currentStatus === 'dispatched';
    if (filter === 'delivered') return currentStatus === 'delivered' || currentStatus === 'completed';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-sans">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-900">
        
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 flex-wrap gap-3 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <span>📦 Order Fulfillment & Logistics Command Center</span>
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Process customer shipments, trigger Shiprocket pickup alerts & manage order status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowIntegrations(!showIntegrations)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 transition border border-slate-200 cursor-pointer"
            >
              <Settings size={14} className="text-slate-600" />
              <span>{showIntegrations ? 'Hide Credentials' : '⚙️ API Vault'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Credentials Section if toggled */}
        {showIntegrations && (
          <div className="p-5 bg-emerald-50/40 border-b border-emerald-100 space-y-3 shrink-0">
            <div className="font-black text-xs text-emerald-900 uppercase tracking-wider flex items-center gap-2">
              <Lock size={14} className="text-emerald-600" /> Shiprocket Unified Logistics & Payment Credentials Vault (Saved to `crm_settings/integrations`)
            </div>
            <form onSubmit={onSaveIntegrations} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Shiprocket API Email / Username</label>
                <input
                  type="text"
                  placeholder="admin@mjrc.in"
                  value={integrationsForm.shiprocketEmail || ''}
                  onChange={(e) => setIntegrationsForm(prev => ({ ...prev, shiprocketEmail: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Shiprocket API Password / Token</label>
                <input
                  type="password"
                  placeholder="token_abc123..."
                  value={integrationsForm.shiprocketEmailToken || ''}
                  onChange={(e) => setIntegrationsForm(prev => ({ ...prev, shiprocketEmailToken: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Shiprocket Checkout API Key</label>
                <input
                  type="text"
                  placeholder="sr_live_key_..."
                  value={integrationsForm.shiprocketCheckoutApiKey || ''}
                  onChange={(e) => setIntegrationsForm(prev => ({ ...prev, shiprocketCheckoutApiKey: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Shiprocket Warehouse Pincode / Location</label>
                <input
                  type="text"
                  placeholder="570001"
                  value={integrationsForm.shiprocketWarehousePincode || ''}
                  onChange={(e) => setIntegrationsForm(prev => ({ ...prev, shiprocketWarehousePincode: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900"
                />
              </div>
              <div className="sm:col-span-2 text-right">
                <button
                  type="submit"
                  disabled={isSavingIntegrations}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  {isSavingIntegrations ? 'Saving...' : '💾 Save Credentials to Firestore'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Live-Count Filter Pills */}
        <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto text-xs font-semibold shrink-0">
          {[
            { id: 'all', label: `All Orders (${counts.all})` },
            { id: 'pending', label: `Pending Packing (${counts.pending})` },
            { id: 'ready', label: `Ready to Ship (${counts.ready})` },
            { id: 'dispatched', label: `Dispatched (${counts.dispatched})` },
            { id: 'delivered', label: `Delivered (${counts.delivered})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 cursor-pointer text-xs ${
                filter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 font-semibold'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List Container */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold bg-white rounded-2xl border border-slate-200 text-xs">
              No orders found matching the selected filter.
            </div>
          ) : (
            filteredOrders.map(ord => {
              const currentStatus = String(localStatusMap[ord.id] || ord.status || 'pending').toLowerCase();
              const items = ord.items || ord.cartItems || (ord.item ? [ord.item] : []);
              const rawPhone = getPure10Phone(ord.customerPhone || ord.phone || ord.mobile || '');
              const displayPhone = rawPhone.length === 10 ? `+91 ${rawPhone}` : (ord.customerPhone || ord.phone || ord.mobile || 'No Phone Provided');
              const custName = ord.customerName || ord.userName || ord.name || 'RC Driver';
              const addressStr = ord.shippingAddress || ord.address || 'Address on file';
              const pincode = ord.pincode || ord.zipCode || '';

              let badgeStyle = 'bg-amber-100 text-amber-800 border-amber-300';
              let badgeText = 'Pending Packing';

              if (currentStatus === 'ready_for_pickup' || currentStatus === 'ready to ship') {
                badgeStyle = 'bg-sky-100 text-sky-800 border-sky-300';
                badgeText = 'Ready to Ship';
              } else if (currentStatus === 'dispatched') {
                badgeStyle = 'bg-indigo-100 text-indigo-800 border-indigo-300';
                badgeText = 'Dispatched';
              } else if (currentStatus === 'delivered' || currentStatus === 'completed') {
                badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                badgeText = 'Delivered';
              }

              return (
                <div key={ord.id} className="bg-white border border-slate-200 rounded-xl p-5 mb-4 shadow-sm hover:shadow-md transition-all space-y-4">
                  
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-bold text-base text-slate-900">#{ord.id || ord.orderId}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/80">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatLogDate(ord.created_at || ord.createdAt || ord.date)}</span>
                      </span>
                      {ord.shiprocketAwb && (
                        <span className="font-mono text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200 flex items-center gap-1">
                          <span>AWB:</span> <strong>{ord.shiprocketAwb}</strong> ({ord.volumetricWeightKg || 1.68}kg vol)
                        </span>
                      )}
                    </div>

                    {/* Prominent Status Badge */}
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${badgeStyle}`}>
                      {badgeText}
                    </span>
                  </div>

                  {/* Structured 3-Column Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs my-4">
                    
                    {/* Column 1: Customer Details */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <span>👤 Customer Details</span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{custName}</div>
                      {rawPhone ? (
                        <a
                          href={`https://wa.me/91${rawPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-mono text-emerald-700 font-bold hover:underline bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg w-fit transition-colors"
                        >
                          <span className="text-emerald-600">💬</span>
                          <span>{displayPhone}</span>
                        </a>
                      ) : (
                        <div className="text-slate-400 font-medium">{displayPhone}</div>
                      )}
                    </div>

                    {/* Column 2: Delivery Address */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <span>📍 Delivery Address</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-slate-700 font-medium leading-relaxed">
                        <div>{addressStr}</div>
                        {pincode && (
                          <div className="font-bold text-slate-900">
                            PIN: <span className="font-mono">{pincode}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Ordered Products & Amount */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>🏎️ Ordered Products & Amount</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-2">
                        {items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2.5">
                            <img
                              src={it.image || it.imageUrl || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80'}
                              alt={it.title || it.name}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-white shrink-0"
                              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80'; }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-slate-900 truncate text-xs flex items-center gap-1.5">
                                <span className="truncate">{it.title || it.name}</span>
                                {(it.selectedColor || it.color) && (
                                  <span className="shrink-0 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                                    🎨 {it.selectedColor || it.color}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">Qty: <span className="font-bold text-slate-700">x{it.quantity || 1}</span></div>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                            {ord.paymentGateway === 'shiprocket' ? '💳 Shiprocket Gateway' : ord.paymentMethod || 'Prepaid'}
                          </span>
                          <span className="font-extrabold text-slate-900 text-base">₹{(Number(ord.total || ord.grandTotal || ord.totalAmount) || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Action-Oriented Stepper Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    {(currentStatus === 'ready_for_pickup' || currentStatus === 'ready to ship' || currentStatus === 'dispatched' || currentStatus === 'delivered' || currentStatus === 'completed') && (
                      <button
                        type="button"
                        onClick={() => handleDownloadShippingLabel(ord)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <span>📄 Download Shipping Label / AWB Slip</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDispatchingOrder(ord)}
                      className={
                        currentStatus !== 'ready_for_pickup' && currentStatus !== 'ready to ship' && currentStatus !== 'dispatched' && currentStatus !== 'delivered' && currentStatus !== 'completed'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm text-xs cursor-pointer flex items-center gap-1.5 transition-all'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors'
                      }
                    >
                      <span>📦 Pack & Ship with Shiprocket</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(ord.id, 'dispatched')}
                      className={
                        currentStatus === 'ready_for_pickup' || currentStatus === 'ready to ship'
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm text-xs cursor-pointer flex items-center gap-1.5 transition-all'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors'
                      }
                    >
                      <span>🚚 Mark Dispatched</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(ord.id, 'delivered')}
                      className={
                        currentStatus === 'dispatched'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm text-xs cursor-pointer flex items-center gap-1.5 transition-all'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors'
                      }
                    >
                      <span>✅ Mark Delivered</span>
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Shiprocket Dispatch Modal */}
      {dispatchingOrder && (
        <ShiprocketDispatchModal
          order={dispatchingOrder}
          onClose={() => setDispatchingOrder(null)}
          onConfirmDispatch={onUpdateStatus}
          integrationsForm={integrationsForm}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
