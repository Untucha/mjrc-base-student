import crypto from 'crypto';
import axios from 'axios';
import { db } from '../../src/firebase.js';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { sendWhatsAppMessage } from '../whatsappBridge.js';

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

// Fetch Razorpay credentials securely from Firestore crm_settings/integrations or process.env
async function getRazorpayCredentials() {
  let keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  let keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || '';

  if (db) {
    try {
      const snap = await getDoc(doc(db, 'crm_settings', 'integrations'));
      if (snap && snap.exists()) {
        const data = snap.data();
        if (data.razorpayKeyId) keyId = data.razorpayKeyId.trim();
        if (data.razorpayKeySecret) keySecret = data.razorpayKeySecret.trim();
      }
    } catch (err) {
      console.warn('[PaymentRoutes] Error loading crm_settings/integrations credentials:', err.message);
    }
  }

  return { keyId, keySecret };
}

/**
 * Central Payment API Router Handler
 * Serves POST /api/payment/create-order and POST /api/payment/verify-signature
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
    } else if (url === '/api/payment/verify-signature' || url === '/verify-signature') {
      await handleVerifySignature(payload, res);
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
 * Validates prices & per-product coins server-side against Firestore,
 * creates Razorpay Order via REST API, and saves pending draft in Firestore.
 */
async function handleCreateOrder(payload, res) {
  const { items = [], deliveryAddress = '', useCoins = false, customerPhone = '', customerName = '', shippingDetails = {} } = payload;

  const pure10Phone = getPure10(customerPhone);
  if (!items || items.length === 0) {
    return sendJsonResponse(res, 400, { success: false, message: 'Cart is empty' });
  }

  // 1. Check active credentials
  const { keyId, keySecret } = await getRazorpayCredentials();
  if (!keyId || !keySecret) {
    return sendJsonResponse(res, 400, {
      success: false,
      message: 'Razorpay credentials not configured or invalid in Vault.',
      error: 'Razorpay credentials not configured or invalid in Vault.'
    });
  }

  // 2. Validate each product against Firestore DB
  let cartSubtotal = 0;
  let totalCartCoinsToBurn = 0;
  let totalCartRupeeDiscount = 0;
  const validatedItems = [];

  for (const item of items) {
    const prodId = item.id || item.productId;
    const qty = Math.max(1, Number(item.quantity || item.qty || 1));
    let unitPrice = Number(item.price || 0);
    let allowCoins = item.allowCoinRedemption !== false;
    let maxCoins = item.maxCoinsRedeemable !== undefined ? Number(item.maxCoinsRedeemable) : 500;
    let coinDiscount = item.coinDiscountAmount !== undefined ? Number(item.coinDiscountAmount) : Math.round(maxCoins / 5);

    if (db && prodId) {
      try {
        const prodSnap = await getDoc(doc(db, 'products', String(prodId)));
        if (prodSnap && prodSnap.exists()) {
          const prodData = prodSnap.data();
          if (prodData.price !== undefined) unitPrice = Number(prodData.price);
          if (prodData.allowCoinRedemption !== undefined) allowCoins = prodData.allowCoinRedemption !== false;
          if (prodData.maxCoinsRedeemable !== undefined) maxCoins = Number(prodData.maxCoinsRedeemable);
          if (prodData.coinDiscountAmount !== undefined) coinDiscount = Number(prodData.coinDiscountAmount);
        }
      } catch (err) {
        console.warn(`[Payment] Notice fetching product ${prodId} from Firestore:`, err.message);
      }
    }

    cartSubtotal += (unitPrice * qty);

    if (allowCoins) {
      totalCartCoinsToBurn += (maxCoins * qty);
      totalCartRupeeDiscount += (coinDiscount * qty);
    }

    validatedItems.push({
      ...item,
      id: prodId,
      price: unitPrice,
      quantity: qty,
      itemTotal: unitPrice * qty
    });
  }

  // 3. Fetch user wallet balance if useCoins is checked
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

  // 4. Call Razorpay API to create order
  try {
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
    const receiptId = `rc_ord_${Date.now()}`;

    const razorpayRes = await axios.post('https://api.razorpay.com/v1/orders', {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        customerPhone: pure10Phone,
        customerName: customerName || 'RC Racer'
      }
    }, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const razorpayOrder = razorpayRes.data;
    const firestoreOrderId = `MJ-${Math.floor(80000 + Math.random() * 19000)}`;

    const pendingOrderDoc = {
      id: firestoreOrderId,
      orderId: firestoreOrderId,
      razorpayOrderId: razorpayOrder.id,
      status: 'pending_payment',
      paymentStatus: 'pending_payment',
      paymentMethod: 'Razorpay Online Standard',
      customerName: customerName || 'RC Racer',
      name: customerName || 'RC Racer',
      phone: pure10Phone,
      mobile: pure10Phone,
      customerPhone: `+91 ${pure10Phone}`,
      shippingDetails: shippingDetails || {},
      deliveryAddress: deliveryAddress || '',
      address: deliveryAddress || '',
      items: validatedItems,
      subtotal: cartSubtotal,
      totalAmount: finalPayableTotal,
      amountInPaise: amountInPaise,
      coinsRedeemed: actualCoinsToRedeem,
      coinDiscount: actualRupeeDiscount,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    if (db) {
      try {
        await setDoc(doc(db, 'orders', firestoreOrderId), pendingOrderDoc);
        await setDoc(doc(db, 'orders', razorpayOrder.id), pendingOrderDoc);
      } catch (err) {
        console.warn('[Payment] Warning saving pending order to Firestore:', err.message);
      }
    }

    return sendJsonResponse(res, 200, {
      success: true,
      orderId: razorpayOrder.id,
      firestoreOrderId: firestoreOrderId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',
      keyId: keyId
    });
  } catch (axiosErr) {
    console.error('[Razorpay Order Creation API Error]:', axiosErr?.response?.data || axiosErr.message);
    return sendJsonResponse(res, 400, {
      success: false,
      message: 'Razorpay credentials not configured or invalid in Vault.',
      error: axiosErr?.response?.data?.error?.description || axiosErr.message || 'Failed to reach Razorpay API'
    });
  }
}

/**
 * 2. CRYPTOGRAPHIC SIGNATURE VERIFICATION:
 */
async function handleVerifySignature(payload, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, firestoreOrderId } = payload;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return sendJsonResponse(res, 400, {
      success: false,
      message: 'Missing signature verification parameters',
      error: 'Missing signature verification parameters'
    });
  }

  const { keySecret } = await getRazorpayCredentials();
  if (!keySecret) {
    return sendJsonResponse(res, 400, {
      success: false,
      message: 'Razorpay credentials not configured or invalid in Vault.',
      error: 'Razorpay Secret Key missing on server'
    });
  }

  // Validate HMAC SHA256 signature
  const bodyData = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(bodyData)
    .digest('hex');

  const isSignatureValid = expectedSignature === razorpay_signature;

  if (!isSignatureValid) {
    console.error(`🚨 [SECURITY ALERT] Razorpay Signature Mismatch for Order ${razorpay_order_id}!`);
    return sendJsonResponse(res, 400, {
      success: false,
      message: 'Cryptographic signature verification failed! Security tampering detected.',
      error: 'Cryptographic signature verification failed'
    });
  }

  console.log(`✅ [RAZORPAY VERIFIED SUCCESS] Order: ${razorpay_order_id} | PaymentID: ${razorpay_payment_id}`);

  // Fetch target order draft from Firestore
  let orderData = null;
  const targetId = firestoreOrderId || razorpay_order_id;

  if (db) {
    try {
      const snap1 = await getDoc(doc(db, 'orders', targetId));
      if (snap1 && snap1.exists()) {
        orderData = snap1.data();
      } else {
        const snap2 = await getDoc(doc(db, 'orders', razorpay_order_id));
        if (snap2 && snap2.exists()) orderData = snap2.data();
      }
    } catch (err) {
      console.warn('[Payment] Error looking up order in Firestore:', err.message);
    }
  }

  const resolvedOrderId = orderData?.id || orderData?.orderId || firestoreOrderId || targetId;
  const customerPhone = getPure10(orderData?.phone || orderData?.mobile || orderData?.customerPhone);
  const coinsRedeemed = Number(orderData?.coinsRedeemed || 0);

  const updatedOrderFields = {
    status: 'paid',
    paymentStatus: 'paid',
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    paidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (db) {
    try {
      if (resolvedOrderId) {
        await setDoc(doc(db, 'orders', resolvedOrderId), updatedOrderFields, { merge: true });
      }
      await setDoc(doc(db, 'orders', razorpay_order_id), updatedOrderFields, { merge: true });
    } catch (err) {
      console.warn('[Payment] Error updating order status to paid:', err.message);
    }
  }

  // Deduct coins from user wallet if coins were redeemed
  if (db && coinsRedeemed > 0 && customerPhone) {
    try {
      const userRef = doc(db, 'users', `+91${customerPhone}`);
      await updateDoc(userRef, {
        coins: increment(-coinsRedeemed),
        walletCoins: increment(-coinsRedeemed)
      });
      console.log(`🪙 Deducted ${coinsRedeemed} RC Coins from user wallet (+91 ${customerPhone})`);
    } catch (err) {
      console.warn('[Payment] Warning deducting redeemed coins from user:', err.message);
    }
  }

  // Trigger post-order WhatsApp confirmation dispatch strictly AFTER verified payment
  if (customerPhone) {
    const customerName = orderData?.customerName || orderData?.name || 'RC Racer';
    const itemsSummary = (orderData?.items || []).map(i => `${i.name || i.title} (x${i.quantity || i.qty || 1})`).join(', ');
    const totalPaid = orderData?.totalAmount || '0';
    const deliveryAddr = orderData?.deliveryAddress || orderData?.address || 'Mysore Hub';
    const firstItem = (orderData?.items && orderData.items.length > 0) ? orderData.items[0] : {};
    const primaryImage = (Array.isArray(firstItem.images) && firstItem.images.length > 0)
      ? firstItem.images[0]
      : (firstItem.image || firstItem.imageUrl || null);

    const whatsappMessage = `🏎️ *MJ RC BASE - ORDER CONFIRMED!*\n\nHi ${customerName},\nYour payment of ₹${totalPaid} was successfully verified! Order *#${resolvedOrderId}* is confirmed.\n\n📦 *Items:* ${itemsSummary || 'Hobby RC Machine'}\n💰 *Total Paid:* ₹${totalPaid}\n📍 *Deliver to:* ${deliveryAddr}\n\nWe will notify you as soon as your package is dispatched!`;

    sendWhatsAppMessage(customerPhone, whatsappMessage, primaryImage, 'normal')
      .then(res => console.log(`✅ [Post-Payment WhatsApp Dispatched]: ID ${res.messageId}`))
      .catch(err => console.warn('[Post-Payment WhatsApp Dispatch Warning]:', err.message));
  }

  return sendJsonResponse(res, 200, {
    success: true,
    orderId: razorpay_order_id,
    firestoreOrderId: resolvedOrderId
  });
}
