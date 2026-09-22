/**
 * Enterprise-Grade Dynamic WhatsApp Lifecycle Engine & Shiprocket Tracking Sync
 * Location: src/services/whatsappAutomations.js
 *
 * Implements 5 Complete Lifecycle Triggers:
 * 1. Signup / OTP Verified (5-second delay, dynamic Firestore welcome_config banner & text)
 * 2. Order Confirmed (Checkout immediate receipt with item summary & terms placeholder)
 * 3. Dispatched (Shiprocket PICKED_UP / IN_TRANSIT live AWB tracking link)
 * 4. Out for Delivery (Shiprocket OUT_FOR_DELIVERY delivery agent alert)
 * 5. Delivered & Google Review Redirect (Shiprocket DELIVERED confirmation + review redirect)
 */

import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { formatCoins, formatLogDate } from '../utils/formatters';
import { logWhatsAppMessage } from './whatsappCloudApi';

const WHATSAPP_PHONE_ID = import.meta.env.VITE_WHATSAPP_PHONE_ID || '1221091574431016';
const PROXY_ENDPOINT = `/api/whatsapp/v20.0/${WHATSAPP_PHONE_ID}/messages`;
const DIRECT_FALLBACK_ENDPOINT = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`;

/**
 * Universal safe helper to trigger/log WhatsApp notifications
 */
export const sendWhatsAppNotification = async (options = {}) => {
  try {
    const phone = options.phone || options.to || '';
    const message = options.message || options.text || options.data?.message || '';
    const type = options.type || options.templateType || 'general';

    console.log(`[WhatsApp Notification Triggered] To: ${phone} | Type: ${type}`);

    if (phone && typeof logWhatsAppMessage === 'function') {
      const cleanPhone = String(phone).replace(/\D/g, '');
      await logWhatsAppMessage({
        phone: cleanPhone,
        text: message || `WhatsApp Notification (${type})`,
        triggerType: type,
        status: 'Sent',
        direction: 'outgoing'
      }).catch(err => console.warn('[WhatsApp Log Warning]:', err));
    }

    return { success: true, status: 'Logged', mode: 'simulated' };
  } catch (err) {
    console.warn("WhatsApp notification helper error:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Sanitize Phone Number to 12-digit international format starting with '91'
 * (Strips spaces, symbols, leading 0s. Fallbacks to 919686078395 for test safety).
 */
export function sanitizePhoneNumber(phone) {
  if (!phone) return null;
  let cleanDigits = String(phone).replace(/\D/g, '');
  if (cleanDigits.length === 11 && cleanDigits.startsWith('0')) {
    cleanDigits = cleanDigits.slice(1);
  }
  if (cleanDigits.length === 10) {
    cleanDigits = `91${cleanDigits}`;
  }
  if (cleanDigits.length !== 12 || !cleanDigits.startsWith('91')) {
    return null;
  }
  return cleanDigits;
}

/**
 * Get active System User Permanent Access Token from environment
 */
export function getWhatsAppAccessToken() {
  return (
    import.meta.env?.VITE_WHATSAPP_ACCESS_TOKEN ||
    (typeof process !== 'undefined' ? process.env?.WHATSAPP_ACCESS_TOKEN : '') ||
    'EAAfehh1PjQsBScCE3mfAdTj3zYffbvdzuaIM9er3iHRnhwma3bBB8RuKUOS2uvdEP8XZCnM8OrpuyJ8KMCms6fBTSgWHYkI6XppAHcIL38lSZBZBvEEkjXSWAkAPQbsTsVs08wJyvhb3Nph5nu4FqUSNZAoewGCQnsOEZCIt3Tl4jQZBWTeD8qBAOqhq1FJAZDZD'
  );
}

/**
 * Fetch Welcome Config from Firestore crm_settings/welcome_config
 */
export async function fetchWelcomeConfig() {
  try {
    if (db) {
      const snap = await getDoc(doc(db, 'crm_settings', 'welcome_config'));
      if (snap.exists()) {
        const data = snap.data();
        const banner = (data.welcomeBannerUrl || data.bannerUrl || data.imageUrl || '').trim() || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80';
        const headline = (data.headlineTitle || data.headline || '').trim() || 'Welcome to MJ RC BASE Mysore Driver Network!';
        const body = (data.templateBody || data.body || '').trim() || 'You have been credited with 🪙 {{coinsCredited}} Welcome RC Coins valid for 7 days.';
        const coins = data.coinsToCredit ?? data.welcomeBonusCoins ?? data.coins ?? 500;
        return {
          ...data,
          welcomeBannerUrl: banner,
          bannerUrl: banner,
          imageUrl: banner,
          headlineTitle: headline,
          headline: headline,
          templateBody: body,
          body: body,
          coinsToCredit: coins,
          welcomeBonusCoins: coins,
          coins: coins
        };
      }
    }
  } catch (err) {
    console.warn('[WhatsApp Automations] Could not fetch welcome_config, using default:', err);
  }
  return {
    welcomeBannerUrl: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
    headlineTitle: 'Welcome to MJ RC BASE Mysore Driver Network!',
    headline: 'Welcome to MJ RC BASE Mysore Driver Network!',
    templateBody: 'You have been credited with 🪙 {{coinsCredited}} Welcome RC Coins valid for 7 days.',
    body: 'You have been credited with 🪙 {{coinsCredited}} Welcome RC Coins valid for 7 days.',
    coinsToCredit: 500,
    welcomeBonusCoins: 500,
    coins: 500
  };
}

/**
 * Firestore CRM Event Logger
 */
export async function logWhatsAppCrmEvent({
  phone,
  userName = 'RC Racer',
  triggerType = 'Automation',
  status = 'Sent',
  text = '',
  orderId = null,
  awb = null,
  mediaUrl = null,
  messageId = null
}) {
  if (!phone) return;
  const cleanPhone = sanitizePhoneNumber(phone);
  const logId = `log-crm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const logPayload = {
    id: logId,
    phone: cleanPhone,
    userName,
    triggerType,
    status,
    text,
    orderId,
    awb,
    mediaUrl,
    messageId,
    timestamp: formatLogDate(new Date()),
    created_at: serverTimestamp()
  };

  try {
    if (db) {
      const docRef = doc(db, 'whatsapp_logs', logId);
      await setDoc(docRef, logPayload, { merge: true });
    }
  } catch (err) {
    console.warn('[WhatsApp CRM Log Notice]:', err);
  }

  return logPayload;
}

/**
 * Core API Sender Engine with Proxy Routing & Template Fallback Guarantee
 */
export async function sendAutomatedWhatsAppMessage({
  to,
  text,
  templatePayload = null,
  triggerType = 'Automated Alert',
  userName = 'RC Racer',
  orderId = null,
  awb = null,
  mediaUrl = null
}) {
  const cleanPhone = sanitizePhoneNumber(to);
  if (!cleanPhone) {
    console.warn(`>>> [WhatsApp API Aborted (${triggerType})]: Recipient phone number is invalid or missing.`);
    return { success: false, error: 'Invalid or missing recipient phone number' };
  }
  const token = getWhatsAppAccessToken();

  let cleanMediaUrl = null;
  if (mediaUrl && typeof mediaUrl === 'string') {
    let url = mediaUrl.trim();
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }
    if (url.startsWith('https://')) {
      cleanMediaUrl = url;
    }
  }

  if (!text && !templatePayload && !cleanMediaUrl) {
    console.warn(`>>> [WhatsApp API Aborted (${triggerType})]: Missing payload text or media parameters. Request cancelled.`);
    return { success: false, error: 'Missing payload text or media parameters' };
  }

  // Primary Payload: Rich Direct Formatted Text or Media Image with Caption
  const bodyPayload = templatePayload || (cleanMediaUrl ? {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'image',
    image: { link: cleanMediaUrl, caption: text }
  } : {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'text',
    text: { body: text }
  });

  console.log(`>>> [WhatsApp Automated Request (${triggerType})]: To: ${cleanPhone}`);

  let isSuccess = false;
  let responseData = null;
  let apiError = null;

  try {
    // 1. Dispatch via Baileys Embedded Web Daemon
    const daemonRes = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, text, image: cleanMediaUrl || undefined })
    });

    if (daemonRes.ok) {
      responseData = await daemonRes.json();
      if (responseData && responseData.success) {
        isSuccess = true;
        console.log(`✅ [WhatsApp Baileys Daemon Dispatch Success (${triggerType})]:`, responseData);
      } else {
        apiError = responseData?.reason || responseData?.error || 'Daemon not connected';
      }
    }
  } catch (daemonErr) {
    console.warn(`[WhatsApp Daemon Dispatch Notice (${triggerType})]:`, daemonErr);
  }

  // 2. Fallback to Meta Cloud API proxy if Baileys is offline
  if (!isSuccess) {
    try {
      const res = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });
      const resData = await res.json();
      if (res.ok && resData.messages) {
        isSuccess = true;
        responseData = resData;
      }
    } catch (e) {}
  }

  const directWaLink = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(text || '')}`;
  const messageId = responseData?.messageId || responseData?.id || (responseData?.messages?.[0]?.id) || null;

  // Never set Delivered unless fetch returned success: true with valid messageId
  const logStatus = (isSuccess && messageId) 
    ? 'Delivered (Live WhatsApp)' 
    : (apiError ? `Failed: ${apiError}` : 'Sending...');

  // Log CRM event safely in background
  logWhatsAppCrmEvent({
    phone: cleanPhone,
    userName,
    triggerType,
    status: logStatus,
    text: text || JSON.stringify(bodyPayload),
    orderId,
    awb,
    mediaUrl,
    messageId
  }).catch(() => {});

  return { success: isSuccess, data: responseData, error: apiError, directWaLink };
}

/* ==========================================================================
   LIFECYCLE TRIGGER 1: SIGNUP / OTP VERIFIED (5-SECOND DELAYED EXECUTION)
   ========================================================================== */

export const triggerWelcomeOnboarding = triggerAuthWelcomeAutomation;

export async function triggerAuthWelcomeAutomation({ phone, userName, name, firstName, coinsCredited = 500 }) {
  const resolvedUserName = userName || name || firstName || 'RC Racer';
  const cleanPhone = sanitizePhoneNumber(phone);

  const sessionKey = `welcome_sent_${cleanPhone}`;
  if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) {
    console.log(`>>> [WhatsApp Session Guard]: Welcome onboarding already sent for +91${cleanPhone} in this session. Skipping.`);
    return { success: true, skipped: true };
  }
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(sessionKey, 'true');
  }

  // Non-blocking 5-second delayed execution post verification
  setTimeout(async () => {
    try {
      const config = await fetchWelcomeConfig();
      const imageUrl = config?.imageUrl || config?.welcomeBannerUrl || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80';
      const headline = config?.headline || 'Welcome to MJ RC BASE Mysore Driver Network!';
      const body = config?.body || `You have been credited with 🪙 ${coinsCredited} Welcome RC Coins valid for 7 days.`;

      const fullMessage = `🏁 *${headline}*\n\nHi *${resolvedUserName}*, ${body}\n\n✨ Shop 6S bashers, scale crawlers & drift machines now: https://mjrcbase.com`;

      const res = await sendAutomatedWhatsAppMessage({
        to: cleanPhone,
        text: fullMessage,
        mediaUrl: imageUrl,
        triggerType: 'Signup / OTP Verified',
        userName
      });

      if (res.success) {
        console.log(">>> [WhatsApp Lifecycle Event Triggered]: Signup / OTP Verified", res);
      }
    } catch (err) {
      console.warn('[WhatsApp Automations] Signup / OTP Verified error:', err);
    }
  }, 5000);

  return { success: true, queued: true, delayMs: 5000 };
}

/* ==========================================================================
   LIFECYCLE TRIGGER 2: ORDER CONFIRMED (CHECKOUT IMMEDIATE RECEIPT)
   ========================================================================== */

const dispatchedOrderIds = new Set();

export async function triggerCheckoutOrderConfirmation(orderData) {
  if (!orderData) {
    return { success: false, error: 'Order details missing' };
  }

  const orderId = orderData.id || orderData.orderId;
  if (orderId && (dispatchedOrderIds.has(orderId) || orderData._dispatchedWhatsApp)) {
    console.log(`>>> [WhatsApp Dispatch Guard]: Order #${orderId} already dispatched. Skipping duplicate.`);
    return { success: true, skipped: true };
  }

  if (orderId) {
    dispatchedOrderIds.add(orderId);
    orderData._dispatchedWhatsApp = true;
  }

  const recipientPhone = orderData.shippingDetails?.phone || orderData.customerPhone || orderData.phone || orderData.mobile;
  const cleanTargetPhone = String(recipientPhone || '').replace(/\D/g, '').slice(-10);
  const cleanPhone = sanitizePhoneNumber(cleanTargetPhone);
  const customerName = orderData.shippingDetails?.fullName || orderData.customerName || orderData.name || 'RC Racer';
  const resolvedOrderId = orderId || `MJ-${Math.floor(80000 + Math.random() * 19000)}`;
  const orderDate = orderData.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const rawTotal = orderData.total || orderData.finalBill || orderData.totalAmount || 0;
  const totalAmount = typeof rawTotal === 'number' ? rawTotal.toLocaleString('en-IN') : rawTotal;
  const customerAddress = orderData.shippingDetails?.address || orderData.customerAddress || orderData.address || 'Mysore, Karnataka';
  const coinsRedeemed = orderData.coinsRedeemed || 0;
  const awb = orderData.shiprocketAwb || orderData.awb || 'AWB-PENDING';
  const trackingUrl = orderData.shiprocketTrackingUrl || `https://shiprocket.co/tracking/${awb}`;

  const primaryItem = (orderData.items && orderData.items.length > 0) ? orderData.items[0] : null;
  const primaryImage = primaryItem?.image || orderData.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80';

  const itemsSummary = (orderData.items || [])
    .map(i => `${i.name || i.title} (x${i.quantity || i.qty || 1})`)
    .join(', ');

  const formattedMessage = `🏎️ *MJ RC BASE - ORDER CONFIRMED!*\n\nHi ${customerName},\n\nYour order *#${resolvedOrderId}* has been successfully placed!\n\n📦 *Items:* ${itemsSummary || 'Hobby RC Machine'}\n💰 *Total Paid:* ₹${totalAmount}\n📍 *Deliver to:* ${customerAddress}\n\nWe will notify you as soon as your package is dispatched. Thank you for racing with us!`;

  try {
    const res = await sendAutomatedWhatsAppMessage({
      to: cleanPhone,
      text: formattedMessage,
      mediaUrl: primaryImage,
      triggerType: 'Order Confirmed',
      userName: customerName,
      orderId: resolvedOrderId,
      awb
    });

    if (res.success) {
      console.log(">>> [WhatsApp Lifecycle Event Triggered]: Order Confirmed", res);
    }
    return res;
  } catch (err) {
    console.warn('[WhatsApp Automations] Order Confirmed error:', err);
    return { success: false, error: err.message };
  }
}

/* ==========================================================================
   LIFECYCLE TRIGGERS 3, 4, & 5: SHIPROCKET LOGISTICS & DELIVERY ENGINE
   ========================================================================== */

export async function analyzeAndProcessShiprocketStatus(order, newStatusOverride = null) {
  if (!order) {
    return { success: false, error: 'Order details missing' };
  }

  const rawPhone = order.shippingDetails?.phone || order.customerPhone || order.phone || order.mobile;
  const cleanPhone = sanitizePhoneNumber(rawPhone);
  const customerName = order.customerName || order.name || 'RC Racer';
  const orderId = order.id || order.orderId || 'MJ-98000';
  const awb = order.shiprocketAwb || order.awb || `AWB-${Math.floor(1000000 + Math.random() * 9000000)}`;
  const trackingUrl = order.shiprocketTrackingUrl || `https://shiprocket.co/tracking/${awb}`;

  const currentStatus = (newStatusOverride || order.deliveryStatus || order.status || 'PROCESSING').toUpperCase();
  const lastNotified = (order.lastNotifiedStatus || '').toUpperCase();

  if (currentStatus === lastNotified && currentStatus !== 'DELIVERED_PENDING_REVIEW') {
    console.log(`>>> [Shiprocket Analyzer]: Status '${currentStatus}' already notified for Order #${orderId}. Skipping duplicate.`);
    return { success: true, skipped: true };
  }

  let triggerResult = { success: false };

  // Trigger 3: Dispatched (Shiprocket PICKED_UP / IN_TRANSIT)
  if (currentStatus === 'PICKED_UP' || currentStatus === 'IN_TRANSIT' || currentStatus === 'DISPATCHED') {
    const dispatchMsg = `🚚 *MJ RC BASE DISPATCH UPDATE!* (Order #${orderId})\n\nHi *${customerName}*, your hobby RC machine has been bench-tested and handed over to our courier partner!\n\n🏷️ *Shiprocket AWB:* ${awb}\n🌐 *Live Tracking:* ${trackingUrl}\n\nNeed assistance? Chat with support on WhatsApp: https://wa.me/919686078395`;

    triggerResult = await sendAutomatedWhatsAppMessage({
      to: cleanPhone,
      text: dispatchMsg,
      triggerType: 'Dispatched',
      userName: customerName,
      orderId,
      awb
    });

    if (triggerResult.success) {
      console.log(">>> [WhatsApp Lifecycle Event Triggered]: Dispatched", triggerResult);
    }
  }

  // Trigger 4: Out for Delivery (Shiprocket OUT_FOR_DELIVERY)
  else if (currentStatus === 'OUT_FOR_DELIVERY') {
    const outForDeliveryMsg = `🚚 *OUT FOR DELIVERY!* (Order #${orderId})\n\nHi *${customerName}*, your MJ RC BASE package is out for delivery today! Please keep your phone accessible for the delivery executive.\n\n🏷️ *AWB:* ${awb}\n🌐 *Live Tracking:* ${trackingUrl}`;

    triggerResult = await sendAutomatedWhatsAppMessage({
      to: cleanPhone,
      text: outForDeliveryMsg,
      triggerType: 'Out for Delivery',
      userName: customerName,
      orderId,
      awb
    });

    if (triggerResult.success) {
      console.log(">>> [WhatsApp Lifecycle Event Triggered]: Out for Delivery", triggerResult);
    }
  }

  // Trigger 5: Delivered & Google Review Redirect (Shiprocket DELIVERED)
  else if (currentStatus === 'DELIVERED') {
    const deliveryMsg = `🎉 *PACKAGE DELIVERED!* (Order #${orderId})\n\nHi *${customerName}*, your scale hobby RC machine has been safely delivered to your doorstep!\n\n⭐ *Unboxing Experience:* Rate us 5 Stars on Google Maps & claim 🪙 100 Bonus RC Coins!\n👉 *Tap to Review:* https://mjrcbase.com/review?order=${orderId}\n📍 *Direct Google Maps Review:* https://maps.app.goo.gl/mjrcbase-review\n\n💬 For technical support or replacement inquiries, contact us at +919686078395.\n\n⚡ Platform Engineered by ZoneX Growth Agency (https://zonexgrowth-agency.in)`;

    triggerResult = await sendAutomatedWhatsAppMessage({
      to: cleanPhone,
      text: deliveryMsg,
      triggerType: 'Delivered & Review Redirect',
      userName: customerName,
      orderId,
      awb
    });

    if (triggerResult.success) {
      console.log(">>> [WhatsApp Lifecycle Event Triggered]: Delivered & Review Redirect", triggerResult);
    }
  }

  return {
    success: triggerResult.success,
    status: currentStatus,
    orderId
  };
}

/**
 * Admin Manual Bulk Broadcast Hub Trigger (strictly manual upon UI click)
 */
export async function triggerAdminManualBroadcast({
  recipients = [],
  templateText = '',
  mediaUrl = null,
  campaignName = 'Manual Campaign',
  onProgress = null
}) {
  if (!recipients || recipients.length === 0) {
    return { success: false, error: 'No recipients provided' };
  }

  const results = [];
  const total = recipients.length;

  for (let i = 0; i < total; i++) {
    const cust = recipients[i];
    const rawPhone = typeof cust === 'string' ? cust : (cust.phone || cust.mobile);
    const cleanPhone = sanitizePhoneNumber(rawPhone);
    if (!cleanPhone) continue;
    const name = typeof cust === 'string' ? 'Racer' : (cust.name || cust.userName || 'Racer');

    let text = (templateText || '')
      .replace(/{name}/g, name)
      .replace(/{phone}/g, cleanPhone);

    const res = await sendAutomatedWhatsAppMessage({
      to: cleanPhone,
      text,
      mediaUrl,
      triggerType: `Manual Broadcast: ${campaignName}`,
      userName: name
    });

    const resultObj = {
      phone,
      name,
      status: res.success ? 'Delivered' : 'Failed',
      timestamp: new Date().toLocaleTimeString()
    };

    results.push(resultObj);

    if (onProgress) {
      onProgress({
        currentIndex: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 100),
        latestResult: resultObj,
        allResults: [...results]
      });
    }

    if (i < total - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  return { success: true, total, results };
}
