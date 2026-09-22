import { db } from './firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Log a message to Firestore whatsapp_logs collection
 */
export const logWhatsAppMessage = async ({
  userId = null,
  phone = '',
  userName = 'Customer',
  direction = 'outgoing', // 'incoming' | 'outgoing'
  text = '',
  mediaUrl = null,
  triggerType = 'Direct Broadcast', // 'Welcome Onboarding' | 'Order Confirmation' | 'Festival Campaign' | 'Logistics Alert' | 'Delivery & Rating'
  status = 'Sent', // 'Sent' | 'Delivered' | 'Failed' | 'Received'
  templateName = null,
  orderId = null,
  awb = null,
  campaignName = null
}) => {
  if (!phone) return;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const messageData = {
    id: logId,
    userId: userId || cleanPhone,
    phone: cleanPhone,
    userName: userName || 'RC Racer',
    direction,
    text,
    mediaUrl: mediaUrl || null,
    triggerType: triggerType || 'Direct Broadcast',
    status,
    templateName: templateName || 'direct_custom',
    orderId: orderId || null,
    awb: awb || null,
    campaignName: campaignName || null,
    timestamp: new Date().toISOString(),
    created_at: serverTimestamp()
  };

  try {
    const docRef = doc(db, 'whatsapp_logs', logId);
    await setDoc(docRef, messageData, { merge: true });
  } catch (err) {
    console.warn('[WhatsApp Log] Firestore write notice:', err);
  }

  return messageData;
};

/**
 * Send WhatsApp Cloud API REST Request
 */
export const sendCloudWhatsAppMessage = async ({
  phone,
  text,
  mediaUrl = null,
  triggerType = 'Direct Broadcast',
  templateName = null,
  userName = 'Customer',
  orderId = null,
  awb = null,
  campaignName = null,
  config = {}
}) => {
  if (!phone) return { success: false, error: 'Phone number required' };
  const cleanDigits = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

  const apiKey = config?.whatsappApiKey || config?.token || import.meta.env?.VITE_WHATSAPP_ACCESS_TOKEN || (typeof process !== 'undefined' ? process.env?.WHATSAPP_ACCESS_TOKEN : '') || '';
  const phoneNumberId = config?.phoneNumberId || import.meta.env?.VITE_WHATSAPP_PHONE_NUMBER_ID || (typeof process !== 'undefined' ? process.env?.WHATSAPP_PHONE_NUMBER_ID : '') || '';
  const mode = (config?.mode === 'simulation' && !import.meta.env?.VITE_WHATSAPP_ACCESS_TOKEN) ? 'simulation' : 'production';

  let status = 'Sent';
  let apiError = null;

  if (apiKey && phoneNumberId && mode !== 'simulation') {
    try {
      const payloadBody = mediaUrl ? {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'image',
        image: { link: mediaUrl, caption: text }
      } : {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { body: text }
      };

      const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadBody)
      });

      const data = await response.json();
      if (response.ok && data.messages) {
        status = 'Delivered';
      } else {
        status = 'Failed';
        apiError = data?.error?.message || 'API request failed';
      }
    } catch (err) {
      status = 'Failed';
      apiError = err.message;
    }
  } else {
    // Simulation / Fallback mode
    status = 'Delivered';
  }

  // Log execution in Firestore
  const logData = await logWhatsAppMessage({
    userId: formattedPhone,
    phone: formattedPhone,
    userName,
    direction: 'outgoing',
    text,
    mediaUrl,
    triggerType,
    status,
    templateName,
    orderId,
    awb,
    campaignName
  });

  return { success: status !== 'Failed', status, logData, error: apiError };
};

/**
 * Dynamic Onboarding Welcome Trigger
 */
export const triggerInstantWelcome = async (
  phone,
  userName = 'RC Racer',
  coinsCredited = 500,
  expiryDate = null,
  welcomeConfig = {},
  config = {}
) => {
  const expiryFormatted = expiryDate
    ? new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '7 days';

  const mediaUrl = welcomeConfig?.imageUrl || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80';
  const headline = welcomeConfig?.headline || 'Welcome to MJ RC BASE Mysore Driver Network!';
  const body = welcomeConfig?.body || 'You have been credited with 🪙 {{coinsCredited}} Welcome RC Coins valid for {{expiryDate}}.';

  const customizedBody = body
    .replace(/{{userName}}/g, userName)
    .replace(/{{coinsCredited}}/g, coinsCredited)
    .replace(/{{expiryDate}}/g, expiryFormatted);

  const fullMsg = `🏁 ${headline}\n\nHi ${userName}, ${customizedBody}\n\n✨ Shop 6S bashers, scale crawlers & drift machines now: https://mjrcbase.com`;

  return await sendCloudWhatsAppMessage({
    phone,
    text: fullMsg,
    mediaUrl,
    triggerType: 'Welcome Onboarding',
    templateName: 'welcome_onboarding_media',
    userName,
    config
  });
};

/**
 * Order Confirmation Trigger with Replacement & Defect Support Link
 */
export const triggerOrderConfirmation = async (order, config = {}) => {
  const awb = order.shiprocketAwb || order.awb || `AWB-${Math.floor(1000000 + Math.random() * 9000000)}`;
  const trackingUrl = order.shiprocketTrackingUrl || `https://shiprocket.co/tracking/${awb}`;
  
  // Extract primary vehicle image header
  const primaryItem = (order.items && order.items.length > 0) ? order.items[0] : null;
  const primaryImage = primaryItem?.image || order.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80';
  const primaryTitle = primaryItem?.title || order.title || 'Hobby RC Machine';

  const itemsSummary = (order.items || []).map(i => `• ${i.title || i.name} (x${i.qty || 1}) - ₹${(i.price || 0).toLocaleString('en-IN')}`).join('\n');

  const encodedOrderRef = encodeURIComponent(`Hi MJ RC Support, I need replacement & defect policy assistance for Order #${order.id}`);
  const replacementSupportUrl = `https://wa.me/919686078395?text=${encodedOrderRef}`;

  const orderText = `📦 Order Confirmed & Bench-Tested! Order #${order.id}\n\nHi ${order.customerName || 'Racer'},\n\nYour primary machine:\n🚘 ${primaryTitle}\n\nOrder Items:\n${itemsSummary}\n\n💰 Total Paid: ₹${(order.total || 0).toLocaleString('en-IN')}\n💳 Payment: ${order.paymentMethod || 'Razorpay Prepaid'}\n\n🚚 Shiprocket Live Tracking: ${trackingUrl}\n🏷️ AWB: ${awb}\n\n🛠️ Replacement & Defect Policy Support:\nNeed assistance or bench-testing report? Tap to chat with support: ${replacementSupportUrl}`;

  return await sendCloudWhatsAppMessage({
    phone: order.mobile || order.phone,
    text: orderText,
    mediaUrl: primaryImage,
    triggerType: 'Order Confirmation',
    templateName: 'order_confirmation_replacement_hook',
    userName: order.customerName || 'Customer',
    orderId: order.id,
    awb,
    config
  });
};

/**
 * Logistics Dispatch & Delivery Milestone Alerts
 */
export const triggerLogisticsAlert = async (order, milestone = 'OUT_FOR_DELIVERY', config = {}) => {
  const awb = order.shiprocketAwb || order.awb || 'AWB-LOGISTICS';
  const customerName = order.customerName || order.name || 'Racer';

  if (milestone === 'OUT_FOR_DELIVERY') {
    const alertMsg = `🚚 OUT FOR DELIVERY! Order #${order.id}\n\nHi ${customerName}, your bench-tested RC machine is out for delivery with our courier partner today! Please keep your mobile active. AWB: ${awb}`;
    return await sendCloudWhatsAppMessage({
      phone: order.mobile || order.phone,
      text: alertMsg,
      triggerType: 'Logistics Alert',
      templateName: 'out_for_delivery_alert',
      userName: customerName,
      orderId: order.id,
      awb,
      config
    });
  }

  if (milestone === 'DELIVERED') {
    const deliveryMsg = `🎉 DELIVERED! Order #${order.id}\n\nHi ${customerName}, your hobby RC package has been safely delivered to your doorstep!\n\n⭐ How was your unboxing experience?\nRate your machine 5 Stars & claim 100 bonus RC Coins: https://mjrcbase.com/review?order=${order.id}`;
    return await sendCloudWhatsAppMessage({
      phone: order.mobile || order.phone,
      text: deliveryMsg,
      triggerType: 'Delivery & Rating',
      templateName: 'delivered_rating_prompt',
      userName: customerName,
      orderId: order.id,
      awb,
      config
    });
  }

  return { success: false, error: 'Unknown milestone' };
};

/**
 * Custom Festival & Offer Campaign Broadcast
 */
export const triggerCampaignBroadcast = async ({
  campaignName = 'Festive Offer',
  mediaUrl = null,
  messageText = '',
  targetPhone = null,
  targetMode = 'single',
  recipients = [],
  config = {},
  onProgress = null
}) => {
  if (targetMode === 'single') {
    if (!targetPhone) return { success: false, error: 'Target phone number required' };
    const text = messageText.replace(/{{customerName}}/g, 'Valued Racer');
    return await sendCloudWhatsAppMessage({
      phone: targetPhone,
      text,
      mediaUrl,
      triggerType: 'Festival Campaign',
      templateName: `campaign_${campaignName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      campaignName,
      config
    });
  }

  // Bulk Mode
  if (!recipients || recipients.length === 0) {
    return { success: false, error: 'No recipients provided for bulk broadcast' };
  }

  const results = [];
  for (let i = 0; i < recipients.length; i++) {
    const cust = recipients[i];
    const custPhone = cust.phone || cust.mobile;
    const custName = cust.name || 'Racer';

    if (custPhone) {
      const text = messageText
        .replace(/{{customerName}}/g, custName)
        .replace(/{{coins}}/g, cust.rcCoins || 500)
        .replace(/{{offerLink}}/g, 'https://mjrcbase.com');

      const res = await sendCloudWhatsAppMessage({
        phone: custPhone,
        text,
        mediaUrl,
        triggerType: 'Festival Campaign',
        templateName: `campaign_${campaignName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        userName: custName,
        campaignName,
        config
      });

      results.push(res);
    }

    if (onProgress) {
      onProgress({
        currentIndex: i + 1,
        total: recipients.length,
        percentage: Math.round(((i + 1) / recipients.length) * 100),
        results
      });
    }
  }

  return { success: true, count: results.length, results };
};

/**
 * Send Automated WhatsApp Order Notification via Meta Cloud API v20.0
 */
export const sendWhatsAppOrderNotification = async (orderDetails, customerPhone) => {
  const rawPhone = customerPhone || orderDetails?.mobile || orderDetails?.phone || '';
  if (!rawPhone) return { success: false, error: 'Customer phone number missing' };

  // Normalize phone number (strip spaces, symbols, leading '+', ensure 91 prefix)
  let cleanDigits = rawPhone.replace(/\D/g, '');
  if (cleanDigits.length === 10) {
    cleanDigits = `91${cleanDigits}`;
  } else if (cleanDigits.startsWith('0') && cleanDigits.length === 11) {
    cleanDigits = `91${cleanDigits.slice(1)}`;
  }

  // Get credentials from environment or config
  const accessToken =
    import.meta.env?.VITE_WHATSAPP_ACCESS_TOKEN ||
    (typeof process !== 'undefined' ? process.env?.WHATSAPP_ACCESS_TOKEN : '') ||
    'EAAfehh1PjQsBScCE3mfAdTj3zYffbvdzuaIM9er3iHRnhwma3bBB8RuKUOS2uvdEP8XZCnM8OrpuyJ8KMCms6fBTSgWHYkI6XppAHcIL38lSZBZBvEEkjXSWAkAPQbsTsVs08wJyvhb3Nph5nu4FqUSNZAoewGCQnsOEZCIt3Tl4jQZBWTeD8qBAOqhq1FJAZDZD';
    
  const phoneNumberId =
    import.meta.env?.VITE_WHATSAPP_PHONE_NUMBER_ID ||
    (typeof process !== 'undefined' ? process.env?.WHATSAPP_PHONE_NUMBER_ID : '') ||
    '1221091574431016';

  const orderId = orderDetails?.id || `MJ-${Math.floor(80000 + Math.random() * 19000)}`;
  const customerName = orderDetails?.customerName || orderDetails?.name || 'RC Racer';
  const totalAmount = orderDetails?.total || orderDetails?.totalAmount || 0;
  const awb = orderDetails?.shiprocketAwb || orderDetails?.awb || 'AWB-PENDING';
  const trackingUrl = orderDetails?.shiprocketTrackingUrl || `https://shiprocket.co/tracking/${awb}`;

  const itemsText = (orderDetails?.items || [])
    .map(i => `• ${i.title || i.name} (x${i.qty || 1}) - ₹${(i.price || 0).toLocaleString('en-IN')}`)
    .join('\n');

  const messageBody = `📦 *Order Confirmed & Bench-Tested!* (Order #${orderId})\n\nHi ${customerName},\n\nThank you for shopping at MJ RC BASE Mysore!\n\n*Order Summary:*\n${itemsText || '• RC Scale Model'}\n\n💰 *Total Paid:* ₹${totalAmount.toLocaleString('en-IN')}\n💳 *Payment Method:* ${orderDetails?.paymentMethod || 'Prepaid Online'}\n\n🚚 *Live Tracking:* ${trackingUrl}\n🏷️ *AWB:* ${awb}\n\nNeed assistance? Tap to chat with support: https://wa.me/919686078395?text=${encodeURIComponent(`Hi, I need assistance with Order #${orderId}`)}`;

  const endpointUrl = `/api/whatsapp/v20.0/${phoneNumberId}/messages`;
  const directEndpointUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  // Direct Rich Text Payload
  const bodyPayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanDigits,
    type: 'text',
    text: { body: messageBody }
  };

  console.log('>>> [WhatsApp] Triggering message for:', cleanDigits);
  console.log('>>> [WhatsApp Payload]:', JSON.stringify(bodyPayload));

  try {
    let response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyPayload)
    }).catch(async () => {
      // Direct endpoint fallback if /api proxy is not reachable
      return await fetch(directEndpointUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });
    });

    const data = await response.json();
    console.log('>>> [WhatsApp Response]:', data);

    let isSuccess = response.ok && !!data.messages;

    // Follow-up text payload attempt if session is open
    if (isSuccess) {
      const textPayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanDigits,
        type: 'text',
        text: { body: messageBody }
      };

      try {
        const textRes = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(textPayload)
        });
        const textData = await textRes.json();
        console.log('WhatsApp order text details response:', textData);
      } catch (e) {
        console.warn('Text details follow-up notice:', e);
      }
    }

    await logWhatsAppMessage({
      userId: cleanDigits,
      phone: cleanDigits,
      userName: customerName,
      direction: 'outgoing',
      text: messageBody,
      triggerType: 'Order Confirmation',
      status: isSuccess ? 'Delivered' : 'Failed',
      orderId,
      awb
    });

    return { success: isSuccess, data, error: isSuccess ? null : data?.error?.message };
  } catch (err) {
    console.error('[Meta WhatsApp Cloud API Exception]:', err);
    return { success: false, error: err.message };
  }
};

