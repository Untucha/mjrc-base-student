/**
 * Shared Formatting Utilities for MJ RC BASE
 * Location: src/utils/formatters.js
 */

/**
 * BULLETPROOF 10-DIGIT NUMBER NORMALIZER
 * Strips non-digits and returns strictly the last 10 digits.
 */
export const getPure10Phone = (input) => {
  if (!input) return '';
  const raw = String(input).replace(/\D/g, '');
  return raw.slice(-10);
};

/**
 * COIN BALANCE SANITIZATION (Fix '1e+86' & Non-finite Glitch)
 */
export const formatCoins = (coins, fallback = 0) => {
  if (coins === undefined || coins === null || coins === '') return fallback;
  const num = Number(coins);
  if (!Number.isFinite(num) || isNaN(num) || num < 0 || num > 1000000) return fallback;
  return Math.floor(num);
};

/**
 * FIX 'Invalid Date' IN AUDIT LOGS & MESSAGES
 * Handles Firestore Timestamp objects (.toDate()), seconds objects, ISO strings, and Date instances.
 */
export const formatLogDate = (rawDate) => {
  if (!rawDate) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  let dateObj;
  if (typeof rawDate === 'object' && rawDate !== null && typeof rawDate.toDate === 'function') {
    dateObj = rawDate.toDate();
  } else if (typeof rawDate === 'object' && rawDate !== null && typeof rawDate.seconds === 'number') {
    dateObj = new Date(rawDate.seconds * 1000);
  } else {
    dateObj = new Date(rawDate);
  }
  return isNaN(dateObj.getTime())
    ? new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Calculate Expiry Timestamp & Formatted String
 */
export const calculateExpiryDetails = (durationValue = 7, durationUnit = 'days') => {
  const now = new Date();
  const val = Number(durationValue) || 7;
  const msToAdd = durationUnit === 'hours' ? val * 60 * 60 * 1000 : val * 24 * 60 * 60 * 1000;
  const expiryDate = new Date(now.getTime() + msToAdd);

  const formattedDate = expiryDate.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const durationText = durationUnit === 'hours' ? `${val} Hours` : `${val} Days`;

  return {
    timestamp: expiryDate.toISOString(),
    expiryMs: expiryDate.getTime(),
    formattedDate,
    durationText
  };
};

/**
 * Get Effective Dual-Coin Balance (Permanent + Active Unexpired Expiry Coins)
 */
export const getEffectiveUserCoins = (user = null) => {
  if (!user || (!user.phone && !user.cleanPhone && !user.uid && Object.keys(user).length === 0)) {
    return { total: 0, coins: 0, permanentCoins: 0, promoCoins: 0, expiryCoins: 0, isExpired: true };
  }
  const perm = formatCoins(user.coins ?? user.permanentCoins ?? user.rcCoins ?? 0, 0);
  const promo = formatCoins(user.promoCoins ?? user.expiryCoinsBalance ?? user.expiryCoins ?? 0, 0);

  const rawExpiryDate = user.promoExpiryDate ?? user.coinExpiryTimestamp ?? user.expiryTimestamp;

  if (promo <= 0 || !rawExpiryDate) {
    return { total: perm, coins: perm, permanentCoins: perm, promoCoins: 0, expiryCoins: 0, isExpired: true };
  }

  const expiryTime = new Date(rawExpiryDate).getTime();
  const isExpired = isNaN(expiryTime) || Date.now() > expiryTime;

  const validPromoCoins = isExpired ? 0 : promo;

  return {
    total: perm + validPromoCoins,
    coins: perm,
    permanentCoins: perm,
    promoCoins: validPromoCoins,
    expiryCoins: validPromoCoins,
    isExpired,
    expiryTimestamp: rawExpiryDate
  };
};
