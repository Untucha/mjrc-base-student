import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigationType } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { AllCategoriesPage } from './pages/AllCategoriesPage';
import { AllProductsPage } from './pages/AllProductsPage';
import WishlistPage, { WishlistPage as WishlistPageNamed } from './pages/WishlistPage';
import { CategoryProductPage } from './pages/CategoryProductPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { BrandPageView } from './pages/BrandPageView';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { ShippingPolicyPage, ReplacementPolicyPage, TermsConditionsPage, PrivacyPolicyPage } from './pages/LegalPages';
import { AdminDashboard } from './pages/AdminDashboard';
import { PhoneAuthModal } from './components/PhoneAuthModal';
import { AccountModal } from './components/AccountModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { Footer } from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { CheckCircle2, Home, Grid, Heart, User, ShoppingCart, MessageCircle } from 'lucide-react';

const ScrollToTop = () => {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // If navigation is POP (browser back/forward or navigate(-1)), allow native scroll restoration
    if (navType === 'POP') {
      return;
    }

    const returnSection = location.state?.returnSection || 
                          window.history.state?.usr?.returnSection || 
                          (typeof window !== 'undefined' ? sessionStorage.getItem('returnSection') : null);

    if (location.pathname === '/' && returnSection) {
      return;
    }

    window.scrollTo(0, 0);
  }, [location, navType]);

  return null;
};

const ToastNotification = () => {
  const { toastMessage } = useStore();
  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 border border-emerald-500 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2.5 animate-bounce">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{toastMessage}</span>
    </div>
  );
};

const FloatingWhatsApp = () => {
  const whatsappUrl = "https://wa.me/919686078395?text=Hi%20MJ%20RC%20BASE%2C%20I%20have%20a%20query%20about%20scale%20RC%20cars.";
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-16 sm:bottom-6 right-4 z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-extrabold text-xs"
      title="Chat on WhatsApp"
    >
      <MessageCircle className="w-5 h-5 fill-white" />
      <span className="hidden md:inline">Mysore RC Support</span>
    </a>
  );
};

const MobileBottomDock = () => {
  const { cartCount, wishlist, setIsCartOpen, setIsAccountOpen } = useStore();
  const location = useLocation();

  if (location.pathname === '/admin') return null;

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-2 px-6 flex justify-between items-center z-50 shadow-lg">
      <Link
        to="/"
        className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold ${
          location.pathname === '/' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </Link>

      <Link
        to="/catalog"
        className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold ${
          location.pathname === '/catalog' || location.pathname === '/categories' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Grid className="w-5 h-5" />
        <span>Shop</span>
      </Link>

      <Link
        to="/wishlist"
        className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold relative ${
          location.pathname === '/wishlist' ? 'text-rose-600' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Heart className={`w-5 h-5 ${location.pathname === '/wishlist' ? 'fill-rose-500 text-rose-500' : ''}`} />
        {wishlist && wishlist.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-black text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
            {wishlist.length}
          </span>
        )}
        <span>Wishlist</span>
      </Link>

      <button
        onClick={() => setIsAccountOpen(true)}
        className="flex flex-col items-center gap-0.5 text-[10px] font-extrabold text-slate-500 hover:text-slate-900"
      >
        <User className="w-5 h-5" />
        <span>Account</span>
      </button>

      <button
        onClick={() => setIsCartOpen(true)}
        className="flex flex-col items-center gap-0.5 text-[10px] font-extrabold text-emerald-700 relative"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <span>Cart</span>
      </button>
    </div>
  );
};

const MainContent = () => {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar />

      {/* Multi-Page Customer Routes */}
      <main className="flex-1">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<AllProductsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/categories" element={<AllCategoriesPage />} />
          <Route path="/category/:slug" element={<CategoryProductPage />} />
          <Route path="/category/:catId" element={<CategoryProductPage />} />
          <Route path="/brand/:brandName" element={<BrandPageView />} />
          <Route path="/brand/:brandId" element={<BrandPageView />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/cart" element={<AllProductsPage />} />
          <Route path="/track" element={<TrackOrderPage />} />
          <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
          <Route path="/replacement-policy" element={<ReplacementPolicyPage />} />
          <Route path="/terms-and-conditions" element={<TermsConditionsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Elements */}
      <FloatingWhatsApp />
      <MobileBottomDock />

      {/* Global Modals & Overlay Drawers */}
      <PhoneAuthModal />
      <AccountModal />
      <CartDrawer />
      <CheckoutModal />
      <ProductDetailModal />

      {/* Toast Notification */}
      <ToastNotification />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <BrowserRouter>
          <ScrollToTop />
          <MainContent />
        </BrowserRouter>
      </StoreProvider>
    </ErrorBoundary>
  );
}
