import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    setIsOtpOpen,
    setPendingCheckout,
    user,
    updateCartQty,
    removeFromCart,
    cartSubtotal
  } = useStore();

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    if (!user) {
      setPendingCheckout(true);
      setIsOtpOpen(true);
    } else {
      setIsCheckoutOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end items-end md:items-stretch animate-fadeIn">
      {/* Slide Drawer Panel (Mobile Bottom Sheet / Desktop Sidebar) */}
      <div className="relative w-full max-w-lg bg-white border-l border-slate-200 h-[92vh] md:h-full rounded-t-3xl md:rounded-none flex flex-col justify-between shadow-2xl text-slate-900 overflow-hidden pb-16 md:pb-0">
        
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2 md:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 md:py-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">My Cart ({cart?.length || 0} items)</h3>
              <p className="text-[10px] text-slate-500 font-semibold">
                {cart?.length === 0 ? 'Cart is empty' : 'Free Express Mysore Air Shipping'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {(!cart || cart.length === 0) ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-2xl">
                🛒
              </div>
              <h4 className="text-lg font-bold text-slate-900">Your Cart is Empty</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto font-medium">
                Browse our high-performance 6S monster trucks, rock crawlers, and spare parts.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-xs active:scale-95 transition-all"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex gap-3.5 items-center shadow-xs hover:shadow-md transition-shadow"
                >
                  <img
                    src={item.image}
                    loading="lazy"
                    decoding="async"
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-50"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">
                      {item.title}
                    </h4>
                    
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <div className="text-[10px] text-emerald-700 font-bold mt-0.5 line-clamp-1">
                        + {item.selectedAddons.join(', ')}
                      </div>
                    )}

                    <div className="text-sm font-black text-emerald-700 mt-1">
                      ₹{item.price.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end justify-between gap-2">
                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
                      <button
                        onClick={() => updateCartQty(item.cartItemId, -1)}
                        className="text-slate-500 hover:text-slate-900"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-extrabold text-slate-900 px-1">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.cartItemId, 1)}
                        className="text-slate-500 hover:text-slate-900"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Bill Details Breakdown Section */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs text-slate-600 font-semibold mt-4">
                <div className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                  Bill Details
                </div>
                <div className="flex justify-between">
                  <span>Item Total ({cart?.length} items):</span>
                  <span className="font-bold text-slate-900">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Packaging & Air Express Shipping:</span>
                  <span className="font-bold text-emerald-700">FREE (Rs 0)</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Payable:</span>
                  <span className="text-emerald-700 text-base">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary & Proceed Buttons */}
        {cart && cart.length > 0 && (
          <>
            {/* Desktop Action Bar */}
            <div className="hidden md:block p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              <div className="space-y-1.5 text-xs text-slate-600 font-semibold">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Express Mysore Shipping:</span>
                  <span className="font-bold text-emerald-700">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="text-emerald-700 text-base">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>PROCEED TO SECURE CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Flipkart-Style Fixed Sticky Bottom Bar (< 768px) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 px-4 flex items-center justify-between z-50 shadow-lg">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Total Payable</div>
                <div className="text-lg font-black text-emerald-700 leading-tight">
                  ₹{cartSubtotal.toLocaleString('en-IN')}
                </div>
              </div>
              <button
                onClick={handleProceedToCheckout}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-6 py-3 rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                <span>Place Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
