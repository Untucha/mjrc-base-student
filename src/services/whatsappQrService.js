/**
 * Dedicated WhatsApp QR Code Linking Bridge Service & Firestore Persistence Engine
 * Location: src/services/whatsappQrService.js
 */

import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

/**
 * Generate a dynamic QR Code Data SVG or Canvas payload for WhatsApp Web pairing
 */
export function generateWhatsAppQrCode(seed = Date.now()) {
  const sessionToken = `MJRC-WA-${seed}-${Math.floor(Math.random() * 899999 + 100000)}`;
  const pairingString = `2@${sessionToken},100000000000,MJRCBASE_STORE_HUB`;
  
  return {
    pairingString,
    sessionToken,
    generatedAt: new Date().toISOString(),
    expiresInSeconds: 60
  };
}

/**
 * Fetch WhatsApp Gateway Configuration & Link Status from Firestore settings/whatsapp_gateway
 */
export async function getWhatsAppGatewayStatus() {
  try {
    if (db) {
      const snap = await getDoc(doc(db, 'settings', 'whatsapp_gateway'));
      if (snap.exists()) {
        return snap.data();
      }
    }
  } catch (err) {
    console.warn('[WhatsApp QR Service] Could not fetch status from Firestore:', err);
  }
  return {
    status: 'disconnected',
    phone: '',
    deviceName: '',
    lastLinkedAt: null,
    fallbackWebEnabled: true
  };
}

/**
 * Save / Update WhatsApp Gateway Config in Firestore settings/whatsapp_gateway
 */
export async function updateWhatsAppGatewayConfig(config = {}) {
  const payload = {
    ...config,
    updatedAt: new Date().toISOString(),
    updated_at: serverTimestamp()
  };
  try {
    if (db) {
      await setDoc(doc(db, 'settings', 'whatsapp_gateway'), payload, { merge: true });
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('mj_whatsapp_gateway_config', JSON.stringify(payload));
    }
  } catch (err) {
    console.warn('[WhatsApp QR Service] Error updating gateway config:', err);
  }
  return payload;
}

/**
 * Disconnect current WhatsApp device link and reset Firestore settings/whatsapp_gateway
 */
export async function disconnectWhatsAppDevice() {
  const resetPayload = {
    status: 'disconnected',
    phone: '',
    deviceName: '',
    lastLinkedAt: null,
    disconnectedAt: new Date().toISOString(),
    fallbackWebEnabled: true,
    updated_at: serverTimestamp()
  };
  try {
    if (db) {
      await setDoc(doc(db, 'settings', 'whatsapp_gateway'), resetPayload, { merge: true });
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('mj_whatsapp_gateway_config', JSON.stringify(resetPayload));
      sessionStorage.removeItem('mj_wa_qr_session');
    }
  } catch (err) {
    console.warn('[WhatsApp QR Service] Error disconnecting device:', err);
  }
  return resetPayload;
}

/**
 * Simulate scanning QR Code (for instant testing / linking client business phone)
 */
export async function completeWhatsAppDeviceLinking(phoneNumber = '+91 96860 78395', deviceName = 'WhatsApp Business Web') {
  const cleanPhone = String(phoneNumber).replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+${cleanPhone}`;

  const linkPayload = {
    status: 'connected',
    phone: formattedPhone,
    cleanPhone: cleanPhone.slice(-10),
    deviceName,
    lastLinkedAt: new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    fallbackWebEnabled: true,
    updated_at: serverTimestamp()
  };

  try {
    if (db) {
      await setDoc(doc(db, 'settings', 'whatsapp_gateway'), linkPayload, { merge: true });
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('mj_whatsapp_gateway_config', JSON.stringify(linkPayload));
    }
  } catch (err) {
    console.warn('[WhatsApp QR Service] Error completing device link:', err);
  }
  return linkPayload;
}
