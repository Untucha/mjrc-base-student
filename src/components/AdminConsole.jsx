import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Folder,
  Layers,
  Tag,
  Flame,
  ShoppingBag,
  Users,
  Clock,
  Save,
  RotateCcw,
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Truck,
  Zap,
  Sparkles,
  Award,
  ChevronRight,
  ChevronDown,
  Box,
  Film,
  Star,
  Check,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Send,
  Radio,
  Megaphone,
  TrendingUp,
  DollarSign,
  Activity,
  MessageCircle,
  Share2,
  BarChart2
} from 'lucide-react';

const BRAND_LIST = ['Hot Wheels', 'WLtoys', 'Traxxas', 'Kyosho', 'Axial', 'FMS', 'Bburago', 'Rlaarlo', 'MJX R/C', 'HStar', 'CCA Auto', 'Mini GT', 'Jiabaile', 'RGT', 'HB Toys', 'MN Model'];

export const AdminConsole = () => {
  const {
    brands,
    isAdminOpen,
    setIsAdminOpen,
    products,
    orders,
    customers,
    updateOrderStatus,
    updateProductPrice,
    updateProductDetails,
    addProduct,
    deleteProduct,
    updateStoreState,
    whatsappConfig,
    setWhatsappConfig,
    isScaleModelsEnabled,
    setIsScaleModelsEnabled,
    driverLogins,
    otpLogs,
    referralNetwork,
    whatsAppTemplate,
    setWhatsAppTemplate,
    isAutoWhatsAppWelcome,
    setIsAutoWhatsAppWelcome,
    brandVisibility,
    toggleBrandVisibility,
    latestRcCars,
    setLatestRcCars,
    customScaleCategories,
    addCustomScaleCategory,
    sendTestWhatsAppMessage,
    festiveCampaign,
    setFestiveCampaign,
    broadcastFestiveCampaign,
    resetToDefault,
    broadcastCatalogUpdate,
    showToast
  } = useStore();

  const availableBrands = (brands && brands.length > 0)
    ? brands.map(b => (typeof b === 'string' ? b : b?.name || b))
    : BRAND_LIST;

  // Active Main Sidebar Tab: 'overview' | 'categories' | 'brands_scale' | 'latest_10' | 'orders'
  const [activeTab, setActiveTab] = useState('overview');
  const [adminSearch, setAdminSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Tab 3 Sub-Panel Switcher: 'brands' | 'scale'
  const [brandsScaleSubTab, setBrandsScaleSubTab] = useState('brands');
  const ALL_15_BRANDS = [
    'HOT WHEELS', 'WLtoys', 'FMS', 'Bburago', 'RLAARLO', 'MJX R/C', 'HStar',
    'CCA AUTO', 'MINI GT', 'JIABAILE', 'RGT', 'JJRC', 'HB TOYS', 'MN MODEL', 'ARRMA / TRAXXAS'
  ];
  const [brandList, setBrandList] = useState(ALL_15_BRANDS);
  const [selectedBrandTab, setSelectedBrandTab] = useState('HOT WHEELS');
  const [newBrandInput, setNewBrandInput] = useState('');
  const [showAddBrandInput, setShowAddBrandInput] = useState(false);

  // Custom Festive Deal Builder Form State
  const [dealBuilder, setDealBuilder] = useState({
    eventTag: 'Mysore Dasara Special Flash',
    title: 'FESTIVE RC SPEED DASH 2026',
    vehicleScope: 'rc-001', // Product ID or 'ALL'
    targetSegment: 'All Active Drivers',
    discountPercent: 15,
    customMessage: '🔥 FESTIVE DEAL ALERT! Save 15% OFF on ARRMA Kraton 6S + 500 RC Coins in your wallet! Shop now at MJ RC BASE: https://mjrc.in'
  });

  // 6 Official Store Categories
  const ADMIN_CATEGORIES = [
    { id: 'cat-crawler', name: 'RC Crawlers', label: 'RC Crawlers', icon: '🧗' },
    { id: 'cat-trail-pickups', name: 'Trail Pickups', label: 'Trail Pickups', icon: '🛻' },
    { id: 'cat-drift-rally', name: 'Drift and Rally', label: 'Drift and Rally', icon: '🏎️' },
    { id: 'cat-bashers-monster', name: 'Bashers and Monster', label: 'Bashers and Monster', icon: '⚡' },
    { id: 'cat-heavy-machinery', name: 'Heavy Machinery', label: 'Heavy Machinery', icon: '🚜' },
    { id: 'cat-short-course', name: 'Short course', label: 'Short course', icon: '🏁' }
  ];

  // Accordion state for Category Manager
  const [openCategoryAccordion, setOpenCategoryAccordion] = useState('cat-crawler');

  // Modal / Form state for Adding or Editing Products
  const [productFormModal, setProductFormModal] = useState({
    isOpen: false,
    isEdit: false,
    categoryLocked: false,
    data: {
      id: '',
      title: '',
      category: 'Rock Crawler',
      scale: '1:10',
      brand: 'TRAXXAS',
      price: 2999,
      mrp: 3999,
      rcCoins: 30,
      image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
      extraImages: '',
      model3d: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      show3dViewer: true,
      showVideoTab: true,
      videoUrl: '/videos/hero-rc.mp4',
      stock: 10,
      inStock: true,
      rating: 4.9,
      reviewsCount: 24,
      boughtToday: 8,
      totalSold: 120
    }
  });

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  if (!isAdminOpen || !isDesktop) return null;

  const handleClose = () => {
    setIsAdminOpen(false);
  };

  // Open Add Product Modal pre-filled for a category or brand
  const openAddProductModal = (categoryName, brandName = 'TRAXXAS', lockCategory = false) => {
    const defaultCoins = 100;
    setProductFormModal({
      isOpen: true,
      isEdit: false,
      categoryLocked: lockCategory,
      data: {
        id: '',
        title: '',
        category: categoryName || 'Rock Crawler',
        scale: categoryName?.includes('1:') ? categoryName.replace(' Models', '') : '1:10',
        brand: brandName || 'TRAXXAS',
        price: 2999,
        mrp: 3999,
        rcCoins: defaultCoins,
        allowCoinRedemption: true,
        maxCoinsRedeemable: 500,
        coinDiscountAmount: 100,
        coinsRewardedOnPurchase: 100,
        image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
        extraImages: '',
        model3d: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
        show3dViewer: true,
        showVideoTab: true,
        videoUrl: '/videos/hero-rc.mp4',
        stock: 10,
        inStock: true,
        rating: 4.9,
        reviewsCount: 15,
        boughtToday: 5,
        totalSold: 45,
        description: 'Authentic miniature scale RC model engineered with high precision, durable chassis, and responsive 2.4GHz control.',
        specs: {
          topSpeed: '35 km/h Trail Tuned',
          drivetrain: '4WD Shaft Drive',
          battery: '2S - 3S LiPo Capable',
          motor: 'High Torque Motor',
          esc: 'Waterproof ESC Unit',
          radio: '2.4GHz Pistol Grip'
        }
      }
    });
  };

  // Open Edit Product Modal for a specific product
  const openEditProductModal = (prod) => {
    const extraImgsStr = prod.images && prod.images.length > 1 ? prod.images.slice(1).join(', ') : '';
    setProductFormModal({
      isOpen: true,
      isEdit: true,
      categoryLocked: false,
      data: {
        id: prod.id,
        title: prod.title || '',
        category: prod.category || 'Rock Crawler',
        scale: prod.scale || '1:10',
        brand: prod.brand || 'TRAXXAS',
        price: prod.price || 2999,
        mrp: prod.mrp || 3999,
        rcCoins: prod.coinsRewardedOnPurchase !== undefined ? prod.coinsRewardedOnPurchase : (prod.rcCoins || 100),
        allowCoinRedemption: prod.allowCoinRedemption !== false,
        maxCoinsRedeemable: prod.maxCoinsRedeemable !== undefined ? prod.maxCoinsRedeemable : 500,
        coinDiscountAmount: prod.coinDiscountAmount !== undefined ? prod.coinDiscountAmount : Math.round((prod.maxCoinsRedeemable || 500) / 5),
        coinsRewardedOnPurchase: prod.coinsRewardedOnPurchase !== undefined ? prod.coinsRewardedOnPurchase : (prod.rcCoins || 100),
        image: prod.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
        extraImages: extraImgsStr,
        model3d: prod.model3d || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
        show3dViewer: prod.show3dViewer !== false,
        showVideoTab: prod.showVideoTab !== false,
        videoUrl: prod.videoUrl || '/videos/hero-rc.mp4',
        stock: prod.stock !== undefined ? prod.stock : 10,
        inStock: prod.inStock !== false,
        rating: prod.rating || 4.9,
        reviewsCount: prod.reviewsCount || 20,
        boughtToday: prod.boughtToday || 8,
        totalSold: prod.totalSold || 150,
        description: prod.description || 'Authentic miniature scale RC model engineered with high precision, durable chassis, and responsive 2.4GHz control.',
        specs: {
          topSpeed: prod.specs?.topSpeed || '35 km/h Trail Tuned',
          drivetrain: prod.specs?.drivetrain || '4WD Shaft Drive',
          battery: prod.specs?.battery || '2S - 3S LiPo Capable',
          motor: prod.specs?.motor || 'High Torque Motor',
          esc: prod.specs?.esc || 'Waterproof ESC Unit',
          radio: prod.specs?.radio || '2.4GHz Radio'
        }
      }
    });
  };

  // Save Product Add/Edit Form
  const handleSaveProductForm = (e) => {
    e.preventDefault();
    const { data, isEdit } = productFormModal;
    if (!data.title.trim()) {
      showToast('Please enter a product title.');
      return;
    }

    const extraImgArray = data.extraImages
      ? data.extraImages.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const calculatedRupeeDiscount = data.coinDiscountAmount !== undefined && data.coinDiscountAmount !== null && data.coinDiscountAmount !== ''
      ? Number(data.coinDiscountAmount)
      : Math.round(Number(data.maxCoinsRedeemable || 500) / 5);

    const productPayload = {
      title: data.title.trim(),
      category: data.category,
      scale: data.scale || '1:10',
      brand: data.brand || 'TRAXXAS',
      price: Number(data.price || 2999),
      mrp: Number(data.mrp || 3999),
      rcCoins: Number(data.coinsRewardedOnPurchase !== undefined ? data.coinsRewardedOnPurchase : 100),
      allowCoinRedemption: Boolean(data.allowCoinRedemption !== false),
      maxCoinsRedeemable: Number(data.maxCoinsRedeemable !== undefined ? data.maxCoinsRedeemable : 500),
      coinDiscountAmount: calculatedRupeeDiscount,
      coinsRewardedOnPurchase: Number(data.coinsRewardedOnPurchase !== undefined ? data.coinsRewardedOnPurchase : 100),
      discount: Math.round(((Number(data.mrp || 3999) - Number(data.price || 2999)) / Number(data.mrp || 3999)) * 100),
      image: data.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
      images: [
        data.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
        ...extraImgArray
      ],
      model3d: data.model3d || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      show3dViewer: Boolean(data.show3dViewer),
      showVideoTab: Boolean(data.showVideoTab),
      videoUrl: data.videoUrl || '/videos/hero-rc.mp4',
      stock: Number(data.stock !== undefined ? data.stock : 10),
      stockCount: Number(data.stock !== undefined ? data.stock : 10),
      remainingUnits: Number(data.stock !== undefined ? data.stock : 10),
      inStock: Number(data.stock !== undefined ? data.stock : 10) > 0 && Boolean(data.inStock),
      rating: Number(data.rating || 4.9),
      reviewsCount: Number(data.reviewsCount || 20),
      boughtToday: Number(data.boughtToday || 8),
      totalSold: Number(data.totalSold || 150),
      description: data.description || 'Authentic miniature scale RC model engineered with high precision.',
      specs: {
        topSpeed: data.specs?.topSpeed || '35 km/h',
        drivetrain: data.specs?.drivetrain || '4WD Shaft Drive',
        battery: data.specs?.battery || '2S - 3S LiPo',
        motor: data.specs?.motor || 'High Torque Motor',
        esc: data.specs?.esc || 'Waterproof ESC',
        radio: data.specs?.radio || '2.4GHz Radio'
      }
    };

    if (isEdit && data.id) {
      if (updateProductDetails) updateProductDetails(data.id, productPayload);
      if (updateStoreState) updateStoreState('products', data.id, productPayload);
      showToast(`Updated "${data.title.substring(0, 20)}..." successfully!`);
    } else {
      const newId = `rc-${Date.now()}`;
      if (addProduct) addProduct({ ...productPayload, id: newId });
      showToast(`Added new vehicle "${data.title.substring(0, 20)}..."!`);
    }

    setProductFormModal(prev => ({ ...prev, isOpen: false }));
  };

  // Toggle vehicle visibility (Hide / Unhide)
  const handleToggleHideUnhide = (prod) => {
    const newStockState = !prod.inStock;
    if (updateProductDetails) updateProductDetails(prod.id, { inStock: newStockState });
    if (updateStoreState) updateStoreState('products', prod.id, { inStock: newStockState });
    showToast(`"${prod.title.substring(0, 18)}..." is now ${newStockState ? 'Visible (In Stock)' : 'Hidden (Out of Stock)'}`);
  };

  // Delete product
  const handleDeleteProductConfirm = (prod) => {
    if (window.confirm(`Are you sure you want to delete "${prod.title}"?`)) {
      if (deleteProduct) deleteProduct(prod.id);
      showToast(`Deleted "${prod.title.substring(0, 18)}..."`);
    }
  };

  // Filter products by search term
  const searchFilteredProducts = (prodList) => {
    if (!adminSearch.trim()) return prodList;
    const query = adminSearch.toLowerCase();
    return prodList.filter(p =>
      (p.title || '').toLowerCase().includes(query) ||
      (p.category || '').toLowerCase().includes(query) ||
      (p.brand || '').toLowerCase().includes(query) ||
      (p.id || '').toLowerCase().includes(query)
    );
  };

  // Dispatch Festive Deal Broadcast
  const handleBroadcastFestiveDeal = () => {
    if (!dealBuilder.title.trim()) {
      showToast('Please enter a campaign deal tagline.');
      return;
    }

    const payload = {
      title: dealBuilder.title,
      discount: dealBuilder.discountPercent,
      message: dealBuilder.customMessage,
      targetAudience: dealBuilder.targetSegment,
      selectedProductId: dealBuilder.vehicleScope
    };

    if (broadcastFestiveCampaign) {
      broadcastFestiveCampaign(payload);
    } else {
      showToast(`🚀 Dispatched WhatsApp Festive Campaign "${dealBuilder.title}" to ${customers?.length || 15} drivers!`);
    }
  };

  if (!isAdminOpen) return null;

  return (
    <div className="hidden lg:flex fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs items-center justify-center p-2 sm:p-4 animate-fadeIn font-sans">
      
      {/* Main Admin Console Card Container */}
      <div className="relative w-full max-w-7xl bg-white border border-slate-200 text-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[96vh] min-h-[85vh]">
        
        {/* Mobile Top Navigation Header (< 768px) */}
        <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 font-black text-xs flex items-center justify-center text-white">MJ</div>
            <span className="font-black text-xs tracking-tight">MJ RC COMMAND</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>☰ Admin Menu</span>
            </button>
            <button onClick={handleClose} className="p-1 text-slate-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LEFT SIDEBAR COLUMN */}
        {/* ========================================================= */}
        <aside className={`w-full md:w-64 border-r border-slate-200 bg-white p-4 ${isMobileMenuOpen ? 'flex' : 'hidden md:flex'} flex-col justify-between gap-4 shrink-0 shadow-xs`}>
          
          <div className="space-y-4">
            {/* Sidebar Top Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                  MJ
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 leading-none">
                    MJ RC BASE
                  </h2>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    COMMAND CENTER
                  </span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="md:hidden p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Storefront Realtime Sync Badge */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 flex items-center gap-2 text-xs text-emerald-800 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
              <div className="truncate">
                <div className="text-[10px] font-black uppercase tracking-wider">Storefront Online</div>
                <div className="text-[9px] text-emerald-700 font-medium">Realtime Sync Active</div>
              </div>
            </div>

            {/* Sidebar Navigation Menu (5 Tabs) */}
            <nav className="space-y-1 pt-2">
              
              {/* Tab 1: Command Overview & WhatsApp CRM */}
              <button
                onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold text-left flex items-center justify-between transition-all ${
                  activeTab === 'overview'
                    ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-600 font-extrabold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Overview & WhatsApp</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                  LIVE
                </span>
              </button>

              {/* Tab 2: Shop by Categories */}
              <button
                onClick={() => { setActiveTab('categories'); setIsMobileMenuOpen(false); }}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold text-left flex items-center justify-between transition-all ${
                  activeTab === 'categories'
                    ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-600 font-extrabold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Folder className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Shop by Categories</span>
                </div>
                <span className="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded-full font-black text-slate-700">
                  12
                </span>
              </button>

              {/* Tab 3: Shop by Brands */}
              <button
                onClick={() => { setActiveTab('brands_scale'); setIsMobileMenuOpen(false); }}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold text-left flex items-center justify-between transition-all ${
                  activeTab === 'brands_scale'
                    ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-600 font-extrabold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Shop by Brands</span>
                </div>
              </button>

              {/* Tab 4: Latest 10 RC Cars */}
              <button
                onClick={() => { setActiveTab('latest_10'); setIsMobileMenuOpen(false); }}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold text-left flex items-center justify-between transition-all ${
                  activeTab === 'latest_10'
                    ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-600 font-extrabold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Latest 10 RC Cars</span>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">
                  10
                </span>
              </button>

              {/* Tab 5: Customer Orders & Logistics */}
              <button
                onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); }}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold text-left flex items-center justify-between transition-all ${
                  activeTab === 'orders'
                    ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-600 font-extrabold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Orders & Logistics</span>
                </div>
                <span className="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded-full font-black text-slate-700">
                  {orders?.length || 0}
                </span>
              </button>

            </nav>
          </div>

          {/* Sidebar Bottom Actions */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <button
              onClick={resetToDefault}
              className="w-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Store Defaults</span>
            </button>
            <button
              onClick={handleClose}
              className="hidden md:flex w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl transition-all items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Console</span>
            </button>
          </div>

        </aside>

        {/* ========================================================= */}
        {/* RIGHT MAIN VIEWPORT COLUMN */}
        {/* ========================================================= */}
        <main className="flex-1 bg-slate-50 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between">
          
          <div className="space-y-6">
            
            {/* ========================================================= */}
            {/* TAB 1: COMMAND OVERVIEW & WHATSAPP CRM */}
            {/* ========================================================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Section A: Top Performance Telemetry Tiles */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
                    <div>
                      <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        <span>Command Center Telemetry & Performance Dashboard</span>
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Real-time revenue, order growth, stock health, and Mysore hub dispatch analytics.</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      Live Store Telemetry Active
                    </span>
                  </div>

                  {/* 6 Top KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    
                    {/* KPI 1: Revenue */}
                    <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Revenue</div>
                      <div className="text-lg font-black text-emerald-700">₹67,696</div>
                      <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> +18.4% growth
                      </div>
                    </div>

                    {/* KPI 2: Orders */}
                    <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Orders</div>
                      <div className="text-lg font-black text-slate-900">{orders?.length || 24} Orders</div>
                      <div className="text-[10px] text-slate-500 font-medium">+12% live trend</div>
                    </div>

                    {/* KPI 3: Registered Drivers */}
                    <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Registered Drivers</div>
                      <div className="text-lg font-black text-slate-900">{customers?.length || 15} Racers</div>
                      <div className="text-[10px] text-emerald-700 font-bold">100% Phone Verified</div>
                    </div>

                    {/* KPI 4: AOV Ticket */}
                    <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AOV Ticket</div>
                      <div className="text-lg font-black text-slate-900">₹18,450</div>
                      <div className="text-[10px] text-slate-500 font-medium">Avg Order Value</div>
                    </div>

                    {/* KPI 5: Stock Health */}
                    <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Stock Health</div>
                      <div className="text-lg font-black text-emerald-700">94% Active</div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-emerald-600 w-[94%]" />
                      </div>
                    </div>

                    {/* KPI 6: Return/Damage */}
                    <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Damage Rate</div>
                      <div className="text-lg font-black text-emerald-700">0.0% Zero</div>
                      <div className="text-[10px] text-emerald-700 font-bold">Bench-Test Verified</div>
                    </div>

                  </div>

                  {/* 7-Day Sales Volume Graph Widget */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <BarChart2 className="w-4 h-4 text-emerald-600" /> 7-Day Sales Volume & Peak Order Distribution (Mon - Sun)
                        </h5>
                        <p className="text-[11px] text-slate-500">Daily peak sales velocity tracked across Mysore Air Cargo & Express dispatch channels.</p>
                      </div>
                      <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700">
                        Peak: Sat (₹22,500)
                      </span>
                    </div>

                    {/* SVG/Styled 7-Day Volume Line Graph */}
                    <div className="h-36 w-full pt-2 flex items-end justify-between gap-2 border-b border-slate-100 pb-2">
                      {[
                        { day: 'Mon', val: 8400, height: '35%' },
                        { day: 'Tue', val: 12500, height: '55%' },
                        { day: 'Wed', val: 9200, height: '40%' },
                        { day: 'Thu', val: 14800, height: '65%' },
                        { day: 'Fri', val: 18900, height: '80%' },
                        { day: 'Sat', val: 22500, height: '100%', peak: true },
                        { day: 'Sun', val: 16400, height: '70%' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                          <span className="text-[9px] font-bold text-slate-500 group-hover:text-emerald-700 transition-colors">
                            ₹{(item.val / 1000).toFixed(1)}k
                          </span>
                          <div
                            style={{ height: item.height }}
                            className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 ${
                              item.peak
                                ? 'bg-gradient-to-t from-emerald-600 to-emerald-500 shadow-xs'
                                : 'bg-slate-200 group-hover:bg-emerald-300'
                            }`}
                          />
                          <span className="text-[10px] font-black text-slate-700">{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Section B: Custom Festive Campaign & Single-Car Deal Builder (WhatsApp Hub) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h5 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>Festive Campaign & Single-Car Deal Builder (WhatsApp Hub)</span>
                      </h5>
                      <p className="text-xs text-slate-500">Configure targeted flash deals, select specific vehicles, and dispatch custom WhatsApp broadcasts.</p>
                    </div>

                    <span className="text-xs font-black bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full shrink-0">
                      WhatsApp Marketing Engine
                    </span>
                  </div>

                  {/* Form Builder Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    
                    {/* Event Tag */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Festival Tag / Event</label>
                      <select
                        value={dealBuilder.eventTag}
                        onChange={(e) => setDealBuilder(prev => ({ ...prev, eventTag: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                      >
                        <option value="Mysore Dasara Special Flash">Mysore Dasara Special Flash</option>
                        <option value="FESTIVE RC SPEED DASH 2026">FESTIVE RC SPEED DASH 2026</option>
                        <option value="Weekend Bashing Flash Sale">Weekend Bashing Flash Sale</option>
                        <option value="New Traxxas Drop">New Traxxas Drop</option>
                      </select>
                    </div>

                    {/* Tagline */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Deal Tagline / Title</label>
                      <input
                        type="text"
                        value={dealBuilder.title}
                        onChange={(e) => setDealBuilder(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="FESTIVE RC SPEED DASH 2026"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    {/* Vehicle Catalog Scope */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Vehicle Catalog Scope</label>
                      <select
                        value={dealBuilder.vehicleScope}
                        onChange={(e) => setDealBuilder(prev => ({ ...prev, vehicleScope: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                      >
                        <option value="ALL">All 36 Catalog Vehicles</option>
                        {(products || []).slice(0, 10).map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>

                    {/* Target Segment */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Target Driver Segment</label>
                      <select
                        value={dealBuilder.targetSegment}
                        onChange={(e) => setDealBuilder(prev => ({ ...prev, targetSegment: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                      >
                        <option value="All Active Drivers">All Active Drivers ({customers?.length || 15})</option>
                        <option value="First-time Phone OTP Logins">First-time Phone OTP Logins</option>
                        <option value="Crawler & Basher Enthusiasts">Crawler & Basher Enthusiasts</option>
                        <option value="Spare Parts & LiPo Buyers">Spare Parts & LiPo Buyers</option>
                      </select>
                    </div>

                  </div>

                  {/* Broadcast Payload Textarea */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-bold text-slate-800">WhatsApp Broadcast Message Payload (Template Preview)</label>
                    <textarea
                      rows={3}
                      value={dealBuilder.customMessage}
                      onChange={(e) => setDealBuilder(prev => ({ ...prev, customMessage: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleBroadcastFestiveDeal}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs px-6 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>🚀 BROADCAST CUSTOM CAMPAIGN ON WHATSAPP</span>
                    </button>
                  </div>
                </div>

                {/* Section C: Individual Driver Feed & 1-on-1 Separate Messaging */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h5 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>Active Drivers Roster & 1-on-1 Direct WhatsApp Messaging</span>
                      </h5>
                      <p className="text-xs text-slate-500">Send personalized 1-on-1 WhatsApp messages directly to individual driver phone numbers.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search driver mobile..."
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Driver Name & Mobile</th>
                          <th className="p-3">Login Timestamp</th>
                          <th className="p-3">OTP Delivery Status</th>
                          <th className="p-3 text-right">1-on-1 Direct WhatsApp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(driverLogins || [])
                          .filter(log =>
                            !adminSearch.trim() ||
                            log.phone?.includes(adminSearch) ||
                            log.name?.toLowerCase().includes(adminSearch.toLowerCase())
                          )
                          .map((log) => {
                            const cleanPhone = log.phone ? log.phone.replace(/\D/g, '') : '9876543210';
                            const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                              `Hi ${log.name}! Welcome to MJ RC BASE Mysore. Your driver account is active. Need assistance with Traxxas or Crawlers?`
                            )}`;

                            return (
                              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-bold text-slate-900">
                                  <div className="font-extrabold">{log.name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">+91 {log.phone}</div>
                                </td>

                                <td className="p-3 font-medium text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>{log.timestamp}</span>
                                  </div>
                                </td>

                                <td className="p-3">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                    log.otpStatus?.includes('Delivered') || log.otpStatus?.includes('Verified')
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : log.otpStatus?.includes('Resent')
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-rose-50 text-rose-800 border-rose-200'
                                  }`}>
                                    {log.otpStatus || '🟢 Delivered'}
                                  </span>
                                </td>

                                <td className="p-3 text-right">
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-xs transition-colors"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>💬 Send 1-on-1 WhatsApp</span>
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section D: Multi-Level Referral Network Attribution Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h5 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Multi-Level Referral Network & Attribution Ledger</span>
                      </h5>
                      <p className="text-xs text-slate-500">Order-Gated attribution logs. Gold coins unlock when the referee completes an order.</p>
                    </div>
                    <span className="text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
                      {(referralNetwork || []).filter(r => r.converted).length} / {(referralNetwork || []).length} Converted
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                        <tr>
                          <th className="p-3">REFERRER DRIVER</th>
                          <th className="p-3">REFERRER PHONE</th>
                          <th className="p-3">REFEREE (INVITED FRIEND)</th>
                          <th className="p-3">ATTRIBUTION DATE</th>
                          <th className="p-3">COINS CREDITED</th>
                          <th className="p-3 text-right">REFERRAL STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(referralNetwork || []).map((ref) => (
                          <tr key={ref.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-extrabold text-slate-900">
                              {ref.referrerName || 'Karan Sharma'}
                            </td>

                            <td className="p-3 font-mono font-bold text-slate-600">
                              +91 {ref.referrerMobile || '9876543210'}
                            </td>

                            <td className="p-3 font-bold text-emerald-700">
                              {ref.joinedFriendName} (+91 {ref.joinedFriendMobile})
                            </td>

                            <td className="p-3 font-medium text-slate-500">
                              {ref.joinedAt || '2026-09-07'}
                            </td>

                            <td className="p-3">
                              <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                🪙 +{ref.converted ? '500' : '0'} Coins
                              </span>
                            </td>

                            <td className="p-3 text-right">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border inline-block ${
                                ref.converted
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {ref.converted ? `🟢 Completed: Order #${ref.orderId || 'MJ-98215'}` : '🟡 Pending First Order'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: SHOP BY CATEGORIES MANAGER */}
            {/* ========================================================= */}
            {activeTab === 'categories' && (
              <div className="space-y-4">
                
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Shop by Categories Manager (8 Categories)</h4>
                    <p className="text-xs text-slate-500 font-medium">Expand any category accordion to view assigned products or add new vehicles.</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search category products..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* 8 Accordion Cards */}
                <div className="space-y-3">
                  {ADMIN_CATEGORIES.map((cat) => {
                    const categoryProds = (products || []).filter(p =>
                      p.category === cat.name ||
                      p.category?.toLowerCase() === cat.name.toLowerCase() ||
                      (cat.name === 'RC Crawlers' && (p.category === 'Rock Crawler' || p.category === 'RC Crawler')) ||
                      (cat.name === 'Drift and Rally' && (p.category === 'Drift' || p.category === 'Drift 4WD' || p.category === 'Rally')) ||
                      (cat.name === 'Bashers and Monster' && (p.category === 'Basher' || p.category === 'Monster Truck')) ||
                      (cat.name === 'Heavy Machinery' && (p.category === 'Construction' || p.category === 'RC Heavy Machinery'))
                    );
                    const filteredCatProds = searchFilteredProducts(categoryProds);
                    const isOpen = openCategoryAccordion === cat.id;

                    return (
                      <div key={cat.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                        
                        {/* Category Accordion Header */}
                        <div
                          onClick={() => setOpenCategoryAccordion(isOpen ? null : cat.id)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{cat.icon}</span>
                            <div>
                              <h5 className="text-sm font-black text-slate-900">{cat.label}</h5>
                              <span className="text-[10px] font-bold text-slate-500">
                                {categoryProds.length} Vehicles Assigned
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openAddProductModal(cat.name, 'TRAXXAS', true);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add New Vehicle</span>
                            </button>

                            <div className="text-slate-400">
                              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </div>
                          </div>
                        </div>

                        {/* Accordion Content Panel */}
                        {isOpen && (
                          <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-3">
                            {filteredCatProds.length === 0 ? (
                              <div className="text-center py-6 text-xs text-slate-500 font-medium">
                                No vehicles found in {cat.label}. Click "+ Add New Vehicle" to add one!
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredCatProds.map((prod) => (
                                  <div key={prod.id} className="bg-white border border-slate-200 p-3 rounded-xl shadow-2xs space-y-2.5 flex flex-col justify-between">
                                    <div className="flex items-start gap-2.5">
                                      <img
                                        src={prod.image}
                                loading="lazy"
                                decoding="async"
                                        alt={prod.title}
                                        className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-50"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <h6 className="text-xs font-extrabold text-slate-900 line-clamp-1">{prod.title}</h6>
                                        <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                                          {prod.brand} • {prod.scale}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs font-black text-slate-900">₹{prod.price?.toLocaleString('en-IN')}</span>
                                          {prod.mrp && <span className="text-[10px] text-slate-400 line-through">₹{prod.mrp?.toLocaleString('en-IN')}</span>}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => handleToggleHideUnhide(prod)}
                                          className={`p-1.5 rounded-lg border ${prod.inStock ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}
                                          title={prod.inStock ? 'Hide' : 'Unhide'}
                                        >
                                          {prod.inStock ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                          onClick={() => openEditProductModal(prod)}
                                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                          title="Edit Vehicle"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteProductConfirm(prod)}
                                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                          title="Delete Vehicle"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                        🪙 +{prod.rcCoins || Math.round(prod.price * 0.01)} Coins
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: BRANDS & SCALE MODELS HUB */}
            {/* ========================================================= */}
            {activeTab === 'brands_scale' && (
              <div className="space-y-4">
                
                {/* Sub-panel Navigation Bar */}
                <div className="bg-white border border-slate-200 rounded-2xl p-2 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBrandsScaleSubTab('brands')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        brandsScaleSubTab === 'brands'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🏷️ Shop by Brands (6 Brands)
                    </button>
                    <button
                  </div>

                  <span className="text-xs font-bold text-slate-500 px-3 hidden sm:inline">
                    Isolated Brand & Scale Controls
                  </span>
                </div>

                {/* Sub-Panel 1: Brands Showcase */}
                {brandsScaleSubTab === 'brands' && (
                  <div className="space-y-4">
                    
                    {/* Brand Selector & Add Brand Control Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-2xs">
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                        {brandList.map((brand) => {
                          const isVis = brandVisibility ? brandVisibility[brand] !== false : true;
                          return (
                            <button
                              key={brand}
                              onClick={() => setSelectedBrandTab(brand)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all border flex items-center gap-1.5 ${
                                selectedBrandTab === brand
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span>{brand}</span>
                              <span className={`w-2 h-2 rounded-full ${isVis ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            </button>
                          );
                        })}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {showAddBrandInput ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="New brand name..."
                              value={newBrandInput}
                              onChange={(e) => setNewBrandInput(e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                            />
                            <button
                              onClick={() => {
                                if (newBrandInput.trim()) {
                                  const bName = newBrandInput.trim();
                                  setBrandList(prev => [...prev, bName]);
                                  setSelectedBrandTab(bName);
                                  setNewBrandInput('');
                                  setShowAddBrandInput(false);
                                  showToast(`Added new brand "${bName}"!`);
                                }
                              }}
                              className="bg-emerald-600 text-white px-3 py-1 rounded-xl text-xs font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setShowAddBrandInput(false)}
                              className="text-slate-400 text-xs px-1"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowAddBrandInput(true)}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-extrabold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Brand</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Active Brand Card Header & Master Visibility Toggle */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-base font-black text-slate-900">{selectedBrandTab} Inventory & Controls</h5>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                              (brandVisibility ? brandVisibility[selectedBrandTab] !== false : true)
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {(brandVisibility ? brandVisibility[selectedBrandTab] !== false : true) ? '🟢 VISIBLE ON STOREFRONT' : '🔴 HIDDEN (OUT OF STOCK)'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Toggle master visibility or add isolated vehicles to {selectedBrandTab}.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (toggleBrandVisibility) toggleBrandVisibility(selectedBrandTab);
                              const curState = brandVisibility ? brandVisibility[selectedBrandTab] !== false : true;
                              showToast(`Brand "${selectedBrandTab}" is now ${!curState ? 'Visible' : 'Hidden'} on Storefront`);
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5 ${
                              (brandVisibility ? brandVisibility[selectedBrandTab] !== false : true)
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {(brandVisibility ? brandVisibility[selectedBrandTab] !== false : true) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{(brandVisibility ? brandVisibility[selectedBrandTab] !== false : true) ? 'Hide Brand' : 'Unhide Brand'}</span>
                          </button>

                          <button
                            onClick={() => openAddProductModal('Rock Crawler', selectedBrandTab, false)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Vehicle to {selectedBrandTab}</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {searchFilteredProducts((products || []).filter(p => p.brand && p.brand.toLowerCase() === selectedBrandTab.toLowerCase())).map((prod) => (
                          <div key={prod.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-2xs space-y-2.5 flex flex-col justify-between">
                            <div className="flex items-start gap-2.5">
                              <img
                                src={prod.image}
                                loading="lazy"
                                decoding="async"
                                alt={prod.title}
                                className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
                              />
                              <div className="min-w-0 flex-1">
                                <h6 className="text-xs font-extrabold text-slate-900 line-clamp-1">{prod.title}</h6>
                                <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                                  {prod.category} • {prod.scale}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-black text-slate-900">₹{prod.price?.toLocaleString('en-IN')}</span>
                                  {prod.mrp && <span className="text-[10px] text-slate-400 line-through">₹{prod.mrp?.toLocaleString('en-IN')}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleHideUnhide(prod)}
                                  className={`p-1.5 rounded-lg border ${prod.inStock ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}
                                >
                                  {prod.inStock ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => openEditProductModal(prod)}
                                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProductConfirm(prod)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500">{prod.brand}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>

                  </div>
                )}

              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: LATEST 10 RC CARS (HOMEPAGE SHOWCASE) */}
            {/* ========================================================= */}
            {activeTab === 'latest_10' && (
              <div className="space-y-4">
                
                {/* 10 Models Summary Bar */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span>Homepage Flagship Vehicles (Strict Cap: 10 Models)</span>
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">Directly manage bench-tested proof, ratings, 3D assets, and stock for the 10 isolated storefront flagship models.</p>
                  </div>
                  <span className="text-xs font-black text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full shrink-0">
                    {(latestRcCars || []).length} Flagships Displayed
                  </span>
                </div>

                {/* Table View of 10 Flagship Models */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Flagship Vehicle</th>
                          <th className="p-3">Category & Brand</th>
                          <th className="p-3">Sale Price (₹)</th>
                          <th className="p-3">Bench Test & Rating</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(latestRcCars || []).map((prod, index) => (
                          <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                            
                            <td className="p-3 font-bold text-slate-900 flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                #{index + 1}
                              </span>
                              <img
                                src={prod.image}
                                loading="lazy"
                                decoding="async"
                                alt={prod.title}
                                className="w-9 h-9 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-50"
                              />
                              <div className="min-w-0 max-w-xs">
                                <div className="truncate font-extrabold">{prod.title}</div>
                                <div className="text-[10px] text-slate-400 font-mono">ID: {prod.id}</div>
                              </div>
                            </td>

                            <td className="p-3 font-medium">
                              <span className="font-extrabold text-slate-900">{prod.category}</span>
                              <div className="text-[10px] text-emerald-700 font-bold">{prod.brand} • {prod.scale}</div>
                            </td>

                            <td className="p-3 font-black text-emerald-700">
                              ₹{prod.price?.toLocaleString('en-IN')}
                              {prod.mrp && <div className="text-[10px] text-slate-400 font-bold line-through">₹{prod.mrp?.toLocaleString('en-IN')}</div>}
                            </td>

                            <td className="p-3 font-medium">
                              <div className="flex items-center gap-1 text-slate-900 font-bold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                <span>{prod.rating || 4.9}</span>
                              </div>
                              <div className="text-[10px] text-emerald-700 font-bold">✓ Mysore 100% Bench-Tested</div>
                            </td>

                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleToggleHideUnhide(prod)}
                                  className={`p-1.5 rounded-lg border ${prod.inStock !== false ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}
                                  title={prod.inStock !== false ? 'Hide' : 'Unhide'}
                                >
                                  {prod.inStock !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  onClick={() => openEditProductModal(prod)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                  title="Edit Specs"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteProductConfirm(prod)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                  title="Delete Model"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 5: CUSTOMER ORDERS & LOGISTICS */}
            {/* ========================================================= */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Customer Orders & Automated Logistics Pipeline</h4>
                    <p className="text-xs text-slate-500 font-medium">Realtime Shiprocket tracking updates and 1-click WhatsApp order status alerts.</p>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    {orders?.length || 0} Total Orders
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Order ID & Date</th>
                          <th className="p-3">Customer Details</th>
                          <th className="p-3">Total Payable</th>
                          <th className="p-3">Current Status</th>
                          <th className="p-3 text-right">Pipeline Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(orders || []).map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-slate-900">
                              <div>#{order.id}</div>
                              <div className="text-[10px] text-slate-400 font-medium">{order.date}</div>
                            </td>

                            <td className="p-3">
                              <div className="font-extrabold text-slate-900">{order.customerName || order.name || 'RC Racer'}</div>
                              <div className="text-[10px] text-slate-500">+91 {order.mobile} • {order.city || 'Mysore'}</div>
                            </td>

                            <td className="p-3 font-black text-emerald-700">
                              ₹{order.total?.toLocaleString('en-IN')}
                            </td>

                            <td className="p-3">
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                                {order.status}
                              </span>
                            </td>

                            <td className="p-3 text-right">
                              <select
                                value={order.status}
                                onChange={(e) => {
                                  if (updateOrderStatus) updateOrderStatus(order.id, e.target.value);
                                  showToast(`Order #${order.id} status set to "${e.target.value}"`);
                                }}
                                className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                              >
                                <option value="Order Placed">Order Placed</option>
                                <option value="Packed & Bench-Tested">Packed & Bench-Tested</option>
                                <option value="Dispatched via Mysore Hub">Dispatched via Mysore Hub</option>
                                <option value="In Transit (Out for Delivery)">In Transit</option>
                                <option value="Delivered">Delivered</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Bar */}
          <div className="pt-4 mt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>MJ RC BASE Command Center • Version 5.0</span>
            <span>Mysore Central Hub Realtime Sync</span>
          </div>

        </main>

      </div>

      {/* ========================================================= */}
      {/* PRODUCT FORM MODAL (DRAWER / OVERLAY) */}
      {/* ========================================================= */}
      {productFormModal.isOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 text-slate-900 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[92vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {productFormModal.isEdit ? 'Edit Vehicle Specifications' : 'Add New Vehicle to Catalog'}
                </h4>
                <p className="text-xs text-slate-500">Configure vehicle media, pricing, stock, 3D orbit assets, and video tabs.</p>
              </div>
              <button
                onClick={() => setProductFormModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="product-modal-form" onSubmit={handleSaveProductForm} className="space-y-4 text-xs">
              
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Model Name / Title *</label>
                <input
                  type="text"
                  required
                  value={productFormModal.data.title}
                  onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, title: e.target.value } }))}
                  placeholder="e.g. Traxxas TRX-4 Defender 1/10 Rock Crawler"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              {/* Category & Scale Tag */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    disabled={productFormModal.categoryLocked}
                    value={productFormModal.data.category}
                    onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, category: e.target.value } }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
                  >
                    {ADMIN_CATEGORIES.map(c => (
                      <option key={c.id} value={c.name}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Scale Tag (e.g. 1:10, 1:64)</label>
                  <input
                    type="text"
                    value={productFormModal.data.scale}
                    onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, scale: e.target.value } }))}
                    placeholder="1:10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Brand & Coins */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Name *</label>
                  <select
                    value={productFormModal?.data?.brand || ''}
                    onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, brand: e.target.value } }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
                  >
                    {availableBrands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="MJ RC">MJ RC BASE</option>
                    <option value="MJX">MJX</option>
                    <option value="HBX">HBX</option>
                    <option value="HUINA">HUINA</option>
                  </select>
                </div>

              </div>

              {/* 🪙 Per-Product RC Loyalty & Margin Protection Card */}
              <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🪙</span>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wider">Per-Product RC Loyalty & Margin Protection</h4>
                  </div>
                  
                  {/* Field 1: Allow Coin Redemption Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs font-extrabold text-slate-800">
                      Allow Coin Redemption on this Item
                    </span>
                    <input
                      type="checkbox"
                      checked={productFormModal.data.allowCoinRedemption !== false}
                      onChange={(e) => setProductFormModal(prev => ({
                        ...prev,
                        data: { ...prev.data, allowCoinRedemption: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Field 2: Max Spendable Coins Cap */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-800 mb-1">
                      Max Spendable Coins Cap 🪙
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={productFormModal.data.allowCoinRedemption === false}
                      value={productFormModal.data.maxCoinsRedeemable ?? 500}
                      onChange={(e) => setProductFormModal(prev => ({
                        ...prev,
                        data: { ...prev.data, maxCoinsRedeemable: Math.max(0, Number(e.target.value)) }
                      }))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 disabled:opacity-50"
                      placeholder="e.g. 100"
                    />
                    <p className="text-[10px] text-slate-600 mt-1 font-semibold">100 coins = ₹20 max discount cap per unit</p>
                  </div>

                  {/* Field 3: Reward Coins Earned on Purchase */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-800 mb-1">
                      Reward Coins Earned on Purchase 🎁
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productFormModal.data.coinsRewardedOnPurchase ?? productFormModal.data.rcCoins ?? 100}
                      onChange={(e) => setProductFormModal(prev => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          coinsRewardedOnPurchase: Math.max(0, Number(e.target.value)),
                          rcCoins: Math.max(0, Number(e.target.value))
                        }
                      }))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs focus:outline-none focus:border-emerald-600"
                      placeholder="e.g. 50"
                    />
                    <p className="text-[10px] text-slate-600 mt-1 font-semibold">Credited to customer wallet upon order delivery</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sale Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={productFormModal.data.price}
                    onChange={(e) => {
                      const newPrice = Number(e.target.value);
                      setProductFormModal(prev => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          price: newPrice,
                          rcCoins: Math.round(newPrice * 0.01)
                        }
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Regular Price / MRP (₹)</label>
                  <input
                    type="number"
                    value={productFormModal.data.mrp}
                    onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, mrp: Number(e.target.value) } }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Image URLs */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Cover Image URL *</label>
                <input
                  type="text"
                  required
                  value={productFormModal.data.image}
                  onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, image: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-[11px] focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Extra Gallery Images (Comma-Separated URLs)</label>
                <input
                  type="text"
                  value={productFormModal.data.extraImages}
                  onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, extraImages: e.target.value } }))}
                  placeholder="https://img2.jpg, https://img3.jpg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-[11px] focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              {/* 3D Asset */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5"><Box className="w-4 h-4 text-emerald-600" /> 360° 3D Orbit Asset (.glb)</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productFormModal.data.show3dViewer}
                      onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, show3dViewer: e.target.checked } }))}
                      className="accent-emerald-600"
                    />
                    <span className="font-bold text-slate-800">Enable 3D Viewer</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={productFormModal.data.model3d}
                  onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, model3d: e.target.value } }))}
                  placeholder="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-[11px] focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Video Asset */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5"><Film className="w-4 h-4 text-emerald-600" /> Video Tab Controls</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productFormModal.data.showVideoTab}
                      onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, showVideoTab: e.target.checked } }))}
                      className="accent-emerald-600"
                    />
                    <span className="font-bold text-slate-800">Enable Video Tab [ON/OFF]</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={productFormModal.data.videoUrl}
                  onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, videoUrl: e.target.value } }))}
                  placeholder="/videos/hero-rc.mp4"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-[11px] focus:outline-none focus:border-emerald-600"
                />
              </div>
              {/* Product Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Story & Full Description</label>
                <textarea
                  rows={3}
                  value={productFormModal.data.description || ''}
                  onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, description: e.target.value } }))}
                  placeholder="Authentic 1/10 miniature trail crawler featuring portal axles, remote-locking differentials..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Technical Specifications Editors (6 Fields) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <span>Technical Specifications Editors</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Top Speed (e.g. 25 km/h Trail)</label>
                    <input
                      type="text"
                      value={productFormModal.data.specs?.topSpeed || ''}
                      onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, specs: { ...prev.data.specs, topSpeed: e.target.value } } }))}
                      placeholder="25 km/h Trail Tuned"
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Drivetrain (e.g. 4WD Shaft Drive)</label>
                    <input
                      type="text"
                      value={productFormModal.data.specs?.drivetrain || ''}
                      onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, specs: { ...prev.data.specs, drivetrain: e.target.value } } }))}
                      placeholder="4WD Portal Axle Drive"
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Battery Capable (e.g. 2S - 3S LiPo)</label>
                    <input
                      type="text"
                      value={productFormModal.data.specs?.battery || ''}
                      onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, specs: { ...prev.data.specs, battery: e.target.value } } }))}
                      placeholder="2S - 3S LiPo Capable"
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Motor System (e.g. Titan 21T 550)</label>
                    <input
                      type="text"
                      value={productFormModal.data.specs?.motor || ''}
                      onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, specs: { ...prev.data.specs, motor: e.target.value } } }))}
                      placeholder="Titan 21T Reverse Rotation 550"
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">ESC Unit (e.g. XL-5 HV ESC)</label>
                    <input
                      type="text"
                      value={productFormModal.data.specs?.esc || ''}
                      onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, specs: { ...prev.data.specs, esc: e.target.value } } }))}
                      placeholder="XL-5 HV Waterproof ESC"
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Radio Transmitter (e.g. TQi 2.4GHz)</label>
                    <input
                      type="text"
                      value={productFormModal.data.specs?.radio || ''}
                      onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, specs: { ...prev.data.specs, radio: e.target.value } } }))}
                      placeholder="TQi 2.4GHz 4-Channel Radio"
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Stock & Visibility */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={productFormModal.data.stock}
                    onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, stock: Number(e.target.value) } }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Store Visibility</label>
                  <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productFormModal.data.inStock}
                      onChange={(e) => setProductFormModal(prev => ({ ...prev, data: { ...prev.data, inStock: e.target.checked } }))}
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <span className="font-bold text-slate-900">
                      {productFormModal.data.inStock ? 'Visible (In Stock)' : 'Hidden (Out of Stock)'}
                    </span>
                  </label>
                </div>
              </div>

            </form>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setProductFormModal(prev => ({ ...prev, isOpen: false }))}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-modal-form"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md"
              >
                {productFormModal.isEdit ? 'Save Changes' : 'Create Vehicle'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminConsole;
