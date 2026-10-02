import axios from 'axios';

// In-memory token cache
let cachedShiprocketToken = null;
let tokenExpiryTimestamp = 0;

/**
 * Format current date to YYYY-MM-DD HH:mm for Shiprocket API
 */
function formatShiprocketDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

/**
 * 1. Authenticate with Shiprocket API and cache token
 * Endpoint: POST https://apiv2.shiprocket.in/v1/external/auth/login
 */
export async function getShiprocketAuthToken() {
  // Return cached token if valid (valid for 9 days)
  if (cachedShiprocketToken && Date.now() < tokenExpiryTimestamp) {
    return cachedShiprocketToken;
  }

  const email = process.env.SHIPROCKET_EMAIL || 'glitchxjod2@gmail.com';
  const password = process.env.SHIPROCKET_PASSWORD || 'yn!R#0o41jtB9oA0STQi5%w#k1#Q*I#Z';

  try {
    console.log(`[Shiprocket API] Authenticating with email: ${email}...`);
    const response = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/auth/login',
      { email, password },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );

    if (response.data && response.data.token) {
      cachedShiprocketToken = response.data.token;
      // Cache token for 9 days (Shiprocket tokens expire in 10 days)
      tokenExpiryTimestamp = Date.now() + 9 * 24 * 60 * 60 * 1000;
      console.log('✅ [Shiprocket API] Token successfully acquired & cached in memory.');
      return cachedShiprocketToken;
    } else {
      throw new Error('No token returned in Shiprocket authentication response');
    }
  } catch (err) {
    const errorDetail = err.response?.data?.message || err.message;
    console.error('❌ [Shiprocket Auth Error]:', errorDetail);
    throw new Error(`Shiprocket Auth Failed: ${errorDetail}`);
  }
}

/**
 * 2. Create Adhoc Order in Shiprocket
 * Endpoint: POST https://apiv2.shiprocket.in/v1/external/orders/create/adhoc
 */
export async function syncOrderToShiprocket(orderData) {
  try {
    const token = await getShiprocketAuthToken();

    const orderId = String(orderData.id || orderData.orderId || `MJ-${Math.floor(80000 + Math.random() * 19000)}`);
    const orderDateStr = formatShiprocketDate(new Date(orderData.createdAt || Date.now()));

    // Customer Billing & Shipping Details
    const customerName = (
      orderData.customerName ||
      orderData.name ||
      orderData.shippingDetails?.fullName ||
      orderData.shippingAddress?.fullName ||
      'RC Racer'
    ).trim();

    const address = (
      orderData.deliveryAddress ||
      orderData.address ||
      orderData.shippingDetails?.address ||
      orderData.shippingAddress?.address ||
      orderData.shippingDetails?.flatAddress ||
      'Mysore Hub'
    ).trim();

    const city = (
      orderData.city ||
      orderData.shippingDetails?.city ||
      orderData.shippingAddress?.city ||
      'Mysore'
    ).trim();

    const pincode = String(
      orderData.pincode ||
      orderData.shippingDetails?.pincode ||
      orderData.shippingAddress?.pincode ||
      '570017'
    ).replace(/\D/g, '') || '570017';

    const state = (
      orderData.state ||
      orderData.shippingDetails?.state ||
      orderData.shippingAddress?.state ||
      'Karnataka'
    ).trim();

    // Customer Email: Fallback strictly to glitchxjod1@gmail.com if missing or empty
    const rawEmail = orderData.customerEmail || orderData.email || orderData.customerDetails?.email || '';
    const email = (rawEmail && typeof rawEmail === 'string' && rawEmail.includes('@'))
      ? rawEmail.trim()
      : 'glitchxjod1@gmail.com';

    // Phone (pure 10 digits)
    const rawPhone = String(
      orderData.phone ||
      orderData.mobile ||
      orderData.customerPhone ||
      orderData.shippingDetails?.phone ||
      '9686078395'
    ).replace(/\D/g, '');
    const phone = rawPhone.slice(-10) || '9686078395';

    // Map Order Items
    const rawItems = Array.isArray(orderData.items) && orderData.items.length > 0
      ? orderData.items
      : [{ name: 'Scale RC Machine', quantity: 1, price: Number(orderData.totalAmount || orderData.total || 999) }];

    const orderItems = rawItems.map((item, idx) => {
      const itemName = item.name || item.title || `RC Vehicle #${idx + 1}`;
      const itemSku = item.sku || String(item.id || item._id || `RC-SKU-${idx + 1}`).toLowerCase().replace(/[^a-z0-9]/g, '-');
      const itemUnits = Math.max(1, Number(item.quantity || item.qty || 1));
      const itemPrice = Math.max(1, Number(item.price || item.unitPrice || 0));

      return {
        name: itemName,
        sku: itemSku,
        units: itemUnits,
        selling_price: itemPrice,
        discount: 0,
        tax: 0,
        hsn: 9503
      };
    });

    // Payment Method: "COD" for Cash on Delivery, "Prepaid" for online
    const rawPayment = String(orderData.paymentMethod || orderData.paymentGateway || '').toLowerCase();
    const isPaidStatus = orderData.status === 'paid' || orderData.paymentStatus === 'paid';
    const isPrepaid = isPaidStatus || rawPayment.includes('prepaid') || rawPayment.includes('upi') || rawPayment.includes('online') || rawPayment.includes('card') || rawPayment.includes('shiprocket');

    const paymentMethod = isPrepaid ? 'Prepaid' : 'COD';
    const subTotal = Math.max(1, Number(orderData.totalAmount || orderData.total || orderData.subtotal || 0));

    // Shiprocket Adhoc Order Creation Payload
    const shiprocketPayload = {
      order_id: orderId,
      order_date: orderDateStr,
      pickup_location: 'Primary',
      channel_id: '',
      comment: 'Automated order sync from MJ RC BASE storefront',
      billing_customer_name: customerName,
      billing_last_name: '',
      billing_address: address,
      billing_address_2: '',
      billing_city: city,
      billing_pincode: pincode,
      billing_state: state,
      billing_country: 'India',
      billing_email: email,
      billing_phone: phone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: paymentMethod,
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: Number(orderData.coinDiscount || orderData.discount || 0),
      sub_total: subTotal,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5
    };

    console.log(`\n========================================`);
    console.log(`[SHIPROCKET ORDER SYNC] Dispatching order #${orderId} to Shiprocket API...`);
    console.log(`[SHIPROCKET PAYLOAD] Name: ${customerName}, Phone: ${phone}, Method: ${paymentMethod}, Total: ₹${subTotal}`);

    const response = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      shiprocketPayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );

    if (response.data && (response.data.order_id || response.data.shipment_id)) {
      const srOrderId = response.data.order_id;
      const srShipmentId = response.data.shipment_id;

      console.log(`✅ [SHIPROCKET SYNC SUCCESS]: Shiprocket Order ID: ${srOrderId}, Shipment ID: ${srShipmentId}`);
      console.log(`========================================\n`);

      return {
        success: true,
        shiprocket_synced: true,
        shiprocket_order_id: srOrderId,
        shipment_id: srShipmentId,
        data: response.data
      };
    } else {
      console.warn('⚠️ [Shiprocket API Warning]: Sync completed with unexpected response format:', response.data);
      return {
        success: true,
        shiprocket_synced: true,
        shiprocket_order_id: response.data?.order_id || null,
        shipment_id: response.data?.shipment_id || null,
        data: response.data
      };
    }
  } catch (err) {
    const errorDetails = err.response?.data || err.message;
    console.error('❌ [Shiprocket API Order Sync Failed]:', errorDetails);
    console.log(`========================================\n`);

    // Non-blocking error handling: Customer order still proceeds cleanly
    return {
      success: false,
      shiprocket_synced: false,
      error: typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails
    };
  }
}
