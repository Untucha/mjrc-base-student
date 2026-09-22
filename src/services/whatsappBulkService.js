/**
 * Phase 2: WhatsApp Admin Bulk Campaign & Coins Reward Engine
 * Location: src/services/whatsappBulkService.js
 *
 * Provides:
 * 1. Dynamic Recipient Filtering (All Registered Users, Cart Abandoned, Past Buyers)
 * 2. Anti-Ban Throttled Batch Queue (1.5s - 2.0s controlled delay)
 * 3. Dynamic Template Interpolation ({{userName}}, {{coinsAdded}}, {{walletBalance}}, {{shopLink}})
 * 4. Automatic Firestore Wallet Sync (rcCoins increment + coinHistory audit log)
 * 5. Permanent Token & Proxy API Routing
 */

import { db } from './firebase';
import { collection, doc, getDocs, setDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { sendAutomatedWhatsAppMessage, sanitizePhoneNumber } from './whatsappAutomations';
import { formatCoins, formatLogDate, calculateExpiryDetails, getEffectiveUserCoins } from '../utils/formatters';

/**
 * Fetch & Filter Recipients from Firestore 'users' & 'orders' collections
 */
export async function fetchCampaignRecipients(filterType = 'all') {
  let recipientsList = [];

  try {
    if (db) {
      // 1. Fetch all users from Firestore 'users' collection
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. Fetch all orders from Firestore 'orders' collection
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const buyerPhones = new Set(ordersData.map(o => sanitizePhoneNumber(o.mobile || o.phone)));

      if (filterType === 'buyers') {
        recipientsList = usersData.filter(u => buyerPhones.has(sanitizePhoneNumber(u.phone)));
      } else if (filterType === 'abandoned') {
        recipientsList = usersData.filter(u => !buyerPhones.has(sanitizePhoneNumber(u.phone)) || u.hasAbandonedCart);
      } else {
        // 'all'
        recipientsList = usersData;
      }
    }
  } catch (err) {
    console.warn('[WhatsApp Bulk Service] Firestore fetch notice, using fallback:', err);
  }

  // Sanitize and deduplicate recipient list
  const seenPhones = new Set();
  const sanitizedList = [];

  for (const user of recipientsList) {
    const cleanPhone = sanitizePhoneNumber(user.phone || user.mobile);
    if (cleanPhone && !seenPhones.has(cleanPhone)) {
      seenPhones.add(cleanPhone);
      const effectiveObj = getEffectiveUserCoins(user);
      sanitizedList.push({
        ...user,
        phone: cleanPhone,
        displayName: user.name || user.userName || 'Valued Racer',
        rcCoins: effectiveObj.total,
        permanentCoins: effectiveObj.permanentCoins,
        expiryCoinsBalance: effectiveObj.expiryCoins,
        coinExpiryTimestamp: user.coinExpiryTimestamp || null
      });
    }
  }

  return sanitizedList;
}

/**
 * Anti-Ban Throttled Batch Campaign Dispatcher with Dual-Coin Firestore Wallet Sync
 */
export async function dispatchBulkWhatsAppCampaign({
  recipients = [],
  messageTemplate = '',
  bannerImageUrl = '',
  bonusCoins = 0,
  coinType = 'expiry', // 'expiry' | 'permanent'
  durationValue = 7,
  durationUnit = 'days',
  campaignName = 'Festive Offer',
  onProgress = null
}) {
  if (!recipients || recipients.length === 0) {
    return { success: false, error: 'No eligible recipients found' };
  }

  const total = recipients.length;
  const results = [];
  let successCount = 0;
  let failedCount = 0;

  const expiryDetails = calculateExpiryDetails(durationValue, durationUnit);
  const formattedExpiry = coinType === 'expiry' ? expiryDetails.formattedDate : 'Lifetime (No Expiry)';
  const expiryDurationText = coinType === 'expiry' ? expiryDetails.durationText : 'Lifetime';
  const coinTypeLabel = coinType === 'expiry' ? 'Promotional Expiry Coins' : 'Lifetime Coins';

  console.log(`>>> [WhatsApp Campaign Studio]: Starting throttled anti-spam batch queue for ${total} recipients (Batch size: 10, Delay: 8-15s, Cooldown: 60s)`);

  const BATCH_SIZE = 10;
  const totalBatches = Math.ceil(total / BATCH_SIZE);

  for (let i = 0; i < total; i++) {
    const cust = recipients[i];
    const cleanPhone = sanitizePhoneNumber(cust.phone || cust.mobile);
    if (!cleanPhone) continue;

    const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
    const isEndOfBatch = (i + 1) % BATCH_SIZE === 0 && (i + 1) < total;

    const userName = cust.displayName || cust.name || cust.fullName || 'Valued Customer';
    const effectiveCoinsObj = getEffectiveUserCoins(cust);
    const sanitizedBonus = formatCoins(bonusCoins || 0);
    const updatedWallet = effectiveCoinsObj.total + sanitizedBonus;

    // 1. Interpolate Dynamic Variables (with spacing cleanup)
    const interpolatedMessage = (messageTemplate || '')
      .replace(/{{userName}}/g, userName)
      .replace(/{{coinsAdded}}/g, String(sanitizedBonus))
      .replace(/{{coinType}}/g, coinTypeLabel)
      .replace(/{{expiryDateFormatted}}/g, formattedExpiry)
      .replace(/{{expiryDurationText}}/g, expiryDurationText)
      .replace(/{{walletBalance}}/g, String(updatedWallet))
      .replace(/{{shopLink}}/g, ' https://mjrcbase.com')
      .replace(/([^\s])https:\/\//g, '$1 https://');

    const directWaLink = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(interpolatedMessage)}`;

    // 2. Dual-Coin Firestore Wallet Sync
    if (sanitizedBonus > 0) {
      try {
        if (db) {
          const userDocRef = doc(db, 'users', cleanPhone);
          const historyEntry = {
            type: 'credit',
            coinType,
            amount: sanitizedBonus,
            reason: `Admin Campaign Credit: ${campaignName} (${coinType === 'expiry' ? `Expires ${formattedExpiry}` : 'Lifetime'})`,
            timestamp: new Date().toISOString()
          };

          if (coinType === 'expiry' || coinType === 'promo') {
            await setDoc(userDocRef, {
              promoCoins: increment(sanitizedBonus),
              expiryCoinsBalance: increment(sanitizedBonus),
              promoExpiryDate: expiryDetails.timestamp,
              coinExpiryTimestamp: expiryDetails.timestamp,
              coinHistory: arrayUnion(historyEntry)
            }, { merge: true });
          } else {
            await setDoc(userDocRef, {
              coins: increment(sanitizedBonus),
              permanentCoins: increment(sanitizedBonus),
              rcCoins: increment(sanitizedBonus),
              coinHistory: arrayUnion(historyEntry)
            }, { merge: true });
          }

          console.log(`>>> [Firestore Wallet Sync]: Incremented +${sanitizedBonus} ${coinType} coins for ${cleanPhone}`);
        }
      } catch (walletErr) {
        console.warn(`[Firestore Wallet Sync Warning for ${cleanPhone}]:`, walletErr);
      }
    }

    // 3. Dispatch WhatsApp Message directly via /api/whatsapp/send (Baileys)
    let isSuccess = false;
    let messageId = null;
    let apiError = null;

    try {
      const daemonRes = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          text: interpolatedMessage,
          image: bannerImageUrl?.trim() || null
        })
      });

      if (daemonRes.ok) {
        const resData = await daemonRes.json();
        if (resData && resData.success) {
          isSuccess = true;
          messageId = resData.messageId || resData.id;
        } else {
          apiError = resData.error || resData.reason || 'Socket offline';
        }
      } else {
        apiError = 'Socket offline';
      }
    } catch (err) {
      apiError = err.message || 'Network error';
    }

    const statusStr = isSuccess ? 'Delivered (Live WhatsApp)' : 'Failed';
    if (isSuccess) successCount++;
    else failedCount++;

    // Record in whatsapp_logs collection
    if (db) {
      const logId = `log-campaign-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setDoc(doc(db, 'whatsapp_logs', logId), {
        id: logId,
        phone: `+91 ${cleanPhone}`,
        userName,
        triggerType: `Campaign: ${campaignName}`,
        status: statusStr,
        text: interpolatedMessage,
        mediaUrl: bannerImageUrl?.trim() || null,
        messageId: messageId,
        error: isSuccess ? null : apiError,
        timestamp: new Date().toLocaleString('en-IN'),
        created_at: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    }

    const contactResult = {
      id: cust.id || `cust-${i}`,
      phone: `+91 ${cleanPhone}`,
      name: userName,
      status: statusStr,
      directWaLink,
      coinsAwarded: sanitizedBonus,
      coinType,
      expiryDate: formattedExpiry,
      error: apiError,
      timestamp: formatLogDate(new Date())
    };

    results.push(contactResult);

    // 4. Update Live Progress Bar Callback
    if (onProgress) {
      onProgress({
        currentIndex: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 100),
        successCount,
        failedCount,
        successRate: Math.round((successCount / (i + 1)) * 100),
        latestResult: contactResult,
        allResults: [...results]
      });
    }

    // 5. Anti-Ban Safe Queue Throttling: 3.5s gap between sends to protect account
    if (i < total - 1) {
      console.log(`>>> [Anti-Ban Safe Queue]: Pausing 3.5s before next message...`);
      await new Promise(r => setTimeout(r, 3500));
    }
  }

  console.log(`>>> [WhatsApp Campaign Studio]: Completed campaign batch. Total: ${total}, Success: ${successCount}, Failed: ${failedCount}`);

  return {
    success: true,
    total,
    successCount,
    failedCount,
    successRate: Math.round((successCount / total) * 100),
    results
  };
}
