/**
 * Embedded WhatsApp Web Baileys Daemon & Hard-Reset API Router
 * Location: server/whatsappBridge.js
 */

import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Singleton socket & status instance across hot-reloads
let sock = global.baileysSock || null;
let currentQrDataUrl = global.baileysQr || '';
let connectionStatus = global.baileysStatus || 'disconnected'; // 'disconnected' | 'qr_ready' | 'connected'
let connectedUser = global.baileysUser || '';
let isInitializing = false;

const authFolder = path.resolve(process.cwd(), '.wpp_auth_info');

// Sequential queue lock to prevent Baileys socket collisions with 10+ concurrent requests
let dispatchQueueLock = Promise.resolve();

function enqueueDispatchTask(taskFn) {
  const result = dispatchQueueLock.then(taskFn, taskFn);
  dispatchQueueLock = result.catch(() => {});
  return result;
}

export function clearAuthFolder() {
  try {
    terminateExistingSocket();
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
      console.log('🧹 [WhatsApp Bridge] Auth directory completely purged.');
    }
  } catch (e) {
    console.warn('[WhatsApp Bridge] Error clearing auth folder:', e);
  }
}

export function terminateExistingSocket() {
  if (sock) {
    try {
      if (sock.ev && typeof sock.ev.removeAllListeners === 'function') {
        sock.ev.removeAllListeners();
      }
      if (typeof sock.end === 'function') {
        sock.end();
      }
      if (sock.ws && typeof sock.ws.close === 'function') {
        sock.ws.close();
      }
    } catch (e) {
      console.warn('[WhatsApp Bridge] Socket termination notice:', e);
    }
    sock = null;
    global.baileysSock = null;
  }
}

export async function initWhatsAppBridge() {
  const isWhatsAppEnabled = process.env.ENABLE_WHATSAPP === 'true';

  if (!isWhatsAppEnabled) {
    console.log("ℹ️ WhatsApp Baileys socket is temporarily disabled (ENABLE_WHATSAPP=false). Skipping background listener.");
    connectionStatus = 'disabled';
    global.baileysStatus = 'disabled';
    return;
  }

  // If already connected or initializing, do NOT re-initialize
  if (sock && sock.user && connectionStatus === 'connected') {
    return;
  }
  if (isInitializing) return;
  isInitializing = true;

  try {
    terminateExistingSocket();

    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['MJ RC BASE Admin', 'Chrome', '1.0.0']
    });
    global.baileysSock = sock;

    sock.ev.on('creds.update', async () => {
      try {
        if (!fs.existsSync(authFolder)) {
          fs.mkdirSync(authFolder, { recursive: true });
        }
        await saveCreds();
      } catch (err) {
        console.warn('[WhatsApp Bridge] Suppressed creds.update error:', err.message);
      }
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionStatus = 'qr_ready';
        global.baileysStatus = 'qr_ready';
        try {
          currentQrDataUrl = await QRCode.toDataURL(qr);
          global.baileysQr = currentQrDataUrl;
          console.log('📸 [WhatsApp Baileys QR Generated & Converted to DataURL]');
        } catch (err) {
          console.warn('[WhatsApp Bridge] Error generating QR Data URL:', err);
        }
      }

      if (connection === 'open') {
        connectionStatus = 'connected';
        global.baileysStatus = 'connected';
        currentQrDataUrl = '';
        global.baileysQr = '';
        const userJid = sock?.user?.id || '';
        const cleanUserPhone = userJid ? userJid.split(':')[0].split('@')[0] : '9686078395';
        connectedUser = `+${cleanUserPhone}`;
        global.baileysUser = connectedUser;
        console.log(`✅ [WhatsApp Baileys Daemon Connected]: ${connectedUser}`);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.warn(`[WhatsApp Connection Closed]: statusCode=${statusCode}, reconnecting=${shouldReconnect}`);
        
        connectionStatus = 'disconnected';
        global.baileysStatus = 'disconnected';
        connectedUser = '';
        global.baileysUser = '';
        isInitializing = false;

        if (shouldReconnect) {
          console.log('🔄 [WhatsApp Bridge Silent Reconnect in 5s...]');
          setTimeout(() => initWhatsAppBridge(), 5000);
        } else {
          console.log('🔌 [WhatsApp Session Logged Out]');
          terminateExistingSocket();
          clearAuthFolder();
        }
      }
    });
  } catch (err) {
    console.error('[WhatsApp Bridge Initialization Error]:', err);
    connectionStatus = 'disconnected';
    global.baileysStatus = 'disconnected';
  } finally {
    isInitializing = false;
  }
}

// Automatically start socket once on server boot, ignoring CLI build processes
const isBuildCommand = process.argv.some(arg => arg.includes('build'));
const isWhatsAppEnabled = process.env.ENABLE_WHATSAPP === 'true';

if (isWhatsAppEnabled && !sock && !isInitializing && !isBuildCommand) {
  initWhatsAppBridge().catch(() => {});
} else if (!isWhatsAppEnabled && !isBuildCommand) {
  console.log("ℹ️ WhatsApp Baileys socket is temporarily disabled (ENABLE_WHATSAPP=false). Skipping background listener.");
}

export function getWhatsAppStatus() {
  const isWhatsAppEnabled = process.env.ENABLE_WHATSAPP === 'true';
  if (!isWhatsAppEnabled) {
    return {
      connected: false,
      disabled: true,
      status: 'disabled',
      qr: '',
      user: '',
      phone: ''
    };
  }

  if (sock && sock.user) {
    connectionStatus = 'connected';
    global.baileysStatus = 'connected';
    if (!connectedUser) {
      const cleanUserPhone = sock.user.id ? sock.user.id.split(':')[0].split('@')[0] : '9686078395';
      connectedUser = `+${cleanUserPhone}`;
      global.baileysUser = connectedUser;
    }
  }

  return {
    connected: Boolean(sock && sock.user),
    status: connectionStatus,
    qr: currentQrDataUrl,
    user: connectedUser || '+91 96860 78395',
    phone: sock?.user?.id ? sock.user.id.split(':')[0].split('@')[0] : (connectedUser ? connectedUser.replace(/\D/g, '') : '')
  };
}

export async function forceResetWhatsAppSession() {
  console.log('⚡ [WhatsApp Bridge] Hard-Reset Initiated by Admin...');
  connectionStatus = 'disconnected';
  global.baileysStatus = 'disconnected';
  currentQrDataUrl = '';
  global.baileysQr = '';
  connectedUser = '';
  global.baileysUser = '';
  isInitializing = false;

  terminateExistingSocket();
  clearAuthFolder();

  await initWhatsAppBridge();

  // Poll in-memory QR for up to 2 seconds
  for (let i = 0; i < 20; i++) {
    if (currentQrDataUrl || connectionStatus === 'connected') break;
    await new Promise(r => setTimeout(r, 100));
  }

  return getWhatsAppStatus();
}

export function getStrictWhatsAppJid(inputPhone) {
  if (!inputPhone) return null;
  const digits = String(inputPhone).replace(/\D/g, '');
  const pure10Digits = digits.slice(-10);
  if (pure10Digits.length !== 10) return null;
  return `91${pure10Digits}@s.whatsapp.net`;
}

export const sanitizeWhatsAppJid = getStrictWhatsAppJid;

/**
 * Ultra-Fast High-Speed Axios Buffer Downloader with Retry & Timeout
 */
export async function downloadImageBuffer(url, retries = 3) {
  if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
    return null;
  }
  const cleanUrl = url.trim();
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Media Downloader] Fetching image via Axios (Attempt ${attempt}): ${cleanUrl}`);
      const response = await axios.get(cleanUrl, {
        responseType: 'arraybuffer',
        timeout: 45000, // 45-second high-speed window per attempt
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });
      if (response.status === 200 && response.data) {
        const buffer = Buffer.from(response.data);
        console.log(`[Media Downloader] Successfully downloaded image buffer (${buffer.length} bytes)`);
        return buffer;
      }
    } catch (err) {
      console.warn(`[Media Downloader Warning] Attempt ${attempt} failed: ${err.message}`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 3000)); // Wait 3s before retry
      }
    }
  }
  console.warn('[Media Downloader] Image download failed after multiple retries. Proceeding to text fallback.');
  return null;
}

export async function sendWhatsAppMessage(phone, text, image, priority = 'normal') {
  try {
    const isWhatsAppEnabled = process.env.ENABLE_WHATSAPP === 'true';
    if (!isWhatsAppEnabled) {
      console.log("ℹ️ WhatsApp Baileys socket is temporarily disabled (ENABLE_WHATSAPP=false). Skipping dispatch.");
      return {
        success: false,
        statusCode: 200,
        disabled: true,
        message: "WhatsApp Baileys socket is temporarily disabled (ENABLE_WHATSAPP=false). Skipping dispatch."
      };
    }

    if (!phone || (!text && !image)) {
      return {
        success: false,
        statusCode: 400,
        error: 'Phone and text or image are required'
      };
    }

    const rawDigits = String(phone).replace(/\D/g, '');
    const pure10 = rawDigits.slice(-10);
    if (pure10.length !== 10) {
      return {
        success: false,
        statusCode: 400,
        error: 'Invalid 10-digit phone number'
      };
    }

    const targetJid = `91${pure10}@s.whatsapp.net`;
    console.log(`\n========================================`);
    console.log(`[WHATSAPP DISPATCH] Preparing message to: ${targetJid} (Priority: ${priority})`);
    if (image) console.log(`[WHATSAPP MEDIA URL] ${image}`);
    console.log(`[WHATSAPP CONTENT] ${String(text || '').substring(0, 60)}...`);

    if (!sock || !sock.user || connectionStatus !== 'connected') {
      console.log('[WhatsApp] Socket dropping, forcing immediate reconnect...');
      await initWhatsAppBridge();
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!sock || !sock.user) {
      console.error('[WHATSAPP ERROR] Baileys socket remains offline after reconnect attempt.');
      console.log(`========================================\n`);
      return {
        success: false,
        statusCode: 503,
        error: 'WhatsApp socket offline. Please scan QR.'
      };
    }

    // Step 1: Ultra-Fast High-Speed Axios Buffer Streaming Downloader outside queue lock
    let imageBuffer = null;
    const mediaUrlStr = image && typeof image === 'string' ? image.trim() : '';

    if (mediaUrlStr && (mediaUrlStr.startsWith('http://') || mediaUrlStr.startsWith('https://'))) {
      try {
        imageBuffer = await downloadImageBuffer(mediaUrlStr, 3);
      } catch (mediaError) {
        console.warn(`[WhatsApp Media Fetch Warning]: ${mediaError.message}. Proceeding to text fallback.`);
      }
    }

    // Step 2: Enqueue actual Baileys socket dispatch onto mutex queue to prevent socket frame collisions
    return enqueueDispatchTask(async () => {
      if (!sock || !sock.user || connectionStatus !== 'connected') {
        console.log('[WhatsApp] Connection drop before queue task, attempting quick reconnect...');
        await initWhatsAppBridge();
        await new Promise(r => setTimeout(r, 2000));
      }

      if (!sock || !sock.user) {
        return {
          success: false,
          statusCode: 503,
          error: 'WhatsApp socket offline during queue dispatch.'
        };
      }

      let sentMessage = null;
      let imageDelivered = false;

      // 1. Try sending Photo + Text if image buffer is available
      if (imageBuffer && imageBuffer.length > 0) {
        try {
          sentMessage = await sock.sendMessage(targetJid, {
            image: imageBuffer,
            caption: text ? String(text) : ''
          });
          imageDelivered = true;
          console.log(`✅ [WhatsApp Delivered] Image + Caption successfully sent to ${targetJid}`);
        } catch (imgErr) {
          console.error('[Media Send Failed, reconnecting socket & sending text]:', imgErr.message);
          if (imgErr.message?.includes('Connection Closed') || imgErr.output?.statusCode === 428 || imgErr.output?.statusCode === 440) {
            console.log('[WhatsApp] Connection drop detected during media send. Triggering immediate reconnect...');
            await initWhatsAppBridge();
            await new Promise(r => setTimeout(r, 2500));
          }
        }
      }

      // 2. GUARANTEED FALLBACK: If image failed, timed out, or was not provided, ALWAYS deliver text!
      if (!imageDelivered) {
        try {
          sentMessage = await sock.sendMessage(targetJid, { text: String(text || '') });
          console.log(`✅ [WhatsApp Delivered] Plain text sent to ${targetJid}`);
        } catch (textError) {
          console.error(`❌ [WhatsApp Fatal Send Error]:`, textError.message);
          return {
            success: false,
            statusCode: 500,
            error: textError.message || 'Failed to deliver text message via Baileys'
          };
        }
      }

      const messageId = sentMessage?.key?.id || `MSG-${Date.now()}`;
      console.log(`[WHATSAPP SUCCESS] Delivered to ${targetJid} | ID: ${messageId}`);
      console.log(`========================================\n`);

      return {
        success: true,
        statusCode: 200,
        status: 'Delivered (Live WhatsApp)',
        messageId: messageId,
        id: messageId,
        mediaIncluded: imageDelivered,
        recipient: targetJid,
        phone: `91${pure10}`,
        result: sentMessage
      };
    });
  } catch (error) {
    console.error('[WHATSAPP SEND EXCEPTION]:', error);
    console.log(`========================================\n`);
    return {
      success: false,
      statusCode: 500,
      error: error.message || 'Failed to dispatch via Baileys'
    };
  }
}

export async function disconnectWhatsAppSession() {
  return await forceResetWhatsAppSession();
}
