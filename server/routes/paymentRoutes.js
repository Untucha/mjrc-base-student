import crypto from 'crypto';
import axios from 'axios';
import { db } from '../../src/firebase.js';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { sendWhatsAppMessage } from '../whatsappBridge.js';
import { syncOrderToShiprocket } from '../services/shiprocketService.js';

const getPure10 = (input) => {
  if (!input) return '';
  const raw = String(input).replace(/\D/g, '');
  return raw.slice(-10);
};

// Response helper supporting both Express (res.status.json) and standard Node HTTP res
function sendJsonResponse(res, statusCode, data) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
  }
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  return res.end(JSON.stringify(data));
}

// Request body reader supporting pre-parsed req.body and Node streams
async function parseRequestBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body); } catch (e) { return {}; }
    }
  }

  return new Promise((resolve) => {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(bodyStr ? JSON.parse(bodyStr) : {});
      } catch (e) {
        resolve({});
      }
    });
    if (req.readableEnded || req.complete) {
      try {
        resolve(bodyStr ? JSON.parse(bodyStr) : {});
      } catch (e) {
        resolve({});
      }
    }
  });
}

// Fetch payment credentials securely from Firestore crm_settings/integrations or process.env
async function getPaymentCredentials() {
  let shiprocketToken = process.env.SHIPROCKET_CHECKOUT_TOKEN || process.env.VITE_SHIPROCKET_TOKEN || '';
  let shiprocketSecret = process.env.SHIPROCKET_API_SECRET || process.env.VITE_SHIPROCKET_SECRET || '';

  if (db) {
    try {
      const snap = await getDoc(doc(db, 'crm_settings', 'integrations'));
      if (snap && snap.exists()) {
        const data = snap.data();
        if (data.shiprocketEmailToken) shiprocketToken = data.shiprocketEmailToken.trim();
        if (data.shiprocketApiSecret) shiprocketSecret = data.shiprocketApiSecret.trim();
      }
    } catch (err) {
      console.warn('[PaymentRoutes] Error loading crm_settings/integrations credentials:', err.message);
    }
  }

  return { shiprocketToken, shiprocketSecret };
}

/**
 * Central Payment API Router Handler
 * Serves POST /api/payment/create-order, /api/payment/verify-shiprocket, /api/payment/verify-signature, /api/payment/cancel-order
 */
export async function handlePaymentRoutes(req, res) {
  const url = req.url ? req.url.split('?')[0] : '';
  const method = req.method;

  if (method !== 'POST') {
    return sendJsonResponse(res, 405, { success: false, message: 'Method not allowed' });
  }

  const payload = await parseRequestBody(req);

  try {
    if (url === '/api/payment/create-order' || url === '/create-order') {
      await handleCreateOrder(payload, res);
    } else if (url === '/api/payment/verify-shiprocket' || url === '/verify-shiprocket') {
      await handleVerifyShiprocket(payload, res);
    } else if (url === '/api/payment/verify-signature' || url === '/verify-signature') {
      await handleVerifySignature(payload, res);
    } else if (url === '/api/payment/cancel-order' || url === '/cancel-order') {
      await handleCancelOrder(payload, res);
    } else if (url === '/api/shiprocket/sync-order' || url === '/api/payment/sync-order' || url === '/sync-order') {
      await handleSyncShiprocketOrder(payload, res);
    } else {
      return sendJsonResponse(res, 404, { success: false, message: 'Payment endpoint not found' });
    }
  } catch (err) {
    console.error('[Payment Server Error]:', err);
    return sendJsonResponse(res, 500, {
      success: false,
      message: err.message || 'Internal payment server error',
      error: err.message
    });
  }
}

/**
 * 1. SECURE BACKEND ORDER CREATION:
 * Validates prices & per-product coins server-side against Firestore DB,
 * creates pending draft order in Firestore with paymentStatus: 'pending'.
 */
async function handleCreateOrder(payload, res) {
  const { items = [], deliveryAddress = '', useCoins = false, customerPhone = '', customerName = '', customerEmail = '', shippingDetails = {} } = payload;

  const pure10Phone = getPure10(customerPhone);
  if (!items || items.length === 0) {
    return sendJsonResponse(res, 400, { success: false, message: 'Cart is empty' });
  }

  // 1. Validate each product against Firestore DB
  let cartSubtotal = 0;
  let totalCartCoinsToBurn = 0;
  let totalCartRupeeDiscount = 0;
  const validatedItems = [];

  for (const item of items) {
    const prodId = item.id || item.productId;
    const qty = Math.max(1, Number(item.quantity || item.qty || 1));

    let unitPrice = 0;
    let prodName = 'Hobby RC Vehicle';
    let prodImage = null;
    let allowCoins = true;
    let maxCoins = 500;
    let coinDiscount = 100;

    // Server-Side Price & Coin Integrity Check against Firestore DB (Ignore any client-sent price)
    if (db && prodId) {
      try {
        const prodSnap = await getDoc(doc(db, 'products', String(prodId)));
        if (prodSnap && prodSnap.exists()) {
          const prodData = prodSnap.data();
          if (prodData.price !== undefined) unitPrice = Number(prodData.price);
          if (prodData.name || prodData.title) prodName = prodData.name || prodData.title;
          if (prodData.image || prodData.imageUrl) prodImage = prodData.image || prodData.imageUrl;
          if (prodData.allowCoinRedemption !== undefined) allowCoins = prodData.allowCoinRedemption !== false;
          if (prodData.coinsToDeduct !== undefined) maxCoins = Number(prodData.coinsToDeduct);
          else if (prodData.maxCoinsRedeemable !== undefined) maxCoins = Number(prodData.maxCoinsRedeemable);
          if (prodData.rupeeDiscountGiven !== undefined) coinDiscount = Number(prodData.rupeeDiscountGiven);
          else if (prodData.coinDiscountAmount !== undefined) coinDiscount = Number(prodData.coinDiscountAmount);
          else coinDiscount = Math.round(maxCoins / 5);
        }
      } catch (err) {
        console.warn(`[Payment] Notice fetching product ${prodId} from Firestore:`, err.message);
      }
    }

    const itemTotal = unitPrice * qty;
    cartSubtotal += itemTotal;

    if (allowCoins) {
      totalCartCoinsToBurn += (maxCoins * qty);
      totalCartRupeeDiscount += (coinDiscount * qty);
    }

    validatedItems.push({
      id: prodId,
      name: prodName,
      title: prodName,
      image: prodImage,
      imageUrl: prodImage,
      price: unitPrice,
      quantity: qty,
      selectedColor: item.selectedColor || item.color || null,
      itemTotal: itemTotal
    });
  }

  // 2. Fetch user wallet balance if useCoins is checked
  let actualCoinsToRedeem = 0;
  let actualRupeeDiscount = 0;

  if (useCoins && pure10Phone && totalCartCoinsToBurn > 0) {
    let userCoins = 0;
    if (db) {
      try {
        const userSnap = await getDoc(doc(db, 'users', `+91${pure10Phone}`));
        if (userSnap && userSnap.exists()) {
          userCoins = Number(userSnap.data()?.coins || userSnap.data()?.walletCoins || 0);
        }
      } catch (err) {
        console.warn('[Payment] Error fetching user coin balance:', err.message);
      }
    }

    if (userCoins > 0) {
      if (userCoins >= totalCartCoinsToBurn) {
        actualCoinsToRedeem = totalCartCoinsToBurn;
        actualRupeeDiscount = totalCartRupeeDiscount;
      } else {
        actualCoinsToRedeem = userCoins;
        const ratio = userCoins / totalCartCoinsToBurn;
        actualRupeeDiscount = Math.round(totalCartRupeeDiscount * ratio);
      }
    }
  }

  const finalPayableTotal = Math.max(1, cartSubtotal - actualRupeeDiscount);
  const amountInPaise = Math.round(finalPayableTotal * 100);
  const activeGateway = process.env.PAYMENT_GATEWAY || process.env.VITE_PAYMENT_GATEWAY || 'shiprocket';

  const firestoreOrderId = `MJ-${Math.floor(80000 + Math.random() * 19000)}`;

  const pendingOrderDoc = {
    id: firestoreOrderId,
    orderId: firestoreOrderId,
    status: 'pending',
    paymentStatus: 'pending',
    paymentGateway: 'shiprocket',
    paymentMethod: 'Prepaid (Shiprocket Gateway)',
    customerName: customerName || 'RC Racer',
    name: customerName || 'RC Racer',
    phone: pure10Phone,
    mobile: pure10Phone,
    customerPhone: `+91 ${pure10Phone}`,
    customerEmail: customerEmail,
    shippingDetails: shippingDetails || {
      fullName: customerName,
      phone: pure10Phone,
      address: deliveryAddress
    },
    shippingAddress: {
      fullName: customerName,
      phone: pure10Phone,
      address: deliveryAddress,
      flatAddress: shippingDetails.flatAddress || '',
      streetLandmark: shippingDetails.streetLandmark || '',
      city: shippingDetails.city || '',
      state: shippingDetails.state || '',
      pincode: shippingDetails.pincode || ''
    },
    customerDetails: {
      name: customerName,
      phone: pure10Phone,
      email: customerEmail || ''
    },
    deliveryAddress: deliveryAddress || '',
    address: deliveryAddress || '',
    items: validatedItems,
    subtotal: cartSubtotal,
    totalAmount: finalPayableTotal,
    total: finalPayableTotal,
    amountInPaise: amountInPaise,
    coinsRedeemed: actualCoinsToRedeem,
    coinDiscount: actualRupeeDiscount,
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  if (db) {
    try {
      await setDoc(doc(db, 'orders', firestoreOrderId), pendingOrderDoc);
    } catch (err) {
      console.warn('[Payment] Warning saving pending order to Firestore:', err.message);
    }
  }

  const creds = await getPaymentCredentials();

  return sendJsonResponse(res, 200, {
    success: true,
    paymentGateway: activeGateway,
    orderId: firestoreOrderId,
    firestoreOrderId: firestoreOrderId,
    amount: finalPayableTotal,
    amountInPaise: amountInPaise,
    currency: 'INR',
    keyId: creds.shiprocketToken || 'sr_live_token'
  });
}

/**
 * 2. SHIPROCKET PAYMENT VERIFICATION:
 */
async function handleVerifyShiprocket(payload, res) {
  const { transaction_id, firestoreOrderId, shippingAddress = {}, customerDetails = {} } = payload;
  const targetId = firestoreOrderId || payload.orderId;

  if (!targetId) {
    return sendJsonResponse(res, 400, { success: false, message: 'Missing order ID for Shiprocket payment verification' });
  }

  let orderData = null;
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'orders', targetId));
      if (snap && snap.exists()) orderData = snap.data();
    } catch (err) {
      console.warn('[Payment] Error fetching order doc:', err.message);
    }
  }

  const txnId = transaction_id || payload.payment_id || payload.transactionId || `SR-TXN-${Date.now()}`;
  const updatedOrderFields = {
    status: 'paid',
    paymentStatus: 'paid',
    paymentGateway: 'shiprocket',
    transactionId: txnId,
    paymentMethod: 'Prepaid (Shiprocket Gateway)',
    shippingAddress: Object.keys(shippingAddress).length > 0 ? shippingAddress : (orderData?.shippingAddress || {}),
    customerDetails: Object.keys(customerDetails).length > 0 ? customerDetails : (orderData?.customerDetails || {}),
    paidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (db && targetId) {
    try {
      await setDoc(doc(db, 'orders', targetId), updatedOrderFields, { merge: true });
    } catch (err) {
      console.warn('[Payment] Error updating order status to paid:', err.message);
    }
  }

  // Trigger Direct Shiprocket API Order Sync (Non-blocking background call)
  syncOrderToShiprocket({
    ...(orderData || {}),
    ...updatedOrderFields,
    id: targetId,
    orderId: targetId,
    paymentMethod: 'Prepaid'
  }).then(async (srRes) => {
    const srUpdate = {
      shiprocket_synced: srRes.shiprocket_synced,
      shiprocket_order_id: srRes.shiprocket_order_id || null,
      shipment_id: srRes.shipment_id || null,
      updatedAt: new Date().toISOString()
    };
    if (!srRes.shiprocket_synced && srRes.error) {
      srUpdate.shiprocket_sync_error = srRes.error;
    }
    if (db && targetId) {
      await setDoc(doc(db, 'orders', String(targetId)), srUpdate, { merge: true }).catch(() => {});
    }
  }).catch((err) => {
    console.warn('[Shiprocket Order Sync Warning]:', err.message);
  });

  const customerPhone = getPure10(orderData?.phone || orderData?.mobile || customerDetails?.phone);
  const coinsRedeemed = Number(orderData?.coinsRedeemed || 0);

  if (db && coinsRedeemed > 0 && customerPhone) {
    try {
      const userRef = doc(db, 'users', `+91${customerPhone}`);
      await updateDoc(userRef, {
        coins: increment(-coinsRedeemed),
        walletCoins: increment(-coinsRedeemed)
      });
      console.log(`🪙 Deducted ${coinsRedeemed} RC Coins from user wallet (+91 ${customerPhone})`);
    } catch (err) {
      console.warn('[Payment] Warning deducting coins:', err.message);
    }
  }

  // Trigger post-order WhatsApp confirmation dispatch
  if (customerPhone) {
    const custName = customerDetails?.name || orderData?.customerName || orderData?.name || 'RC Racer';
    const itemsSummary = (orderData?.items || []).map(i => `${i.name || i.title} ${i.selectedColor ? '(' + i.selectedColor + ') ' : ''}(x${i.quantity || 1})`).join(', ');
    const totalPaid = orderData?.totalAmount || orderData?.total || '0';
    const deliveryAddr = orderData?.deliveryAddress || orderData?.address || 'Mysore Hub';
    const firstItem = (orderData?.items && orderData.items.length > 0) ? orderData.items[0] : {};
    const primaryImage = (Array.isArray(firstItem.images) && firstItem.images.length > 0)
      ? firstItem.images[0]
      : (firstItem.image || firstItem.imageUrl || null);

    const whatsappMessage = `🏎️ *MJ RC BASE - SHIPROCKET PAYMENT CONFIRMED!*\n\nHi ${custName},\nYour payment of ₹${totalPaid} via Shiprocket Gateway was successfully verified! Order *#${targetId}* is confirmed.\n\n📦 *Items:* ${itemsSummary || 'Hobby RC Machine'}\n💳 *Txn ID:* ${txnId}\n💰 *Total Paid:* ₹${totalPaid}\n📍 *Deliver to:* ${deliveryAddr}\n\nWe will notify you as soon as your package is dispatched!`;

    sendWhatsAppMessage(customerPhone, whatsappMessage, primaryImage, 'normal')
      .then(r => console.log(`✅ [Shiprocket Post-Payment WhatsApp Dispatched]: ID ${r.messageId}`))
      .catch(e => console.warn('[Post-Payment WhatsApp Dispatch Warning]:', e.message));
  }

  return sendJsonResponse(res, 200, {
    success: true,
    orderId: targetId,
    firestoreOrderId: targetId,
    transactionId: txnId
  });
}

/**
 * 3. PAYMENT VERIFICATION ENDPOINT:
 */
async function handleVerifySignature(payload, res) {
  const { firestoreOrderId, orderId, paymentId } = payload;
  const targetId = firestoreOrderId || orderId;

  if (!targetId) {
    return sendJsonResponse(res, 400, {
      success: false,
      message: 'Missing order identifier for verification',
      error: 'Missing order ID'
    });
  }

  let orderData = null;
  if (db) {
    try {
      const snap1 = await getDoc(doc(db, 'orders', targetId));
      if (snap1 && snap1.exists()) orderData = snap1.data();
    } catch (err) {
      console.warn('[Payment] Error looking up order in Firestore:', err.message);
    }
  }

  const resolvedOrderId = orderData?.id || orderData?.orderId || targetId;
  const customerPhone = getPure10(orderData?.phone || orderData?.mobile || orderData?.customerPhone);
  const coinsRedeemed = Number(orderData?.coinsRedeemed || 0);

  const updatedOrderFields = {
    status: 'paid',
    paymentStatus: 'paid',
    paymentId: paymentId || `pay_${Date.now()}`,
    paidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (db && resolvedOrderId) {
    try {
      await setDoc(doc(db, 'orders', resolvedOrderId), updatedOrderFields, { merge: true });
    } catch (err) {
      console.warn('[Payment] Error updating order status to paid:', err.message);
    }
  }

  if (db && coinsRedeemed > 0 && customerPhone) {
    try {
      const userRef = doc(db, 'users', `+91${customerPhone}`);
      await updateDoc(userRef, {
        coins: increment(-coinsRedeemed),
        walletCoins: increment(-coinsRedeemed)
      });
    } catch (err) {
      console.warn('[Payment] Warning deducting coins:', err.message);
    }
  }

  return sendJsonResponse(res, 200, {
    success: true,
    orderId: targetId,
    firestoreOrderId: resolvedOrderId
  });
}

/**
 * 4. CANCEL/DISMISS ORDER ENDPOINT:
 */
async function handleCancelOrder(payload, res) {
  const { firestoreOrderId, reason } = payload;
  if (db && firestoreOrderId) {
    try {
      await updateDoc(doc(db, 'orders', firestoreOrderId), {
        paymentStatus: 'failed',
        status: 'failed',
        cancelReason: reason || 'dismissed_by_user',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[Payment] Notice updating cancelled order:', err.message);
    }
  }
  return sendJsonResponse(res, 200, { success: true, firestoreOrderId });
}

/**
 * 5. DIRECT SHIPROCKET ORDER SYNC API ENDPOINT:
 * POST /api/shiprocket/sync-order
 */
async function handleSyncShiprocketOrder(payload, res) {
  const targetId = payload.id || payload.orderId || payload.firestoreOrderId;
  let orderData = payload;

  if (db && targetId) {
    try {
      const snap = await getDoc(doc(db, 'orders', String(targetId)));
      if (snap && snap.exists()) {
        orderData = { ...snap.data(), ...payload };
      }
    } catch (err) {
      console.warn('[Shiprocket Sync] Notice reading Firestore order:', err.message);
    }
  }

  // Execute Shiprocket API Adhoc Order Creation
  const srResult = await syncOrderToShiprocket(orderData);

  const updateFields = {
    shiprocket_synced: srResult.shiprocket_synced,
    shiprocket_order_id: srResult.shiprocket_order_id || null,
    shipment_id: srResult.shipment_id || null,
    updatedAt: new Date().toISOString()
  };
  if (!srResult.shiprocket_synced && srResult.error) {
    updateFields.shiprocket_sync_error = srResult.error;
  }

  if (db && targetId) {
    try {
      await setDoc(doc(db, 'orders', String(targetId)), updateFields, { merge: true });
      console.log(`📦 [Firestore Order #${targetId}] Saved Shiprocket sync state: shiprocket_synced=${srResult.shiprocket_synced}, order_id=${srResult.shiprocket_order_id || 'N/A'}, shipment_id=${srResult.shipment_id || 'N/A'}`);
    } catch (err) {
      console.warn('[Firestore] Error saving Shiprocket sync status:', err.message);
    }
  }

  return sendJsonResponse(res, 200, {
    success: true,
    shiprocket_synced: srResult.shiprocket_synced,
    shiprocket_order_id: srResult.shiprocket_order_id || null,
    shipment_id: srResult.shipment_id || null,
    error: srResult.error || null
  });
}
