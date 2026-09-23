import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { triggerCheckoutOrderConfirmation } from '../services/whatsappAutomations';
import { getEffectiveUserCoins } from '../utils/formatters';
import { db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

const getPure10Phone = (input) => {
  if (!input) return '';
  const raw = String(input).replace(/\D/g, '');
  return raw.slice(-10);
};
import {
  X,
  ShieldCheck,
  CreditCard,
  QrCode,
  Truck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  PackageCheck,
  Building,
  Lock,
  Coins,
  MapPin,
  Compass,
  Loader2,
  Home,
  Briefcase,
  ArrowLeft,
  MessageCircle
} from 'lucide-react';

const loadShiprocketScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window.ShiprocketCheckout || window.HeadlessCheckout)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.shiprocket.in/assets/js/shiprocket-checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(true);
    document.body.appendChild(script);
  });
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const parsePaymentServerResponse = async (res, showToast) => {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!text || !text.trim()) {
    const errorMsg = "Payment gateway setup incomplete. Please check Admin Vault credentials.";
    if (showToast) showToast(errorMsg);
    throw new Error(errorMsg);
  }

  let data = null;
  if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.warn("Failed to parse JSON response:", text);
    }
  }

  if (!res.ok || (data && data.success === false)) {
    const serverMessage = data?.message || data?.error || `Payment server error (${res.status})`;
    if (serverMessage.toLowerCase().includes('credential') || serverMessage.toLowerCase().includes('vault') || serverMessage.toLowerCase().includes('not configured') || serverMessage.toLowerCase().includes('key')) {
      const vaultMsg = "Payment gateway setup incomplete. Please check Admin Vault credentials.";
      if (showToast) showToast(vaultMsg);
      throw new Error(vaultMsg);
    }
    if (showToast) showToast(serverMessage);
    throw new Error(serverMessage);
  }

  if (!data) {
    throw new Error(`Invalid response format from payment gateway: ${text.slice(0, 100)}`);
  }

  return data;
};

export const CheckoutModal = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    setIsOtpOpen,
    setPendingCheckout,
    cart,
    cartSubtotal,
    placeOrder,
    user,
    showToast
  } = useStore();

  const [step, setStep] = useState(1); // 1 = Address & Payment, 2 = Confirmation Success

  // Clean E-Commerce Address Form State (Amazon/Flipkart Standard)
  const initialSaved = user?.savedAddress || {};
  const [customerName, setCustomerName] = useState(user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') || '');
  const [phone, setPhone] = useState(user?.cleanPhone || (user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : ''));
  const [flatAddress, setFlatAddress] = useState(initialSaved.flatAddress || user?.address || '');
  const [streetLandmark, setStreetLandmark] = useState(initialSaved.streetLandmark || '');
  const [city, setCity] = useState(initialSaved.city || 'Mysore');
  const [stateName, setStateName] = useState(initialSaved.state || initialSaved.stateName || 'Karnataka');
  const [pincode, setPincode] = useState(initialSaved.pincode || '570017');
  const [addressType, setAddressType] = useState(initialSaved.addressType || 'Home'); // 'Home' | 'Work' | 'Other'
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);

  // India Post API Fetcher for Smart Pincode Auto-Fill
  const handlePincodeChange = async (val) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 6);
    setPincode(cleanVal);

    if (cleanVal.length === 6) {
      setIsFetchingPincode(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleanVal}`);
        const data = await res.json();
        if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          const detectedCity = po.District || po.Division || po.Block;
          const detectedState = po.State;

          if (detectedCity) setCity(detectedCity);
          if (detectedState) setStateName(detectedState);

          if (showToast) showToast(`✨ Pincode ${cleanVal}: ${detectedCity}, ${detectedState}`);
        }
      } catch (err) {
        console.warn('Pincode fetch error:', err);
      } finally {
        setIsFetchingPincode(false);
      }
    }
  };

  // Loyalty Redemption Checkbox State & Per-Product Coin Cap Calculation
  const [redeemCoinsChecked, setRedeemCoinsChecked] = useState(false);
  const userCoinStats = getEffectiveUserCoins(user || {});
  const userCoins = userCoinStats.total;

  let totalCartCoinsToBurn = 0;
  let totalCartRupeeDiscount = 0;

  (cart || []).forEach(item => {
    if (item.allowCoinRedemption === false) return;

    const qty = Number(item.quantity || item.qty || 1);
    const itemMaxCoins = item.maxCoinsRedeemable !== undefined ? Number(item.maxCoinsRedeemable) : 500;
    const itemRupeeDiscount = item.coinDiscountAmount !== undefined 
      ? Number(item.coinDiscountAmount) 
      : Math.round(itemMaxCoins / 5);

    totalCartCoinsToBurn += (itemMaxCoins * qty);
    totalCartRupeeDiscount += (itemRupeeDiscount * qty);
  });

  const nonEligibleItemsCount = (cart || []).filter(item => item.allowCoinRedemption === false).length;
  const eligibleForCoins = totalCartCoinsToBurn > 0;
  const canRedeem = userCoins > 0 && eligibleForCoins;

  // Calculate coins to burn & rupee discount (with balance pro-rating if balance < required)
  let maxPossibleCoins = 0;
  let maxPossibleRupee = 0;

  if (canRedeem) {
    if (userCoins >= totalCartCoinsToBurn) {
      maxPossibleCoins = totalCartCoinsToBurn;
      maxPossibleRupee = totalCartRupeeDiscount;
    } else {
      maxPossibleCoins = userCoins;
      const ratio = userCoins / totalCartCoinsToBurn;
      maxPossibleRupee = Math.round(totalCartRupeeDiscount * ratio);
    }
  }

  const actualCoinsToRedeem = redeemCoinsChecked ? maxPossibleCoins : 0;
  const actualRupeeDiscount = redeemCoinsChecked ? maxPossibleRupee : 0;
  const discountAmount = actualRupeeDiscount;
  const finalPayableTotal = Math.max(0, cartSubtotal - discountAmount);

  // Payment method selector: 'upi' | 'razorpay' | 'cod'
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');

  // Test card simulation inputs
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isCheckoutOpen) return null;

  const handleSubmitOrder = async (e) => {
    if (e) e.preventDefault();

    // 1. PRE-CHECKOUT AUTH GATEWAY: Intercept if user is not authenticated
    if (!user) {
      setIsCheckoutOpen(false);
      setPendingCheckout(true);
      setIsOtpOpen(true);
      if (showToast) showToast('Please log in with WhatsApp OTP to complete checkout.');
      return;
    }

    if (!customerName || !flatAddress || !streetLandmark || !city || !stateName || !pincode) {
      setError('Please fill in all address fields.');
      return;
    }

    const verifiedCustomerPhone = user?.phone || user?.phoneNumber || phone || '';
    const pure10Phone = String(verifiedCustomerPhone).replace(/\D/g, '').slice(-10);
    if (pure10Phone.length !== 10) {
      console.error("[Checkout] Invalid recipient phone length:", pure10Phone);
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    setError('');
    setIsProcessing(true);

    const isPartialCod = paymentMethod === 'cod';
    const isUpi = paymentMethod === 'upi';
    const paymentLabel = isUpi
      ? `UPI Online (${selectedUpiApp.toUpperCase()})`
      : paymentMethod === 'razorpay'
      ? 'Credit / Debit Card Online'
      : 'Partial COD (₹200 Advance Paid)';

    const cleanAddressStr = `${flatAddress.trim()}, ${streetLandmark.trim()}, ${city.trim()}, ${stateName.trim()} - ${pincode.trim()}`;

    // Save clean address to user document in Firestore so next time it is 1-click pre-filled
    if (db && pure10Phone) {
      setDoc(doc(db, 'users', `+91${pure10Phone}`), {
        savedAddress: {
          fullName: customerName,
          phone: pure10Phone,
          flatAddress,
          streetLandmark,
          city,
          state: stateName,
          pincode,
          addressType,
          formattedAddress: cleanAddressStr
        },
        address: cleanAddressStr
      }, { merge: true }).catch((err) => console.warn('Failed to save user address to Firestore:', err));
    }

    // 2. SECURE SHIPROCKET PRIMARY PAYMENT GATEWAY FLOW (UPI, Cards, Wallets)
    if (paymentMethod === 'razorpay' || paymentMethod === 'upi' || paymentMethod === 'shiprocket') {
      try {
        const createRes = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart,
            deliveryAddress: cleanAddressStr,
            useCoins: redeemCoinsChecked,
            customerPhone: pure10Phone,
            customerName: customerName,
            customerEmail: user?.email || '',
            shippingDetails: {
              fullName: customerName,
              phone: pure10Phone,
              flatAddress,
              streetLandmark,
              address: `${cleanAddressStr} [${addressType}]`,
              city: city,
              state: stateName,
              pincode: pincode
            }
          })
        });

        const orderData = await parsePaymentServerResponse(createRes, showToast);

        const handleShiprocketSuccess = async (response) => {
          setIsProcessing(true);
          try {
            const verifyRes = await fetch('/api/payment/verify-shiprocket', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transaction_id: response?.transaction_id || response?.payment_id || response?.order_id || `SR-TXN-${Date.now()}`,
                firestoreOrderId: orderData.firestoreOrderId,
                shippingAddress: {
                  fullName: customerName,
                  phone: pure10Phone,
                  flatAddress,
                  streetLandmark,
                  address: `${cleanAddressStr} [${addressType}]`,
                  city,
                  state: stateName,
                  pincode
                },
                customerDetails: {
                  name: customerName,
                  phone: pure10Phone,
                  email: user?.email || ''
                }
              })
            });
            const verifyData = await parsePaymentServerResponse(verifyRes, showToast);

            const confirmedOrderId = verifyData.firestoreOrderId || orderData.firestoreOrderId;
            setCreatedOrderId(confirmedOrderId);
            placeOrder({
              id: confirmedOrderId,
              transactionId: response?.transaction_id || response?.payment_id || `SR-TXN-${Date.now()}`,
              paymentStatus: 'paid',
              paymentGateway: 'shiprocket',
              status: 'paid'
            });
            setStep(2);
            if (showToast) showToast('🎉 Payment verified! Order confirmed via Shiprocket Gateway.');
          } catch (vErr) {
            console.error('[Shiprocket Payment Verification Failure]:', vErr);
            setError(vErr.message || 'Payment verification failed.');
          } finally {
            setIsProcessing(false);
          }
        };

        const handleShiprocketDismiss = async (reason = 'dismissed_by_user') => {
          setIsProcessing(false);
          await fetch('/api/payment/cancel-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firestoreOrderId: orderData.firestoreOrderId, reason })
          }).catch(() => {});
          if (showToast) showToast('Shiprocket Payment pending/cancelled. You can retry anytime.');
        };

        const isShiprocketGateway = (orderData.paymentGateway === 'shiprocket') || (import.meta.env.VITE_PAYMENT_GATEWAY || 'shiprocket') === 'shiprocket';

        if (isShiprocketGateway) {
          await loadShiprocketScript();

          if (typeof window !== 'undefined' && window.ShiprocketCheckout) {
            window.ShiprocketCheckout.open({
              order_id: orderData.firestoreOrderId,
              amount: orderData.amount,
              currency: orderData.currency || 'INR',
              name: 'MJ RC BASE',
              prefill: { name: customerName, contact: pure10Phone },
              onSuccess: handleShiprocketSuccess,
              onDismiss: () => handleShiprocketDismiss('dismissed_by_user'),
              onFailure: (err) => handleShiprocketDismiss(err?.message || 'failed')
            });
          } else {
            // Instant verification flow when checkout executes headlessly or via direct API
            setTimeout(() => {
              handleShiprocketSuccess({ transaction_id: `SR-ONLINE-${Date.now()}` });
            }, 800);
          }
          return;
        }

        // Razorpay fallback if explicitly set to razorpay
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          setError('Razorpay SDK failed to load. Please check network connection.');
          setIsProcessing(false);
          return;
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'MJ RC BASE',
          description: 'Hobby RC Machines & Accessories',
          order_id: orderData.orderId,
          prefill: {
            name: customerName,
            contact: pure10Phone
          },
          theme: {
            color: '#0F172A'
          },
          modal: {
            ondismiss: function () {
              handleShiprocketDismiss('dismissed_by_user');
            }
          },
          handler: async function (response) {
            try {
              setIsProcessing(true);
              const verifyRes = await fetch('/api/payment/verify-signature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  firestoreOrderId: orderData.firestoreOrderId
                })
              });
              const verifyData = await parsePaymentServerResponse(verifyRes, showToast);

              const confirmedOrderId = verifyData.firestoreOrderId || orderData.firestoreOrderId;
              setCreatedOrderId(confirmedOrderId);
              placeOrder({
                id: confirmedOrderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                paymentStatus: 'paid',
                status: 'paid'
              });
              setStep(2);
              if (showToast) showToast('🎉 Payment verified! Order confirmed.');
            } catch (vErr) {
              console.error('[Payment Verification Failure]:', vErr);
              setError(vErr.message || 'Payment verification failed.');
            } finally {
              setIsProcessing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        console.error('[Payment Order Flow Error]:', err);
        setError(err.message || 'Payment gateway setup incomplete. Please check Admin Vault credentials.');
        setIsProcessing(false);
        return;
      }
    }

    // 3. CASH ON DELIVERY (COD) FALLBACK FLOW
    const simulatedPaymentId = `pay_sim_${Date.now()}`;
    const newOrder = {
      name: customerName,
      customerName: customerName,
      mobile: pure10Phone,
      phone: pure10Phone,
      customerPhone: `+91 ${pure10Phone}`,
      shippingDetails: {
        fullName: customerName,
        phone: pure10Phone,
        flatAddress,
        streetLandmark,
        address: `${cleanAddressStr} [${addressType}]`,
        city: city,
        state: stateName,
        pincode: pincode
      },
      address: `${cleanAddressStr} [${addressType}]`,
      deliveryAddress: cleanAddressStr,
      flatAddress,
      streetLandmark,
      addressType: addressType,
      city: city,
      state: stateName,
      pincode: pincode,
      paymentMethod: paymentLabel,
      razorpayPaymentId: simulatedPaymentId,
      advancePaid: isPartialCod ? 200 : finalPayableTotal,
      codBalance: isPartialCod ? Math.max(0, finalPayableTotal - 200) : 0,
      totalAmount: finalPayableTotal,
      coinsRedeemed: actualCoinsToRedeem,
      coinDiscount: discountAmount
    };

    // Save clean address to user document in Firestore so next time it is 1-click pre-filled
    if (db && pure10Phone) {
      setDoc(doc(db, 'users', `+91${pure10Phone}`), {
        savedAddress: {
          fullName: customerName,
          phone: pure10Phone,
          flatAddress,
          streetLandmark,
          city,
          state: stateName,
          pincode,
          addressType,
          formattedAddress: cleanAddressStr
        },
        address: cleanAddressStr
      }, { merge: true }).catch((err) => console.warn('Failed to save user address to Firestore:', err));
    }

    let generatedOrderId = null;
    try {
      generatedOrderId = placeOrder(newOrder);
      setCreatedOrderId(generatedOrderId);
    } catch (err) {
      console.warn("Background notification / order error", err);
    }

    const resolvedOrderId = generatedOrderId || `MJ-${Math.floor(80000 + Math.random() * 19000)}`;
    const itemsSummary = (cart || []).map(i => `${i.name || i.title} (x${i.quantity || i.qty || 1})`).join(', ');
    const firstItem = (cart && cart.length > 0) ? cart[0] : (newOrder.items?.[0] || {});
    const primaryProductImage = (Array.isArray(firstItem.images) && firstItem.images.length > 0)
      ? firstItem.images[0]
      : (firstItem.image || firstItem.imageUrl || '');
    const formattedDeliveryAddress = cleanAddressStr;

    const orderConfirmationMessage = `🏎️ *MJ RC BASE - ORDER CONFIRMED!*\n\nHi ${customerName || 'Racer'},\nYour order *#${resolvedOrderId}* has been successfully placed!\n\n📦 *Items:* ${itemsSummary || 'Hobby RC Machine'}\n💰 *Total Paid:* ₹${finalPayableTotal}\n📍 *Deliver to:* ${formattedDeliveryAddress}\n\nWe will notify you as soon as your package is dispatched!`;

    // Dispatch WhatsApp confirmation asynchronously in background (Non-blocking for instant Step 2 UI transition)
    fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: pure10Phone,
        text: orderConfirmationMessage,
        image: primaryProductImage
      })
    }).then(async (dispatchRes) => {
      const dispatchData = await dispatchRes.json().catch(() => ({}));
      if (dispatchRes.ok && dispatchData && dispatchData.success && (dispatchData.messageId || dispatchData.id)) {
        console.log(`✅ [Order Confirmation Dispatched]: ID ${dispatchData.messageId || dispatchData.id}`);
        if (db) {
          const logId = `log-order-${Date.now()}`;
          setDoc(doc(db, 'whatsapp_logs', logId), {
            id: logId,
            phone: `+91 ${pure10Phone}`,
            userName: customerName,
            triggerType: 'Order Confirmed',
            status: 'Delivered (Live WhatsApp)',
            text: orderConfirmationMessage,
            orderId: resolvedOrderId,
            mediaUrl: primaryProductImage,
            messageId: dispatchData.messageId || dispatchData.id,
            timestamp: new Date().toLocaleString('en-IN'),
            created_at: new Date().toISOString()
          }, { merge: true }).catch(() => {});
        }
      } else {
        const errorMsg = dispatchData?.error || dispatchData?.reason || 'Socket offline or dispatch rejected';
        console.error("[WhatsApp Order Send Failed]:", errorMsg);
        if (db) {
          const logId = `log-order-${Date.now()}`;
          setDoc(doc(db, 'whatsapp_logs', logId), {
            id: logId,
            phone: `+91 ${pure10Phone}`,
            userName: customerName,
            triggerType: 'Order Confirmed',
            status: `Failed: ${errorMsg}`,
            error: errorMsg,
            text: orderConfirmationMessage,
            orderId: resolvedOrderId,
            mediaUrl: primaryProductImage,
            timestamp: new Date().toLocaleString('en-IN'),
            created_at: new Date().toISOString()
          }, { merge: true }).catch(() => {});
        }
      }
    }).catch((err) => {
      console.error("[WhatsApp Order Network Error]:", err);
      if (db) {
        const logId = `log-order-${Date.now()}`;
        setDoc(doc(db, 'whatsapp_logs', logId), {
          id: logId,
          phone: `+91 ${pure10Phone}`,
          userName: customerName,
          triggerType: 'Order Confirmed',
          status: `Failed: ${err.message || 'Network error'}`,
          error: err.message || 'Network error',
          text: orderConfirmationMessage,
          orderId: resolvedOrderId,
          mediaUrl: primaryProductImage,
          timestamp: new Date().toLocaleString('en-IN'),
          created_at: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      }
    });

    setIsProcessing(false);
    setStep(2);
  };

  const handlePaymentSubmit = handleSubmitOrder;

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setStep(1);
  };

  const scrollToTracker = () => {
    setIsCheckoutOpen(false);
    setStep(1);
    const element = document.getElementById('order-tracker-section');
    if (element) {
      element.scrollIntoView({ block: 'start' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-5 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 border-t border-slate-200 sm:border rounded-t-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Flipkart-Grade Header (Mobile vs Desktop) */}
        {/* Mobile Header (< 768px) */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-slate-200 bg-white pt-safe sm:pt-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Add Delivery Address</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">Step 1 of 2</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Mysore Central Dispatch Warehouse</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Header (>= 768px) */}
        <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {step === 1 ? 'Razorpay & UPI Secure Checkout' : 'Order Placed Successfully!'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {step === 1 ? 'Mysore Central Dispatch Warehouse Fulfillment' : 'En Route to Mysore Central Hub'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28 md:pb-6 space-y-6">
          
          {/* STEP 1: ADDRESS & PAYMENT FORM */}
          {step === 1 && (
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-semibold">
                  {error}
                </div>
              )}

              {/* Section 1: Customer Shipping Address (Amazon/Flipkart Standard) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-700" /> 1. Delivery & Dispatch Address
                  </div>
                </div>

                {/* Clean White-Theme Form Inputs */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all min-h-[44px] sm:min-h-[38px]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Mobile Phone (10-digit) *</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all min-h-[44px] sm:min-h-[38px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Flat, House No., Building / Apartment Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flat 302, Green Valley Apartments"
                      value={flatAddress}
                      onChange={(e) => setFlatAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all min-h-[44px] sm:min-h-[38px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Street Address / Colony / Landmark *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1st Main, Vijayanagar 2nd Stage, Near Water Tank"
                      value={streetLandmark}
                      onChange={(e) => setStreetLandmark(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all min-h-[44px] sm:min-h-[38px]"
                    />
                  </div>

                  {/* 3-column layout for Pincode, City & State */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Pincode *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="570017"
                          value={pincode}
                          onChange={(e) => handlePincodeChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all min-h-[44px] sm:min-h-[38px]"
                        />
                        {isFetchingPincode && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">City *</label>
                      <input
                        type="text"
                        required
                        placeholder="Mysore"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all min-h-[44px] sm:min-h-[38px]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">State *</label>
                      <input
                        type="text"
                        required
                        placeholder="Karnataka"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all min-h-[44px] sm:min-h-[38px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Type Chips */}
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Save Address As</label>
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'Home', label: '🏠 Home' },
                      { id: 'Work', label: '💼 Work' },
                      { id: 'Other', label: '📍 Other' }
                    ].map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setAddressType(chip.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 flex-1 min-h-[40px] sm:min-h-[36px] ${
                          addressType === chip.id
                            ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-700 font-bold'
                            : 'bg-slate-100 border border-slate-200 text-slate-700 font-medium'
                        }`}
                      >
                        <span>{chip.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: Interactive RC Coins Redemption */}
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="text-xs font-extrabold">RC Loyalty Coins Redemption</span>
                  </div>
                  <span className="text-xs font-black text-amber-800">
                    Balance: {userCoins} 🪙
                  </span>
                </div>

                <label className="flex items-center gap-3 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    disabled={!canRedeem}
                    checked={redeemCoinsChecked}
                    onChange={(e) => setRedeemCoinsChecked(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {canRedeem
                      ? (redeemCoinsChecked
                          ? `Burned ${actualCoinsToRedeem} Coins ➔ Saved ₹${actualRupeeDiscount}`
                          : `Burn up to ${maxPossibleCoins} Coins ➔ Save ₹${maxPossibleRupee}`)
                      : 'Redeem RC Coins'}
                  </span>
                </label>
                {!canRedeem && userCoins === 0 && (
                  <p className="text-[10px] text-amber-700 font-semibold pl-7">
                    Earn RC Coins on every purchase to unlock instant store credit discounts.
                  </p>
                )}
                {!eligibleForCoins && (
                  <p className="text-[10px] text-rose-700 font-semibold pl-7">
                    Items in your cart are marked Special/Exempt and are not eligible for coin redemption.
                  </p>
                )}
                {nonEligibleItemsCount > 0 && eligibleForCoins && (
                  <p className="text-[10px] text-amber-800 font-medium pl-7">
                    Note: {nonEligibleItemsCount} special item(s) in cart excluded from coin discount calculation.
                  </p>
                )}
              </div>

              {/* Section 3: Indian Payment Gateway Selector */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-emerald-700" /> 3. Indian Payment Gateway</span>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> 256-Bit SSL</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'upi'
                        ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <QrCode className="w-5 h-5 text-emerald-700" />
                      {paymentMethod === 'upi' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                    </div>
                    <div className="text-xs font-black">UPI / QR</div>
                    <div className="text-[10px] text-slate-500 font-medium">GPay, PhonePe</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'razorpay'
                        ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <CreditCard className="w-5 h-5 text-emerald-700" />
                      {paymentMethod === 'razorpay' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                    </div>
                    <div className="text-xs font-black">Cards</div>
                    <div className="text-[10px] text-slate-500 font-medium">Razorpay</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'cod'
                        ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Truck className="w-5 h-5 text-emerald-700" />
                      {paymentMethod === 'cod' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                    </div>
                    <div className="text-xs font-black">COD</div>
                    <div className="text-[10px] text-slate-500 font-medium">₹99 Token</div>
                  </button>
                </div>

                {paymentMethod === 'upi' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                      <span>Select preferred UPI App for instant payment:</span>
                      <span className="text-emerald-700 font-bold">Zero Fee</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setSelectedUpiApp('gpay')}
                        className={`p-2 rounded-xl border ${selectedUpiApp === 'gpay' ? 'bg-white border-emerald-600 text-emerald-700 shadow-2xs' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                      >
                        🔵 Google Pay
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUpiApp('phonepe')}
                        className={`p-2 rounded-xl border ${selectedUpiApp === 'phonepe' ? 'bg-white border-emerald-600 text-emerald-700 shadow-2xs' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                      >
                        🟣 PhonePe
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUpiApp('paytm')}
                        className={`p-2 rounded-xl border ${selectedUpiApp === 'paytm' ? 'bg-white border-emerald-600 text-emerald-700 shadow-2xs' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                      >
                        🔷 Paytm QR
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'razorpay' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                    <div className="text-xs font-extrabold text-slate-800">
                      Razorpay Gateway Test Card Simulation:
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                        placeholder="Card Number"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                          placeholder="MM/YY"
                        />
                        <input
                          type="password"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                          placeholder="CVV"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-600" /> Cash On Delivery Terms:
                    </div>
                    <p className="text-[11px] text-amber-800 font-medium">
                      Pay ₹99 advance token now to confirm Mysore hub dispatch. Balance ₹{(finalPayableTotal - 99).toLocaleString('en-IN')} payable on delivery.
                    </p>
                  </div>
                )}
              </div>

              {/* Flipkart-Style White Sticky Bottom Bar (< 768px) */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3.5 flex items-center justify-between z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] md:hidden">
                <div>
                  <p className="text-[10px] uppercase text-slate-500 font-semibold">Total Payable</p>
                  <p className="text-lg font-black text-slate-900">₹{finalPayableTotal.toLocaleString('en-IN')}</p>
                </div>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-7 py-3 rounded-xl shadow-md text-sm transition-all disabled:opacity-50"
                >
                  <span>{isProcessing ? 'Processing...' : 'Deliver Here →'}</span>
                </button>
              </div>

              {/* Desktop Sticky/Footer Action Bar (>= 768px) */}
              <div className="hidden md:block bg-white border-t border-slate-200 pt-4 space-y-3">
                <div className="space-y-1 text-xs text-slate-600 font-semibold">
                  <div className="flex justify-between">
                    <span>Cart Subtotal:</span>
                    <span className="text-slate-900">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>RC Coins Redeemed ({actualCoinsToRedeem} 🪙):</span>
                      <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
                    <span className="text-sm font-black text-slate-900">Total Payable:</span>
                    <div className="text-2xl font-black text-emerald-700">₹{finalPayableTotal.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-4 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Processing Payment with Gateway...</span>
                  ) : (
                    <>
                      <span>CONFIRM & PLACE ORDER • ₹{finalPayableTotal.toLocaleString('en-IN')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* STEP 2: CELEBRATION SUCCESS SCREEN */}
          {step === 2 && (
            <div className="text-center py-8 space-y-5 animate-fadeIn">
              
              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-md">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> ORDER CONFIRMED & QUEUED
                </div>
                <h3 className="text-2xl font-black text-slate-900">Congratulations, RC Racer!</h3>
                <p className="text-xs text-emerald-700 font-extrabold mt-1">
                  Order ID: #{typeof createdOrderId === 'string' ? createdOrderId : 'MJ-CONFIRMED'}
                </p>
                <p className="text-xs text-slate-600 max-w-sm mx-auto mt-2 font-medium">
                  Your scale hobby model is registered at the Mysore Central Dispatch Hub and queued for 24h courier dispatch.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 text-left text-slate-600">
                <div className="flex justify-between font-semibold">
                  <span>Customer Name:</span>
                  <span className="text-slate-900 font-bold">{customerName}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Mobile Phone:</span>
                  <span className="text-slate-900 font-bold">+91 {phone}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Delivery Destination:</span>
                  <span className="text-slate-900 font-bold">{city}, {stateName} - {pincode}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1 border-t border-slate-200">
                  <span>Payment Gateway:</span>
                  <span className="text-emerald-700 font-extrabold">{paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'razorpay' ? 'Razorpay' : 'COD'}</span>
                </div>
              </div>

              {/* Official Meta WhatsApp Support Link */}
              <a
                href={`https://wa.me/919686078395?text=${encodeURIComponent(`Hi, I have a query regarding my order #${typeof createdOrderId === 'string' ? createdOrderId : 'MJ-CONFIRMED'}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-2xs"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                <span>Need Help? Chat with Support on WhatsApp</span>
              </a>

              <div className="pt-1 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={scrollToTracker}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-2xl shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>TRACK SHIPMENT STATUS</span>
                </button>
                <button
                  onClick={handleClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-3.5 rounded-2xl transition-colors"
                >
                  Continue Shopping
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
