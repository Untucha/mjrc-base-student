import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { triggerInstantWelcome, triggerOrderConfirmation, sendWhatsAppOrderNotification, triggerLogisticsAlert, triggerCampaignBroadcast, sendCloudWhatsAppMessage, logWhatsAppMessage } from '../services/whatsappCloudApi';
import { analyzeAndProcessShiprocketStatus, triggerAuthWelcomeAutomation, triggerCheckoutOrderConfirmation, triggerAdminManualBroadcast, sendWhatsAppNotification } from '../services/whatsappAutomations';
import { INITIAL_PRODUCTS, CATEGORIES, BRANDS } from '../data/products';
import { formatCoins, formatLogDate } from '../utils/formatters';
import { db, auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  arrayUnion,
  increment,
  query,
  where
} from 'firebase/firestore';

export const getPure10Phone = (input) => {
  if (!input) return '';
  const raw = String(input).replace(/\D/g, '');
  return raw.slice(-10);
};

export const getCanonicalPhone = (phone) => {
  if (!phone) return '';
  const clean = getPure10Phone(phone);
  return clean.length === 10 ? `+91 ${clean}` : String(phone);
};

const StoreContext = createContext();

const getSafeSyncChannel = () => (typeof window !== 'undefined' && 'BroadcastChannel' in window) ? new BroadcastChannel('mjrc_ultra_sync_mesh') : null;

export const broadcastMasterSync = (type, payload) => {
  const packet = { type, payload, timestamp: Date.now() };
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mjrc_local_sync', { detail: packet }));
  try {
    const ch = getSafeSyncChannel();
    if (ch) { ch.postMessage(packet); setTimeout(() => ch.close(), 100); }
  } catch (e) {}
  try {
    if (window.__mjrc_ws && window.__mjrc_ws.readyState === WebSocket.OPEN) window.__mjrc_ws.send(JSON.stringify(packet));
  } catch (e) {}
};

export const broadcastLiveTelemetry = (type, payload) => broadcastMasterSync(type, payload);

// Utility to scrub undefined properties from objects before Firestore setDoc / updateDoc calls
export const sanitizeForFirestore = (obj) => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(v => (v === undefined ? null : sanitizeForFirestore(v)));
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean;
  }
  return obj;
};

// Universal Multi-Device Live Sync Engine & Storage Bridge
export const broadcastCatalogUpdate = (updatedProducts) => {
  if (!updatedProducts) return;
  try {
    localStorage.setItem('mjrc_products', JSON.stringify(updatedProducts));
    localStorage.setItem('mj_products_v4', JSON.stringify(updatedProducts));
  } catch (e) {
    console.warn('[MJ Storage] Error saving products:', e);
  }

  broadcastMasterSync('CATALOG_MUTATION', updatedProducts);
};

const DEFAULT_PRODUCTS = [];

const DEFAULT_LATEST_RC_CARS = [];

const DEFAULT_DRIVER_LOGINS = [];
const DEFAULT_OTP_LOGS = [];
const DEFAULT_HERO_BANNER = null;
const DEFAULT_ADDONS = [];
const DEFAULT_ORDERS = [];
const DEFAULT_CUSTOMERS = [];
const DEFAULT_USER = null;
const DEFAULT_REFERRAL_NETWORK = [];
const DEFAULT_WHATSAPP_TEMPLATE = null;

export const isMockItem = (p) => {
  if (!p) return true;
  if (p.isMock === true) return true;
  const name = String(p.name || p.title || '').trim().toLowerCase();
  const id = String(p.id || '').trim().toLowerCase();
  const mockTitles = ['drift rc 1', 'drift rc 2', 'drift rc 3', 'monster truck 1', 'monster truck 2', 'monster truck 3', 'monster4'];
  if (mockTitles.some(m => name === m || name.includes(m) || id === m)) return true;
  return false;
};

const DEFAULT_BRAND_VISIBILITY = {
  'HOT WHEELS': true,
  'WLtoys': true,
  'FMS': true,
  'Bburago': true,
  'RLAARLO': true,
  'MJX R/C': true,
  'HStar': true,
  'CCA AUTO': true,
  'MINI GT': true,
  'JIABAILE': true,
  'RGT': true,
  'JJRC': true,
  'HB TOYS': true,
  'MN MODEL': true,
  'ARRMA / TRAXXAS': true,
  'TRAXXAS': true,
  'AXIAL': true,
  'ARRMA': true,
  'KYOSHO': true
};

export const DEFAULT_CATEGORIES = [
  { id: 'rc-crawlers', name: 'RC Crawlers', slug: 'rc-crawlers', label: 'RC Crawlers', image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=300&q=80', icon: '🧗', description: 'Extreme 4WD trail & rock crawlers with portal axles and scale specs.', isVisible: true, sortOrder: 1 },
  { id: 'trail-pickups', name: 'Trail Pickups', slug: 'trail-pickups', label: 'Trail Pickups', image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=300&q=80', icon: '🛻', description: 'Scale 4x4 trail pickups and adventure rigs.', isVisible: true, sortOrder: 2 },
  { id: 'drift-and-rally', name: 'Drift and Rally', slug: 'drift-and-rally', label: 'Drift and Rally', image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=300&q=80', icon: '🏎️', description: 'Precision drift machines and high-speed rally cars.', isVisible: true, sortOrder: 3 },
  { id: 'bashers-and-monster', name: 'Bashers and Monster', slug: 'bashers-and-monster', label: 'Bashers and Monster', image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=300&q=80', icon: '⚡', description: 'High-speed bashing monster trucks and stunt vehicles.', isVisible: true, sortOrder: 4 },
  { id: 'heavy-machinery', name: 'Heavy Machinery', slug: 'heavy-machinery', label: 'Heavy Machinery', image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=300&q=80', icon: '🚜', description: 'Full hydraulic excavators, heavy dump trucks & loaders.', isVisible: true, sortOrder: 5 },
  { id: 'short-course', name: 'Short course', slug: 'short-course', label: 'Short course', image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=300&q=80', icon: '🏁', description: 'Off-road short course racing trucks and buggies.', isVisible: true, sortOrder: 6 }
];

export const DEFAULT_BRANDS = [
  'HOT WHEELS', 'WLtoys', 'FMS', 'Bburago', 'RLAARLO', 'MJX R/C', 'HStar', 'CCA AUTO', 'MINI GT', 'JIABAILE', 'RGT', 'JJRC', 'HB TOYS', 'MN MODEL', 'TRAXXAS', 'AXIAL', 'ARRMA', 'KYOSHO'
];

export const DEFAULT_OFFICIAL_BRANDS = [
  { id: 'hotwheels', name: 'HotWheels', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Hot_Wheels_logo.svg', isVisible: true, brandGroup: 'speed_scale', isCrawlerBrand: false, sortOrder: 1 },
  { id: 'wltoys', name: 'WLtoys', logoUrl: '', isVisible: true, brandGroup: 'speed_scale', isCrawlerBrand: false, sortOrder: 2 },
  { id: 'fms', name: 'FMS', logoUrl: '', isVisible: true, brandGroup: 'crawler', isCrawlerBrand: true, sortOrder: 3 },
  { id: 'bburago', name: 'Bburago', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Bburago_logo.svg', isVisible: true, brandGroup: 'speed_scale', isCrawlerBrand: false, sortOrder: 4 },
  { id: 'rlaarlo', name: 'RLAARLO', logoUrl: '', isVisible: true, brandGroup: 'speed_scale', isCrawlerBrand: false, sortOrder: 5 },
  { id: 'mjx-rc', name: 'MJX R/C', logoUrl: '', isVisible: true, brandGroup: 'speed_scale', isCrawlerBrand: false, sortOrder: 6 },
  { id: 'hstar', name: 'HStar', logoUrl: '', isVisible: true, brandGroup: 'speed_scale', isCrawlerBrand: false, sortOrder: 7 },
  { id: 'cca-auto', name: 'CCA AUTO', logoUrl: '', isVisible: true, brandGroup: 'speed_scale', isCrawlerBrand: false, sortOrder: 8 },
  { id: 'mini-gt', name: '1:64 MINI GT', logoUrl: '', isVisible: true, brandGroup: 'speed_scale', isCrawlerBrand: false, sortOrder: 9 },
  { id: 'jiabaile', name: 'JIABAILE', logoUrl: '', isVisible: true, brandGroup: 'speed_scale', isCrawlerBrand: false, sortOrder: 10 },
  { id: 'rgt-4wd', name: 'RGT 4WD', logoUrl: '', isVisible: true, brandGroup: 'crawler', isCrawlerBrand: true, sortOrder: 11 },
  { id: 'jjrc', name: 'JJR/C', logoUrl: '', isVisible: true, brandGroup: 'crawler', isCrawlerBrand: true, sortOrder: 12 },
  { id: 'hb-toys', name: 'HB TOYS', logoUrl: '', isVisible: true, brandGroup: 'crawler', isCrawlerBrand: true, sortOrder: 13 },
  { id: 'mn-model', name: 'MN MODEL', logoUrl: '', isVisible: true, brandGroup: 'crawler', isCrawlerBrand: true, sortOrder: 14 },
  { id: 'traxxas', name: 'TRAXXAS', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Traxxas_logo.svg', isVisible: true, brandGroup: 'crawler', isCrawlerBrand: true, sortOrder: 15 },
  { id: 'axial', name: 'AXIAL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Axial_R-C_logo.png', isVisible: true, brandGroup: 'crawler', isCrawlerBrand: true, sortOrder: 16 },
  { id: 'arrma', name: 'ARRMA', logoUrl: '', isVisible: true, brandGroup: 'speed_scale', isCrawlerBrand: false, sortOrder: 17 },
  { id: 'kyosho', name: 'KYOSHO', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Kyosho_logo.svg', isVisible: true, brandGroup: 'speed_scale', isCrawlerBrand: false, sortOrder: 18 }
];

export const DEFAULT_TICKER_ITEMS = [
  "100% BENCH-TESTED BEFORE PACKING",
  "24H MYSORE AIR CARGO DISPATCH",
  "LIFETIME GENUINE RC SPARES SUPPORT",
  "256-BIT ENCRYPTED INSTANT CHECKOUT"
];

export const DEFAULT_TICKER_CONFIG = {
  items: DEFAULT_TICKER_ITEMS,
  isActive: true
};


const getSafeStorage = (key, fallback, validateFn) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (validateFn && !validateFn(parsed)) {
      console.warn(`[MJ Storage] Validation failed for ${key}, resetting corrupt key.`);
      try { localStorage.removeItem(key); } catch {}
      return fallback;
    }
    return parsed;
  } catch (e) {
    console.warn(`[MJ Storage] Corrupt JSON for ${key}, auto-clearing storage key.`, e);
    try { localStorage.removeItem(key); } catch {}
    return fallback;
  }
};

const liveSyncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('mjrc_sync')
  : null;

function broadcastRealtimeSync(type, payload) {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel('mjrc_live_telemetry_sync');
      channel.postMessage({ type: type || 'STORE_UPDATE', payload });
      channel.close();

      const channel2 = new BroadcastChannel('mj_rc_store_realtime_sync');
      channel2.postMessage({ type: type || 'STORE_UPDATE', payload });
      channel2.close();
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }
  }
}

export const StoreProvider = ({ children }) => {
  // Toast Notification State & Helper (Defined at top of StoreProvider before all effects/callbacks)
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Auto-Purge corrupt/outdated LocalStorage keys on boot & unify single source of truth
  useEffect(() => {
    try {
      [
        'mjrc_store_products', 'mjrc_products', 'mj_products_v4', 'mj_products', 'mj_latest_rc_cars_v1', 'mj_latest_rc_cars',
        'mj_orders_v3', 'mj_orders', 'mjrc_mock_orders', 'admin_orders_data', 'test_users',
        'mj_customers_v2', 'mj_customers', 'mj_driver_logins', 'mj_otp_logs', 'mj_referrals_list', 'mj_referral_network',
        'mj_reviews_list', 'mjrc_mock_reviews', 'demo_testimonials'
      ].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });
      const keysToClean = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('mj_') || key.startsWith('mjrc_'))) {
          try {
            const val = localStorage.getItem(key);
            if (val) JSON.parse(val);
          } catch {
            keysToClean.push(key);
          }
        }
      }
      keysToClean.forEach(k => {
        console.warn(`[MJ Boot Purge] Removing corrupt storage key: ${k}`);
        localStorage.removeItem(k);
      });
    } catch {}
  }, []);

  const [products, setProducts] = useState([]);

  // Compute live latest RC cars dynamically from products so mobile devices never lock onto stale local storage
  const activeLatestRcCars = useMemo(() => {
    if (products && products.length > 0) {
      const active = products.filter(p => p.hidden !== true && p.isVisible !== false);
      if (active.length > 0) return active.slice(0, 10);
    }
    return DEFAULT_LATEST_RC_CARS;
  }, [products]);

  // Real-time Firestore sync & initial catalog auto-seed
  useEffect(() => {
    const q = collection(db, 'products');

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: false }, async (snapshot) => {
      console.log("🔥 FIRESTORE REALTIME UPDATE DETECTED:", snapshot.docs.length);

      if (snapshot.empty) {
        console.log('[Firestore] Seeding empty products collection...');
        try {
          const batch = writeBatch(db);
          const initialSource = (INITIAL_PRODUCTS && INITIAL_PRODUCTS.length > 0) ? INITIAL_PRODUCTS : DEFAULT_PRODUCTS;
          initialSource.forEach((prod) => {
            const docRef = doc(db, 'products', String(prod.id));
            batch.set(docRef, { ...prod, hidden: Boolean(prod.hidden) });
          });
          await batch.commit();
          console.log('[Firestore] Seeding initial products complete.');
        } catch (err) {
          console.error('[Firestore] Seeding error:', err);
        }
      } else {
        const rawItems = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return {
              ...data,
              id: docSnap.id,
              hidden: Boolean(data.hidden)
            };
          })
          .filter(item => !isMockItem(item));

        // Strict Deduplication by ID to prune duplicate entries created during testing
        const uniqueMap = new Map();
        rawItems.forEach((item) => {
          const key = String(item.id || item._id).trim();
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item);
          }
        });
        const items = Array.from(uniqueMap.values());
        setProducts([...items]);
        broadcastRealtimeSync('PRODUCTS_MUTATED', items);
      }
    }, (error) => {
      console.error("🔥 FIRESTORE LISTENER ERROR:", error);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync for orders (Strictly pure Firestore data, zero mock seeding)
  useEffect(() => {
    const ordersCol = collection(db, 'orders');
    const unsubscribe = onSnapshot(ordersCol, (snapshot) => {
      if (snapshot.empty) {
        setOrders([]);
      } else {
        const loadedOrders = snapshot.docs.map(docSnap => ({
          ...docSnap.data(),
          id: docSnap.id
        }));
        setOrders(loadedOrders);
      }
    }, (err) => console.warn('[Firestore] Orders listener notice:', err));
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync for users
  useEffect(() => {
    const usersCol = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      if (!snapshot.empty) {
        const loadedUsers = snapshot.docs.map(docSnap => ({
          ...docSnap.data(),
          id: docSnap.id
        }));
        setCustomers(loadedUsers);
      } else {
        setCustomers([]);
      }
    }, (err) => console.warn('[Firestore] Users listener notice:', err));
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync for whatsapp_logs
  const [whatsappLogs, setWhatsappLogs] = useState([]);
  useEffect(() => {
    const logsCol = collection(db, 'whatsapp_logs');
    const unsubscribe = onSnapshot(logsCol, (snapshot) => {
      if (!snapshot.empty) {
        const loadedLogs = snapshot.docs.map(docSnap => ({
          ...docSnap.data(),
          id: docSnap.id
        })).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        setWhatsappLogs(loadedLogs);
      } else {
        setWhatsappLogs([]);
      }
    }, (err) => console.warn('[Firestore] WhatsApp logs listener notice:', err));
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync for reviews collection (Pure Firestore data, zero mock seeding)
  useEffect(() => {
    const reviewsCol = collection(db, 'reviews');
    const unsubscribe = onSnapshot(reviewsCol, (snapshot) => {
      if (!snapshot.empty) {
        const loadedReviews = snapshot.docs.map(docSnap => ({
          ...docSnap.data(),
          id: docSnap.id
        }));
        setReviewsList(loadedReviews);
      } else {
        setReviewsList([]);
      }
    }, (err) => console.warn('[Firestore] Reviews listener notice:', err));
    return () => unsubscribe();
  }, []);

  const clearTestWhatsAppLogs = useCallback(async () => {
    try {
      if (db) {
        const snap = await getDocs(collection(db, 'whatsapp_logs'));
        const deletePromises = snap.docs.map(docSnap => deleteDoc(doc(db, 'whatsapp_logs', docSnap.id)));
        await Promise.all(deletePromises);
      }
      setWhatsappLogs([]);
      if (showToast) showToast('🧹 All test WhatsApp audit logs cleared from Firestore!');
    } catch (err) {
      console.error('Error clearing test whatsapp logs:', err);
      setWhatsappLogs([]);
      if (showToast) showToast('Cleared test WhatsApp logs!');
    }
  }, [showToast]);

  const purgeAllTestUsersAndResetCrm = useCallback(async () => {
    try {
      if (db) {
        // 1. Delete all whatsapp_logs
        const logsSnap = await getDocs(collection(db, 'whatsapp_logs'));
        const deleteLogs = logsSnap.docs.map(docSnap => deleteDoc(doc(db, 'whatsapp_logs', docSnap.id)));
        await Promise.all(deleteLogs);

        // 2. Unconditionally delete ALL user documents from 'users' collection
        const usersSnap = await getDocs(collection(db, 'users'));
        const deleteUsers = usersSnap.docs.map(docSnap => deleteDoc(doc(db, 'users', docSnap.id)));
        await Promise.all(deleteUsers);
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('mj_customers_v2');
        localStorage.removeItem('mj_customers');
        localStorage.removeItem('mj_user_v2');
        localStorage.removeItem('mjrc_user');
        sessionStorage.clear();
      }

      setWhatsappLogs([]);
      setCustomers([]);
      setDriverLogins([]);
      setOtpLogs([]);
      setUser(null);

      if (showToast) showToast('All test users purged. Ready for fresh registration.');
    } catch (err) {
      console.error('Error purging test users and logs:', err);
      setWhatsappLogs([]);
      setCustomers([]);
      setUser(null);
      if (showToast) showToast('All test users purged. Ready for fresh registration.');
    }
  }, [showToast]);

  const purgeAllTestOrdersAndResetDatabase = useCallback(async () => {
    try {
      if (db) {
        // 1. Delete all order documents from Firestore 'orders'
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const deleteOrders = ordersSnap.docs.map(docSnap => deleteDoc(doc(db, 'orders', docSnap.id)));
        await Promise.all(deleteOrders);

        // 2. Clear whatsapp_logs
        const logsSnap = await getDocs(collection(db, 'whatsapp_logs'));
        const deleteLogs = logsSnap.docs.map(docSnap => deleteDoc(doc(db, 'whatsapp_logs', docSnap.id)));
        await Promise.all(deleteLogs);
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('mj_orders_v3');
        localStorage.removeItem('mj_orders_v2');
        localStorage.removeItem('mj_orders');
      }

      setOrders([]);
      setWhatsappLogs([]);

      if (showToast) showToast('Database reset to 0. Ready for genuine live orders.');
    } catch (err) {
      console.error('Error purging test orders:', err);
      setOrders([]);
      setWhatsappLogs([]);
      if (showToast) showToast('Database reset to 0. Ready for genuine live orders.');
    }
  }, [showToast]);

  const [heroBanner, setHeroBanner] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_hero_banner_v3');
      return saved ? JSON.parse(saved) : DEFAULT_HERO_BANNER;
    } catch {
      return DEFAULT_HERO_BANNER;
    }
  });

  const [addonsConfig, setAddonsConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_addons_config');
      return saved ? JSON.parse(saved) : DEFAULT_ADDONS;
    } catch {
      return DEFAULT_ADDONS;
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_orders_v3');
      return saved ? JSON.parse(saved) : DEFAULT_ORDERS;
    } catch {
      return DEFAULT_ORDERS;
    }
  });

  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_customers_v2');
      return saved ? JSON.parse(saved) : DEFAULT_CUSTOMERS;
    } catch {
      return DEFAULT_CUSTOMERS;
    }
  });

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User state restores from persisted local device session (or defaults to null)
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('mjrc_user') || localStorage.getItem('mj_auth_user') || localStorage.getItem('mj_user_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.phone || parsed.uid || parsed.cleanPhone)) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  // WhatsApp Meta Cloud API & Automation Config
  const [whatsappConfig, setWhatsappConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_whatsapp_config');
      return saved ? JSON.parse(saved) : {
        whatsappApiKey: '',
        phoneNumberId: '',
        autoWelcome: true,
        autoBill: true,
        autoReviewRequest: true,
        mode: 'simulation'
      };
    } catch {
      return {
        whatsappApiKey: '',
        phoneNumberId: '',
        autoWelcome: true,
        autoBill: true,
        autoReviewRequest: true,
        mode: 'simulation'
      };
    }
  });

  // Storefront Verified Reviews State
  const [reviewsList, setReviewsList] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_reviews_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedScale, setSelectedScale] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [activeProductModal, setActiveProductModal] = useState(null);

  // WhatsApp Broadcast Templates State
  const [broadcastTemplates, setBroadcastTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_broadcast_templates');
      return saved ? JSON.parse(saved) : {
        welcome: 'Hi {name}! Welcome to MJ RC BASE. Enjoy 500 Welcome RC Coins in your wallet. Shop hobby RC scale beasts now!',
        dispatch: 'Hi {name}! Your order #{orderId} is packed & bench-tested at Mysore Central Hub. Track live: AWB-{awb}.',
        flashSale: '🔥 FESTIVE VIP DEAL ALERT for {name}! Get an extra 15% OFF on all 6S Brushless Bashers + 500 RC Coins in your wallet! Shop now at MJ RC BASE.'
      };
    } catch {
      return {
        welcome: 'Hi {name}! Welcome to MJ RC BASE. Enjoy 500 Welcome RC Coins in your wallet. Shop hobby RC scale beasts now!',
        dispatch: 'Hi {name}! Your order #{orderId} is packed & bench-tested at Mysore Central Hub. Track live: AWB-{awb}.',
        flashSale: '🔥 FESTIVE VIP DEAL ALERT for {name}! Get an extra 15% OFF on all 6S Brushless Bashers + 500 RC Coins in your wallet! Shop now at MJ RC BASE.'
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('mj_broadcast_templates', JSON.stringify(broadcastTemplates));
  }, [broadcastTemplates]);

  // Referral Network State & Festive Campaign Engine
  const [referralsList, setReferralsList] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_referrals_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isScaleModelsEnabled, setIsScaleModelsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_scale_models_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem('mj_scale_models_enabled', JSON.stringify(isScaleModelsEnabled));
  }, [isScaleModelsEnabled]);

  const [festiveCampaign, setFestiveCampaign] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_festive_campaign');
      return saved ? JSON.parse(saved) : {
        title: '⚡ FESTIVE RC SPEED DASH 2026',
        discount: 15,
        selectedProductId: 'rc-001',
        couponCode: 'FESTIVE15',
        targetAudience: 'all',
        message: '🔥 FESTIVE VIP DEAL ALERT! Get 15% OFF on ARRMA Kraton 6S + 500 RC Coins in your wallet! Shop now at MJ RC BASE.'
      };
    } catch {
      return {
        title: '⚡ FESTIVE RC SPEED DASH 2026',
        discount: 15,
        selectedProductId: 'rc-001',
        couponCode: 'FESTIVE15',
        targetAudience: 'all',
        message: '🔥 FESTIVE VIP DEAL ALERT! Get 15% OFF on ARRMA Kraton 6S + 500 RC Coins in your wallet! Shop now at MJ RC BASE.'
      };
    }
  });

  // Telemetry & WhatsApp Automation States
  const [driverLogins, setDriverLogins] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_driver_logins');
      return saved ? JSON.parse(saved) : DEFAULT_DRIVER_LOGINS;
    } catch {
      return DEFAULT_DRIVER_LOGINS;
    }
  });

  const [otpLogs, setOtpLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_otp_logs');
      return saved ? JSON.parse(saved) : DEFAULT_OTP_LOGS;
    } catch {
      return DEFAULT_OTP_LOGS;
    }
  });

  const [referralNetwork, setReferralNetwork] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_referral_network');
      return saved ? JSON.parse(saved) : DEFAULT_REFERRAL_NETWORK;
    } catch {
      return DEFAULT_REFERRAL_NETWORK;
    }
  });

  const [whatsAppTemplate, setWhatsAppTemplate] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_whatsapp_template');
      return saved || DEFAULT_WHATSAPP_TEMPLATE;
    } catch {
      return DEFAULT_WHATSAPP_TEMPLATE;
    }
  });

  const [isAutoWhatsAppWelcome, setIsAutoWhatsAppWelcome] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_auto_whatsapp_welcome');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const DEFAULT_WELCOME_CONFIG = useMemo(() => ({
    imageUrl: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
    headline: 'Welcome to MJ RC BASE Mysore Driver Network! 🏆',
    body: 'You have been credited with 🪙 {{coinsCredited}} Welcome RC Coins valid for {{expiryDate}}. Start shopping hobby RC scale beasts now!'
  }), []);

  const [welcomeConfig, setWelcomeConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_welcome_config');
      return saved ? JSON.parse(saved) : {
        imageUrl: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
        headline: 'Welcome to MJ RC BASE Mysore Driver Network! 🏆',
        body: 'You have been credited with 🪙 {{coinsCredited}} Welcome RC Coins valid for {{expiryDate}}. Start shopping hobby RC scale beasts now!'
      };
    } catch {
      return {
        imageUrl: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
        headline: 'Welcome to MJ RC BASE Mysore Driver Network! 🏆',
        body: 'You have been credited with 🪙 {{coinsCredited}} Welcome RC Coins valid for {{expiryDate}}. Start shopping hobby RC scale beasts now!'
      };
    }
  });

  // Sync welcomeConfig with Firestore 'crm_settings/welcome_config'
  useEffect(() => {
    const docRef = doc(db, 'crm_settings', 'welcome_config');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const rawUrl = (data.bannerUrl || data.imageUrl || data.welcomeBannerUrl || '').trim() || DEFAULT_WELCOME_CONFIG.imageUrl;
        const updated = {
          imageUrl: rawUrl,
          bannerUrl: rawUrl,
          welcomeBannerUrl: rawUrl,
          headline: data.headline || DEFAULT_WELCOME_CONFIG.headline,
          body: data.body || DEFAULT_WELCOME_CONFIG.body
        };
        setWelcomeConfig(updated);
        try { localStorage.setItem('mj_welcome_config', JSON.stringify(updated)); } catch (e) {}
      }
    }, (err) => console.warn('[Firestore] welcome_config listener notice:', err));
    return () => unsubscribe();
  }, [DEFAULT_WELCOME_CONFIG]);

  // Real-time Firestore sync for settings/general (welcomeBonusCoins)
  const [welcomeBonusCoins, setWelcomeBonusCoins] = useState(500);

  useEffect(() => {
    if (!db) return;
    const docRef = doc(db, 'settings', 'general');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (typeof data.welcomeBonusCoins === 'number') {
          setWelcomeBonusCoins(data.welcomeBonusCoins);
        }
      }
    }, (err) => console.warn('[Firestore] settings/general listener notice:', err));
    return () => unsubscribe();
  }, []);

  const updateWelcomeBonusCoins = useCallback(async (newCoins) => {
    const coinsVal = Number(newCoins) >= 0 ? Number(newCoins) : 500;
    setWelcomeBonusCoins(coinsVal);
    try {
      await setDoc(doc(db, 'settings', 'general'), { welcomeBonusCoins: coinsVal }, { merge: true });
      showToast(`Welcome bonus coins updated to ${coinsVal}!`);
    } catch (err) {
      console.error('Error updating welcome bonus coins in Firestore:', err);
    }
  }, [showToast]);

  const updateWelcomeConfig = useCallback(async (newConfig) => {
    const rawUrl = (newConfig.bannerUrl || newConfig.imageUrl || newConfig.welcomeBannerUrl || '').trim();
    const finalUrl = rawUrl || welcomeConfig.bannerUrl || welcomeConfig.imageUrl || DEFAULT_WELCOME_CONFIG.imageUrl;
    const updated = {
      imageUrl: finalUrl,
      bannerUrl: finalUrl,
      welcomeBannerUrl: finalUrl,
      headline: (newConfig.headline || '').trim() || welcomeConfig.headline,
      body: (newConfig.body || '').trim() || welcomeConfig.body
    };
    setWelcomeConfig(updated);
    try { localStorage.setItem('mj_welcome_config', JSON.stringify(updated)); } catch (e) {}
    await setDoc(doc(db, 'crm_settings', 'welcome_config'), updated, { merge: true }).catch(err => {
      console.error('[Firestore] updateWelcomeConfig error:', err);
    });
    showToast('Welcome onboarding template updated & synced to Firestore!');
  }, [welcomeConfig, DEFAULT_WELCOME_CONFIG, showToast]);

  const [whatsAppWelcomeTemplate, setWhatsAppWelcomeTemplate] = useState("Welcome to MJ RC BASE!");

  useEffect(() => {
    localStorage.setItem('mj_auto_whatsapp_welcome', JSON.stringify(isAutoWhatsAppWelcome));
  }, [isAutoWhatsAppWelcome]);

  const [brandVisibility, setBrandVisibility] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_brand_visibility');
      return saved ? JSON.parse(saved) : DEFAULT_BRAND_VISIBILITY;
    } catch {
      return DEFAULT_BRAND_VISIBILITY;
    }
  });

  const [brandsList, setBrandsList] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_brands_list');
      return saved ? JSON.parse(saved) : DEFAULT_OFFICIAL_BRANDS;
    } catch {
      return DEFAULT_OFFICIAL_BRANDS;
    }
  });

  // Listen to Firestore 'brands' collection in real-time
  useEffect(() => {
    const brandsCol = collection(db, 'brands');
    const unsubscribe = onSnapshot(brandsCol, (snapshot) => {
      if (snapshot.empty) {
        const hasSeeded = localStorage.getItem('mj_brands_initial_seeded');
        if (!hasSeeded) {
          localStorage.setItem('mj_brands_initial_seeded', 'true');
          console.log('[Firestore] Seeding initial default official brands to Firestore...');
          const batch = writeBatch(db);
          DEFAULT_OFFICIAL_BRANDS.forEach(brandObj => {
            const ref = doc(db, 'brands', brandObj.id);
            batch.set(ref, brandObj, { merge: true });
          });
          batch.commit().catch(err => console.warn('[Firestore] Error seeding initial brands:', err));
        } else {
          setBrandsList([]);
          try { localStorage.setItem('mj_brands_list', JSON.stringify([])); } catch (e) {}
        }
        return;
      }

      localStorage.setItem('mj_brands_initial_seeded', 'true');

      const liveDocs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      liveDocs.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setBrandsList(liveDocs);
      try { localStorage.setItem('mj_brands_list', JSON.stringify(liveDocs)); } catch (e) {}
    }, (err) => {
      console.warn('[Firestore] brands listener notice:', err);
    });
    return () => unsubscribe();
  }, []);

  const restoreDefaultBrands = useCallback(async () => {
    try {
      const batch = writeBatch(db);
      DEFAULT_OFFICIAL_BRANDS.forEach(brandObj => {
        const ref = doc(db, 'brands', brandObj.id);
        batch.set(ref, brandObj, { merge: true });
      });
      await batch.commit();
      showToast('Restored & synced all 18 official brands to Firestore!');
    } catch (err) {
      console.error('[Firestore] restoreDefaultBrands error:', err);
      showToast('Failed to restore default brands');
    }
  }, [showToast]);

  const DEFAULT_BRAND_TAB_TITLES = useMemo(() => ({
    speed_scale: 'Speed & Scale Brands',
    crawler: 'Crawler Brands'
  }), []);

  const [brandTabTitles, setBrandTabTitles] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_brand_tab_titles');
      return saved ? JSON.parse(saved) : { speed_scale: 'Speed & Scale Brands', crawler: 'Crawler Brands' };
    } catch {
      return { speed_scale: 'Speed & Scale Brands', crawler: 'Crawler Brands' };
    }
  });

  // Sync brandTabTitles with Firestore 'settings/brandTabTitles'
  useEffect(() => {
    const docRef = doc(db, 'settings', 'brandTabTitles');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updated = {
          speed_scale: data.speed_scale || 'Speed & Scale Brands',
          crawler: data.crawler || 'Crawler Brands'
        };
        setBrandTabTitles(updated);
        try { localStorage.setItem('mj_brand_tab_titles', JSON.stringify(updated)); } catch (e) {}
      }
    }, (err) => console.warn('[Firestore] brandTabTitles listener notice:', err));
    return () => unsubscribe();
  }, []);

  const updateBrandTabTitles = useCallback(async (newTitles) => {
    const updated = {
      speed_scale: newTitles.speed_scale || brandTabTitles.speed_scale || 'Speed & Scale Brands',
      crawler: newTitles.crawler || brandTabTitles.crawler || 'Crawler Brands'
    };
    setBrandTabTitles(updated);
    try { localStorage.setItem('mj_brand_tab_titles', JSON.stringify(updated)); } catch (e) {}
    await setDoc(doc(db, 'settings', 'brandTabTitles'), updated, { merge: true }).catch(err => {
      console.error('[Firestore] updateBrandTabTitles error:', err);
    });
    showToast('Brand sub-tab titles updated & synced!');
  }, [brandTabTitles, showToast]);

  const [marqueeTicker, setMarqueeTicker] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_marquee_ticker');
      return saved ? JSON.parse(saved) : DEFAULT_TICKER_CONFIG;
    } catch {
      return DEFAULT_TICKER_CONFIG;
    }
  });

  // Sync marqueeTicker with Firestore 'settings/marquee_ticker'
  useEffect(() => {
    const docRef = doc(db, 'settings', 'marquee_ticker');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updated = {
          items: Array.isArray(data.items) && data.items.length > 0 ? data.items : DEFAULT_TICKER_ITEMS,
          isActive: data.isActive !== false
        };
        setMarqueeTicker(updated);
        try { localStorage.setItem('mj_marquee_ticker', JSON.stringify(updated)); } catch (e) {}
      }
    }, (err) => console.warn('[Firestore] marquee_ticker listener notice:', err));
    return () => unsubscribe();
  }, []);

  const updateMarqueeTicker = useCallback(async (newConfig) => {
    const items = Array.isArray(newConfig.items)
      ? newConfig.items.map(s => String(s).trim()).filter(Boolean)
      : DEFAULT_TICKER_ITEMS;

    const updated = {
      items: items.length > 0 ? items : DEFAULT_TICKER_ITEMS,
      isActive: newConfig.isActive !== false,
      updatedAt: new Date().toISOString()
    };

    setMarqueeTicker(updated);
    try { localStorage.setItem('mj_marquee_ticker', JSON.stringify(updated)); } catch (e) {}

    await setDoc(doc(db, 'settings', 'marquee_ticker'), updated, { merge: true }).catch(err => {
      console.error('[Firestore] updateMarqueeTicker error:', err);
    });
    showToast('📢 Storefront Marquee Ticker saved & synced to Firestore!');
  }, [showToast]);

  const saveBrand = useCallback(async (brandData) => {
    if (!brandData || !brandData.name) return;
    const brandId = brandData.id || brandData.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
    const group = brandData.brandGroup || (brandData.isCrawlerBrand ? 'crawler' : 'speed_scale');
    const payload = {
      id: brandId,
      name: brandData.name.trim(),
      logoUrl: (brandData.logoUrl || '').trim(),
      isVisible: brandData.isVisible !== false,
      brandGroup: group,
      isCrawlerBrand: group === 'crawler',
      sortOrder: Number(brandData.sortOrder || 0),
      updatedAt: Date.now()
    };
    
    setBrandsList(prev => {
      const idx = prev.findIndex(b => b.id === brandId || b.name.toLowerCase() === payload.name.toLowerCase());
      let updated;
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = { ...updated[idx], ...payload };
      } else {
        updated = [...prev, payload];
      }
      updated.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      try { localStorage.setItem('mj_brands_list', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    await setDoc(doc(db, 'brands', brandId), payload, { merge: true }).catch(err => {
      console.error('[Firestore] saveBrand error:', err);
    });
    showToast(`Brand "${payload.name}" saved & synced!`);
  }, [showToast]);

  const deleteBrand = useCallback(async (brandIdOrName) => {
    if (!brandIdOrName) return;
    const targetStr = String(brandIdOrName).trim();
    const targetLower = targetStr.toLowerCase();
    const docIdSlug = targetStr.toLowerCase().replace(/[^a-z0-9]/g, '-');

    setBrandsList(prev => {
      const updated = (prev || []).filter(b => {
        if (!b) return false;
        const bId = String(typeof b === 'object' ? (b.id || b.name || '') : b).trim().toLowerCase();
        const bName = String(typeof b === 'object' ? (b.name || b.id || '') : b).trim().toLowerCase();
        const bSlug = bId.replace(/[^a-z0-9]/g, '-');
        return bId !== targetLower && bName !== targetLower && bSlug !== docIdSlug;
      });
      try { localStorage.setItem('mj_brands_list', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    setBrandVisibility(prev => {
      const copy = { ...prev };
      delete copy[targetStr];
      delete copy[targetStr.toUpperCase()];
      delete copy[targetStr.toLowerCase()];
      try { localStorage.setItem('mj_brand_visibility', JSON.stringify(copy)); } catch (e) {}
      return copy;
    });

    try {
      await deleteDoc(doc(db, 'brands', targetStr));
      if (docIdSlug !== targetStr) {
        await deleteDoc(doc(db, 'brands', docIdSlug)).catch(() => {});
      }
      if (targetLower !== targetStr && targetLower !== docIdSlug) {
        await deleteDoc(doc(db, 'brands', targetLower)).catch(() => {});
      }
      showToast(`Brand "${targetStr}" permanently deleted!`);
    } catch (err) {
      console.error('[Firestore] deleteBrand error:', err);
      showToast('Failed to delete brand from database');
    }
  }, [showToast]);

  const [categoriesList, setCategoriesList] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_categories_list');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  // Listen to Firestore 'categories' collection in real-time
  useEffect(() => {
    const catCol = collection(db, 'categories');
    const unsubscribe = onSnapshot(catCol, (snapshot) => {
      if (snapshot.empty) {
        const hasSeeded = localStorage.getItem('mj_categories_initial_seeded');
        if (!hasSeeded) {
          localStorage.setItem('mj_categories_initial_seeded', 'true');
          console.log('[Firestore] Seeding initial default categories to Firestore...');
          const batch = writeBatch(db);
          DEFAULT_CATEGORIES.forEach(catObj => {
            const ref = doc(db, 'categories', catObj.id);
            batch.set(ref, catObj, { merge: true });
          });
          batch.commit().catch(err => console.warn('[Firestore] Error seeding initial categories:', err));
        } else {
          setCategoriesList([]);
          try { localStorage.setItem('mj_categories_list', JSON.stringify([])); } catch (e) {}
        }
        return;
      }

      localStorage.setItem('mj_categories_initial_seeded', 'true');

      const liveDocs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      
      // Deduplicate liveDocs by normalized category name / slug
      const uniqueMap = new Map();
      liveDocs.forEach(cDoc => {
        const cName = cDoc.name || cDoc.label || cDoc.slug || cDoc.id || '';
        const normKey = cName.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
        if (normKey && !uniqueMap.has(normKey)) {
          uniqueMap.set(normKey, cDoc);
        }
      });

      const uniqueCats = Array.from(uniqueMap.values());
      uniqueCats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      setCategoriesList(uniqueCats);
      try { localStorage.setItem('mj_categories_list', JSON.stringify(uniqueCats)); } catch (e) {}
    }, (err) => {
      console.warn('[Firestore] categories listener notice:', err);
    });
    return () => unsubscribe();
  }, []);

  const restoreDefaultCategories = useCallback(async () => {
    try {
      const batch = writeBatch(db);
      DEFAULT_CATEGORIES.forEach(catObj => {
        const ref = doc(db, 'categories', catObj.id);
        batch.set(ref, catObj, { merge: true });
      });
      await batch.commit();
      showToast('Restored & synced all default categories to Firestore!');
    } catch (err) {
      console.error('[Firestore] restoreDefaultCategories error:', err);
      showToast('Failed to restore default categories');
    }
  }, [showToast]);

  const saveCategory = useCallback(async (catData) => {
    if (!catData || !catData.name) return;
    const catId = catData.id || catData.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
    const slug = catData.slug || catData.name.toLowerCase().trim().replace(/\s+/g, '-');
    const img = (catData.imageUrl || catData.image || '').trim() || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=300&q=80';
    const payload = {
      id: catId,
      name: catData.name.trim(),
      label: catData.name.trim(),
      slug: slug,
      imageUrl: img,
      image: img,
      icon: catData.icon || '🏎️',
      description: catData.description || '',
      isVisible: catData.isVisible !== false,
      sortOrder: Number(catData.sortOrder || 0),
      updatedAt: Date.now()
    };

    setCategoriesList(prev => {
      const idx = prev.findIndex(c => c.id === catId || c.slug === slug);
      let updated;
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = { ...updated[idx], ...payload };
      } else {
        updated = [...prev, payload];
      }
      updated.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      try { localStorage.setItem('mj_categories_list', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    await setDoc(doc(db, 'categories', catId), payload, { merge: true }).catch(err => {
      console.error('[Firestore] saveCategory error:', err);
    });
    showToast(`Category "${payload.name}" saved & synced!`);
  }, [showToast]);

  const deleteCategory = useCallback(async (catIdOrName) => {
    if (!catIdOrName) return;
    const targetStr = String(catIdOrName).trim();
    const targetSlug = targetStr.toLowerCase().replace(/[^a-z0-9]/g, '-');

    setCategoriesList(prev => {
      const updated = (prev || []).filter(c => {
        if (!c) return false;
        const cId = String(c.id || '').trim();
        const cSlug = String(c.slug || '').trim();
        const cName = String(c.name || c.label || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
        return cId !== targetStr && cSlug !== targetStr && cName !== targetSlug && cId.toLowerCase().replace(/[^a-z0-9]/g, '-') !== targetSlug;
      });
      try { localStorage.setItem('mj_categories_list', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'categories', targetStr));
      if (targetSlug !== targetStr) {
        await deleteDoc(doc(db, 'categories', targetSlug)).catch(() => {});
      }
      // Purge legacy doc ID aliases if applicable
      const LEGACY_ALIASES = {
        'rc-crawlers': 'cat-crawler',
        'trail-pickups': 'cat-trail-pickups',
        'drift-and-rally': 'cat-drift-rally',
        'bashers-and-monster': 'cat-bashers-monster',
        'heavy-machinery': 'cat-heavy-machinery',
        'short-course': 'cat-short-course'
      };
      if (LEGACY_ALIASES[targetSlug]) {
        await deleteDoc(doc(db, 'categories', LEGACY_ALIASES[targetSlug])).catch(() => {});
      }
      showToast('Category permanently deleted!');
    } catch (err) {
      console.error('[Firestore] deleteCategory error:', err);
      showToast('Failed to delete category from database');
    }
  }, [showToast]);

  const [latestRcCars, setLatestRcCars] = useState(() => {
    return getSafeStorage(
      'mj_latest_rc_cars_v1',
      DEFAULT_LATEST_RC_CARS,
      arr => Array.isArray(arr) && arr.length > 0
    );
  });

  const [customScaleCategories, setCustomScaleCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_custom_scale_categories');
      return saved ? JSON.parse(saved) : ['1:64', '1:43', '1:32', '1:24', '1:18', '1:14', '1:10', '1:8', '1:5'];
    } catch {
      return ['1:64', '1:43', '1:32', '1:24', '1:18', '1:14', '1:10', '1:8', '1:5'];
    }
  });

  useEffect(() => {
    localStorage.setItem('mj_brand_visibility', JSON.stringify(brandVisibility));
  }, [brandVisibility]);

  useEffect(() => {
    localStorage.setItem('mj_latest_rc_cars_v1', JSON.stringify(latestRcCars));
  }, [latestRcCars]);

  useEffect(() => {
    localStorage.setItem('mj_custom_scale_categories', JSON.stringify(customScaleCategories));
  }, [customScaleCategories]);

  const toggleBrandVisibility = useCallback(async (brandName) => {
    if (!brandName) return;
    const brandClean = brandName.toLowerCase().replace(/[\s\-_]/g, '');

    setBrandVisibility(prev => {
      const current = prev[brandName] !== false;
      const updated = { ...prev, [brandName]: !current };
      try { localStorage.setItem('mj_brand_visibility', JSON.stringify(updated)); } catch (e) {}
      setDoc(doc(db, 'settings', 'storefront'), { brandVisibility: updated }, { merge: true }).catch(err => {
        console.error('[Firestore] brandVisibility sync error:', err);
      });
      return updated;
    });

    setBrandsList(prev => {
      const target = prev.find(b => b.name.toLowerCase().replace(/[\s\-_]/g, '') === brandClean || (b.id && b.id.toLowerCase() === brandClean));
      if (target) {
        const newVis = !target.isVisible;
        setDoc(doc(db, 'brands', target.id), { isVisible: newVis }, { merge: true }).catch(e => {});
        return prev.map(b => b.id === target.id ? { ...b, isVisible: newVis } : b);
      }
      return prev;
    });
  }, []);

  const addCustomScaleCategory = useCallback((scaleTag) => {
    if (!scaleTag) return;
    setCustomScaleCategories(prev => {
      if (prev.includes(scaleTag)) return prev;
      const updated = [...prev, scaleTag];
      broadcastRealtimeSync('SYNC_SCALE_CATEGORIES', updated);
      return updated;
    });
  }, []);

  // Pure local storefront environment (zero network loops)
  useEffect(() => {
    // Clean local mode active
  }, []);

  // Multi-Device Real-Time Telemetry & Event Synchronization Engine
  useEffect(() => {
    let syncChannel1 = null;
    let syncChannel2 = null;

    const handleMessage = (event) => {
      try {
        const { type, payload } = event.data || {};
        if (!type || payload === undefined) return;

        if (type === 'TELEMETRY_SYNC' && payload) {
          const { orders: inboundOrders, cart: inboundCart, activePhone: inboundPhone } = payload;
          if (Array.isArray(inboundOrders)) {
            setOrders(inboundOrders);
          }
          const currentPhone = user?.phone || (typeof window !== 'undefined' ? localStorage.getItem('mjrc_active_phone') : null);
          if (inboundPhone && currentPhone && (inboundPhone === currentPhone || currentPhone.endsWith(inboundPhone.slice(-10)))) {
            if (Array.isArray(inboundCart)) {
              setCart(inboundCart);
            }
          }
        }

        if (type === 'STORE_UPDATE' && payload && typeof payload === 'object') {
          if (payload.latestRcCars) setLatestRcCars(payload.latestRcCars.slice(0, 10));
          if (payload.brandVisibility) setBrandVisibility(payload.brandVisibility);
          if (payload.orders) setOrders(payload.orders);
          if (payload.customers) setCustomers(payload.customers);
        }
        if (type === 'SYNC_HERO') setHeroBanner(payload || {});
        if (type === 'SYNC_ORDERS') setOrders(Array.isArray(payload) ? payload : []);
        if (type === 'SYNC_CUSTOMERS') setCustomers(Array.isArray(payload) ? payload : []);
        if (type === 'SYNC_REVIEWS') setReviewsList(Array.isArray(payload) ? payload : []);
        if (type === 'SYNC_REFERRALS') setReferralsList(Array.isArray(payload) ? payload : []);
        if (type === 'SYNC_FESTIVE') setFestiveCampaign(payload || {});
        if (type === 'SYNC_BRAND_VISIBILITY') setBrandVisibility(payload || {});
        if (type === 'SYNC_LATEST_RC') setLatestRcCars(Array.isArray(payload) ? payload.slice(0, 10) : []);
        if (type === 'SYNC_SCALE_CATEGORIES') setCustomScaleCategories(Array.isArray(payload) ? payload : []);
        if (type === 'SYNC_SCALE_MODELS_TOGGLE') setIsScaleModelsEnabled(!!payload);
      } catch (err) {
        console.warn('BroadcastChannel telemetry sync error:', err);
      }
    };

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      syncChannel1 = new BroadcastChannel('mjrc_global_telemetry');
      syncChannel1.onmessage = handleMessage;

      syncChannel2 = new BroadcastChannel('mj_rc_store_realtime_sync');
      syncChannel2.onmessage = handleMessage;
    }

    const handleStorageChange = (e) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'mj_hero_banner_v3') setHeroBanner(JSON.parse(e.newValue));
        if (e.key === 'mj_orders_v3') {
          const parsedOrders = JSON.parse(e.newValue);
          if (Array.isArray(parsedOrders)) setOrders(parsedOrders);
        }
        if (e.key === 'mj_cart') {
          const currentPhone = user?.phone || localStorage.getItem('mjrc_active_phone');
          if (currentPhone) {
            const parsedCart = JSON.parse(e.newValue);
            if (Array.isArray(parsedCart)) setCart(parsedCart);
          }
        }
        if (e.key === 'mjrc_user' || e.key === 'mj_user_v2') {
          const parsedUser = JSON.parse(e.newValue);
          if (parsedUser) setUser(parsedUser);
        }
        if (e.key === 'mj_reviews_list') setReviewsList(JSON.parse(e.newValue));
        if (e.key === 'mj_referrals_list') setReferralsList(JSON.parse(e.newValue));
        if (e.key === 'mj_festive_campaign') setFestiveCampaign(JSON.parse(e.newValue));
        if (e.key === 'mj_brand_visibility') setBrandVisibility(JSON.parse(e.newValue));
        if (e.key === 'mj_latest_rc_cars_v1') setLatestRcCars(JSON.parse(e.newValue));
        if (e.key === 'mj_scale_models_enabled') setIsScaleModelsEnabled(JSON.parse(e.newValue));
      } catch (err) {
        console.warn('Storage telemetry sync error:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (syncChannel1) syncChannel1.close();
      if (syncChannel2) syncChannel2.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user?.phone]);

  const updateStoreState = useCallback((collection, id, payload) => {
    if (collection === 'products' || collection === 'mj_products_v3') {
      setProducts(prev => {
        const updated = (prev || []).map(p => (p.id === id ? { ...p, ...payload } : p));
        broadcastRealtimeSync('SYNC_PRODUCTS', updated);
        return updated;
      });
    } else if (collection === 'hero_banner' || collection === 'mj_hero_banner_v3') {
      setHeroBanner(prev => {
        const updated = { ...prev, ...payload };
        broadcastRealtimeSync('SYNC_HERO', updated);
        return updated;
      });
    } else if (collection === 'orders' || collection === 'mj_orders_v3') {
      setOrders(prev => {
        const updated = (prev || []).map(o => (o.id === id ? { ...o, ...payload } : o));
        broadcastRealtimeSync('SYNC_ORDERS', updated);
        return updated;
      });
    }
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('mj_whatsapp_config', JSON.stringify(whatsappConfig));
  }, [whatsappConfig]);

  useEffect(() => {
    localStorage.setItem('mj_reviews_list', JSON.stringify(reviewsList));
  }, [reviewsList]);

  useEffect(() => {
    if (!products) return;
    try {
      localStorage.setItem('mj_products_v4', JSON.stringify(products));
      localStorage.setItem('mjrc_products', JSON.stringify(products));
    } catch (e) {
      console.warn('LocalStorage products save error:', e);
    }

    broadcastRealtimeSync('PRODUCTS_UPDATED', products);
    broadcastRealtimeSync('SYNC_PRODUCTS', products);

    // Remote multi-device cloud WebSocket push
    try {
      const wsPush = new WebSocket('wss://socketsbay.com/wss/v2/1/mjrc_live_storefront_sync/');
      wsPush.onopen = () => {
        wsPush.send(JSON.stringify({ type: 'CATALOG_MUTATION', payload: products }));
        setTimeout(() => wsPush.close(), 500);
      };
    } catch (err) {
      console.warn('WS broadcast error:', err);
    }
  }, [products]);

  // Real-time Cart Item Price Synchronization with Master Products
  useEffect(() => {
    if (!products || !Array.isArray(products) || products.length === 0) return;
    setCart(prevCart => {
      if (!prevCart || prevCart.length === 0) return prevCart;
      let hasChange = false;
      const updatedCart = prevCart.map(item => {
        const matchedProduct = products.find(p => p.id === item.id);
        if (matchedProduct && matchedProduct.price !== undefined) {
          const addonAmount = (item.price || 0) - (item.basePrice || matchedProduct.price);
          const newBasePrice = Number(matchedProduct.price);
          const newPrice = newBasePrice + (addonAmount > 0 ? addonAmount : 0);
          if (item.basePrice !== newBasePrice || item.price !== newPrice || item.title !== matchedProduct.title || item.image !== matchedProduct.image) {
            hasChange = true;
            return {
              ...item,
              title: matchedProduct.title,
              image: matchedProduct.image,
              basePrice: newBasePrice,
              price: newPrice
            };
          }
        }
        return item;
      });
      return hasChange ? updatedCart : prevCart;
    });
  }, [products]);

  useEffect(() => {
    localStorage.setItem('mj_hero_banner_v3', JSON.stringify(heroBanner));
  }, [heroBanner]);

  useEffect(() => {
    localStorage.setItem('mj_addons_config', JSON.stringify(addonsConfig));
  }, [addonsConfig]);

  useEffect(() => {
    localStorage.setItem('mj_orders_v3', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('mj_customers_v2', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('mj_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('mj_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('mj_user_v2', JSON.stringify(user));
      localStorage.setItem('mjrc_user', JSON.stringify(user));
      if (user.phone) localStorage.setItem('mjrc_active_phone', user.phone);
      if (user.token) localStorage.setItem('mjrc_token', user.token);
      localStorage.setItem('mjrc_auth', 'true');
    } else {
      localStorage.removeItem('mj_user_v2');
      localStorage.removeItem('mjrc_user');
      localStorage.removeItem('mjrc_active_phone');
      localStorage.removeItem('mjrc_token');
      localStorage.removeItem('mjrc_auth');
    }
  }, [user]);

  // Firebase Auth State Listener with Null Guards & Fallbacks
  useEffect(() => {
    if (!auth) return;
    let unsubscribe;
    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const cleanPhone = (firebaseUser.phoneNumber || '').replace(/\D/g, '').slice(-10);
          if (cleanPhone && db) {
            try {
              const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
              if (userSnap.exists()) {
                setUser(prev => ({
                  ...userSnap.data(),
                  uid: firebaseUser.uid,
                  phone: cleanPhone,
                  rcCoins: userSnap.data().rcCoins || 500
                }));
              } else {
                const phoneSnap = await getDoc(doc(db, 'users', cleanPhone));
                if (phoneSnap.exists()) {
                  setUser(prev => ({
                    ...phoneSnap.data(),
                    uid: firebaseUser.uid,
                    phone: cleanPhone,
                    rcCoins: phoneSnap.data().rcCoins || 500
                  }));
                }
              }
            } catch (docErr) {
              console.warn("[Auth State Doc Fetch Warning]:", docErr);
            }
          }
        }
      }, (error) => {
        console.warn("Auth state error handled safely:", error);
      });
    } catch (err) {
      console.warn("onAuthStateChanged setup notice:", err);
    }
  }, []);

  // Fetch / Hydrate User Profile & Restore Cloud Data (Orders, Addresses, Coins) from Firestore keyed by +91${phone}
  const fetchUserProfileAndRestoreData = useCallback(async (phoneInput, defaultFirstName = 'RC', defaultLastName = 'Racer') => {
    if (!phoneInput) return null;
    const cleanDigits = String(phoneInput).replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) return null;

    const canonicalPhone = `+91${cleanDigits}`;
    let userSnap = null;
    let userDocRef = doc(db, 'users', canonicalPhone);
    let legacyRef = doc(db, 'users', cleanDigits);

    if (db) {
      try {
        userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
          userSnap = await getDoc(legacyRef);
        }
      } catch (err) {
        console.warn('[Firestore User Fetch Error]:', err);
      }
    }

    let finalUserData = null;
    let savedAddresses = [];

    if (db) {
      try {
        // Fetch addresses subcollection from users/+91${cleanDigits}/addresses
        const addrSubcolRef = collection(db, 'users', canonicalPhone, 'addresses');
        const addrSnap = await getDocs(addrSubcolRef);
        savedAddresses = addrSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (savedAddresses.length === 0) {
          const legacyAddrSnap = await getDocs(collection(db, 'users', cleanDigits, 'addresses'));
          savedAddresses = legacyAddrSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (aErr) {
        console.warn('[Firestore Addresses Subcol Fetch Notice]:', aErr);
      }
    }

    if (userSnap && userSnap.exists()) {
      // EXISTING USER: Retain existing profile & coins intact (DO NOT OVERWRITE)
      const existingData = userSnap.data();
      const updatedFirstName = (defaultFirstName && defaultFirstName !== 'RC' ? defaultFirstName : null) || existingData.firstName || existingData.name?.split(' ')[0] || 'RC';
      const updatedLastName = (defaultLastName && defaultLastName !== 'Racer' ? defaultLastName : null) || existingData.lastName || existingData.name?.split(' ').slice(1).join(' ') || 'Racer';
      const fullName = `${updatedFirstName} ${updatedLastName}`.trim();

      const mergedAddresses = savedAddresses.length > 0 
        ? savedAddresses 
        : (existingData.addresses || existingData.savedAddresses || (existingData.address ? [{ id: 'default', address: existingData.address, isDefault: true }] : []));

      finalUserData = {
        ...existingData,
        uid: canonicalPhone,
        phone: canonicalPhone,
        cleanPhone: cleanDigits,
        firstName: updatedFirstName,
        lastName: updatedLastName,
        name: existingData.name || fullName,
        rcCoins: existingData.rcCoins !== undefined ? existingData.rcCoins : 500,
        permanentCoins: existingData.permanentCoins !== undefined ? existingData.permanentCoins : (existingData.rcCoins || 500),
        expiryCoinsBalance: existingData.expiryCoinsBalance || 0,
        hasReceivedWelcomeBonus: existingData.hasReceivedWelcomeBonus !== undefined ? existingData.hasReceivedWelcomeBonus : true,
        isNewUser: false,
        addresses: mergedAddresses,
        savedAddresses: mergedAddresses,
        address: existingData.address || (mergedAddresses[0]?.address || '')
      };

      if (db) {
        setDoc(userDocRef, finalUserData, { merge: true }).catch(e => {});
      }
    } else {
      // NEW USER: Create fresh profile doc with genuine welcome coins
      let bonusCoins = welcomeBonusCoins || 500;
      if (db) {
        try {
          const welcomeSnap = await getDoc(doc(db, 'crm_settings', 'welcome_config'));
          if (welcomeSnap.exists()) {
            const wData = welcomeSnap.data();
            const val = wData.coinsToCredit ?? wData.welcomeBonusCoins ?? wData.coins;
            if (val !== undefined && !isNaN(Number(val))) {
              bonusCoins = Number(val);
            }
          } else {
            const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
            if (settingsSnap.exists() && typeof settingsSnap.data().welcomeBonusCoins === 'number') {
              bonusCoins = settingsSnap.data().welcomeBonusCoins;
            }
          }
        } catch (sErr) {
          console.warn('[Firestore Welcome Coins Fetch Notice]:', sErr);
        }
      }

      const fName = defaultFirstName || 'RC';
      const lName = defaultLastName || 'Racer';
      const fullName = `${fName} ${lName}`.trim();

      const welcomeHistoryEntry = {
        amount: bonusCoins,
        type: 'CREDIT',
        reason: `Welcome Signup Bonus (₹${Math.floor(bonusCoins * 0.2)} Store Credit)`,
        date: new Date().toISOString()
      };

      finalUserData = {
        uid: canonicalPhone,
        phone: canonicalPhone,
        cleanPhone: cleanDigits,
        firstName: fName,
        lastName: lName,
        name: fullName,
        permanentCoins: bonusCoins,
        expiryCoinsBalance: 0,
        rcCoins: bonusCoins,
        hasReceivedWelcomeBonus: true,
        isNewUser: true,
        role: 'customer',
        createdAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        coinHistory: [welcomeHistoryEntry],
        addresses: [],
        savedAddresses: []
      };

      if (db) {
        try {
          await setDoc(userDocRef, finalUserData, { merge: true });
        } catch (e) {
          console.warn('[Firestore User Write Error]:', e);
        }
      }
    }

    // Restore historical orders matching canonical phone or clean digits
    if (db) {
      try {
        const q1 = query(collection(db, 'orders'), where('customerPhone', '==', canonicalPhone));
        const q2 = query(collection(db, 'orders'), where('mobile', '==', cleanDigits));
        const [snap1, snap2] = await Promise.all([
          getDocs(q1).catch(() => ({ docs: [] })),
          getDocs(q2).catch(() => ({ docs: [] }))
        ]);
        const orderDocs = [...snap1.docs, ...snap2.docs];
        const orderMap = new Map();
        orderDocs.forEach(d => orderMap.set(d.id, { id: d.id, ...d.data() }));
        const userRestoredOrders = Array.from(orderMap.values());

        if (userRestoredOrders.length > 0) {
          setOrders(prev => {
            const map = new Map();
            (prev || []).forEach(o => map.set(o.id, o));
            userRestoredOrders.forEach(o => map.set(o.id, o));
            return Array.from(map.values());
          });
        }
      } catch (oErr) {
        console.warn('[Firestore Restored Orders Notice]:', oErr);
      }
    }

    setUser(finalUserData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mjrc_user', JSON.stringify(finalUserData));
      localStorage.setItem('mj_user_v2', JSON.stringify(finalUserData));
      localStorage.setItem('mj_auth_user', JSON.stringify(finalUserData));
      localStorage.setItem('mjrc_active_phone', canonicalPhone);
      localStorage.setItem('mjrc_auth', 'true');
    }

    return finalUserData;
  }, [welcomeBonusCoins]);

  // Save / Add / Update Delivery Address in Firestore Subcollection users/+91${phone}/addresses
  const saveUserAddress = useCallback(async (addressObj) => {
    if (!user || (!user.phone && !user.cleanPhone)) return;
    const cleanDigits = String(user.cleanPhone || user.phone).replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) return;
    const canonicalPhone = `+91${cleanDigits}`;
    const addressId = addressObj.id || `addr-${Date.now()}`;
    const newAddrDoc = {
      id: addressId,
      fullName: addressObj.fullName || user.name || 'RC Racer',
      phone: addressObj.phone || canonicalPhone,
      address: addressObj.address || addressObj.street || '',
      city: addressObj.city || 'Mysore',
      state: addressObj.state || 'Karnataka',
      pincode: addressObj.pincode || '570017',
      addressType: addressObj.addressType || 'Home',
      updatedAt: new Date().toISOString()
    };

    setUser(prev => {
      if (!prev) return prev;
      const existingAddrs = prev.addresses || prev.savedAddresses || [];
      const updatedAddrs = [
        newAddrDoc,
        ...existingAddrs.filter(a => a.id !== addressId)
      ];
      const updatedUser = {
        ...prev,
        address: newAddrDoc.address,
        addresses: updatedAddrs,
        savedAddresses: updatedAddrs
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('mjrc_user', JSON.stringify(updatedUser));
        localStorage.setItem('mj_user_v2', JSON.stringify(updatedUser));
        localStorage.setItem('mj_auth_user', JSON.stringify(updatedUser));
      }

      if (db) {
        const addrRef = doc(db, 'users', canonicalPhone, 'addresses', addressId);
        setDoc(addrRef, newAddrDoc, { merge: true }).catch(e => console.error(e));

        const userRef = doc(db, 'users', canonicalPhone);
        setDoc(userRef, {
          address: newAddrDoc.address,
          addresses: updatedAddrs,
          savedAddresses: updatedAddrs
        }, { merge: true }).catch(e => console.error(e));
      }

      return updatedUser;
    });

    showToast('Saved delivery address updated in cloud!');
    return newAddrDoc;
  }, [user, showToast]);

  // Auto-Cleanup / Expiry Check on Storefront Load & Mount
  useEffect(() => {
    if (!user || !user.coinExpiryTimestamp || !user.expiryCoinsBalance || user.expiryCoinsBalance <= 0) return;
    const expiryTime = new Date(user.coinExpiryTimestamp).getTime();
    if (!isNaN(expiryTime) && Date.now() > expiryTime) {
      setUser(prev => {
        if (!prev || !prev.expiryCoinsBalance || prev.expiryCoinsBalance <= 0) return prev;
        const expiredBal = prev.expiryCoinsBalance;
        const permCoins = formatCoins(prev.permanentCoins ?? prev.rcCoins ?? 500);
        const updatedHistory = [
          ...(prev.coinHistory || []),
          {
            type: 'expired',
            coins: expiredBal,
            reason: 'Promotional Coins Expired',
            timestamp: new Date().toISOString()
          }
        ];
        const updatedUser = {
          ...prev,
          expiryCoinsBalance: 0,
          rcCoins: permCoins,
          permanentCoins: permCoins,
          coinHistory: updatedHistory
        };

        const phoneOrUid = prev.phone || prev.uid || prev.id;
        if (phoneOrUid && db) {
          const userDocRef = doc(db, 'users', String(phoneOrUid));
          setDoc(userDocRef, {
            expiryCoinsBalance: 0,
            rcCoins: permCoins,
            permanentCoins: permCoins,
            coinHistory: updatedHistory,
            lastCoinExpiryCleanupAt: new Date().toISOString()
          }, { merge: true }).catch(err => console.error('[Firestore] Expiry cleanup error:', err));
        }
        return updatedUser;
      });
    }
  }, [user]);

  // Register Customer helper
  const registerCustomer = useCallback((phone, name = 'RC Racer') => {
    setCustomers(prev => {
      const existing = (prev || []).find(c => c.phone === phone);
      if (existing) {
        return prev.map(c => c.phone === phone ? { ...c, name: name || c.name } : c);
      } else {
        return [
          {
            id: `cust-${Date.now()}`,
            name: name,
            phone: phone,
            joinedAt: new Date().toISOString(),
            totalOrders: 0
          },
          ...(prev || [])
        ];
      }
    });
  }, []);

  // Redeem / Add Coins Helper (Dual-Coin Aware: Deducts Time-Bound Expiry Coins FIRST, then Lifetime Permanent Coins)
  const redeemUserCoins = useCallback((coinsToDeduct) => {
    setUser(prev => {
      if (!prev) return prev;
      const perm = formatCoins(prev.permanentCoins ?? prev.rcCoins ?? 500);
      const expiryBal = formatCoins(prev.expiryCoinsBalance ?? 0);
      const expiryTime = prev.coinExpiryTimestamp ? new Date(prev.coinExpiryTimestamp).getTime() : 0;
      const isExpired = !expiryTime || isNaN(expiryTime) || Date.now() > expiryTime;
      const activeExpiryBal = isExpired ? 0 : expiryBal;

      const deductFromExpiry = Math.min(coinsToDeduct, activeExpiryBal);
      const deductFromPerm = Math.max(0, coinsToDeduct - deductFromExpiry);

      const newExpiryCoins = Math.max(0, activeExpiryBal - deductFromExpiry);
      const newPermCoins = Math.max(0, perm - deductFromPerm);
      const newTotal = newPermCoins + newExpiryCoins;

      const updatedUser = {
        ...prev,
        rcCoins: newTotal,
        permanentCoins: newPermCoins,
        expiryCoinsBalance: newExpiryCoins
      };

      const phoneOrUid = prev.phone || prev.uid || prev.id;
      if (phoneOrUid && db) {
        try {
          const userDocRef = doc(db, 'users', String(phoneOrUid));
          setDoc(userDocRef, {
            rcCoins: newTotal,
            permanentCoins: newPermCoins,
            expiryCoinsBalance: newExpiryCoins,
            lastCoinRedemptionAt: new Date().toISOString()
          }, { merge: true }).catch(err => console.error('[Firestore] User coin redemption sync error:', err));
        } catch (e) {}
      }

      return updatedUser;
    });
  }, []);

  const addUserCoins = useCallback((coinsToAdd) => {
    setUser(prev => {
      if (!prev) return prev;
      const perm = formatCoins(prev.permanentCoins ?? prev.rcCoins ?? 500);
      const expiryBal = formatCoins(prev.expiryCoinsBalance ?? 0);
      const expiryTime = prev.coinExpiryTimestamp ? new Date(prev.coinExpiryTimestamp).getTime() : 0;
      const isExpired = !expiryTime || isNaN(expiryTime) || Date.now() > expiryTime;
      const activeExpiryBal = isExpired ? 0 : expiryBal;

      const newPermCoins = perm + coinsToAdd;
      const newTotal = newPermCoins + activeExpiryBal;

      const updatedUser = {
        ...prev,
        rcCoins: newTotal,
        permanentCoins: newPermCoins
      };

      const phoneOrUid = prev.phone || prev.uid || prev.id;
      if (phoneOrUid && db) {
        try {
          const userDocRef = doc(db, 'users', String(phoneOrUid));
          setDoc(userDocRef, {
            rcCoins: newTotal,
            permanentCoins: newPermCoins
          }, { merge: true }).catch(err => console.error('[Firestore] Add user coins sync error:', err));
        } catch (e) {}
      }

      return updatedUser;
    });
  }, []);

  // Cart operations
  const addToCart = useCallback((product, selectedAddons = [], selectedColor = null) => {
    const activeColor = selectedColor || product?.selectedColor || null;

    let extraPrice = 0;
    const addonNames = [];

    if (Array.isArray(selectedAddons) && selectedAddons.length > 0) {
      selectedAddons.forEach(key => {
        if (addonsConfig[key]) {
          extraPrice += addonsConfig[key].price;
          addonNames.push(addonsConfig[key].name);
        }
      });
    }

    const itemPrice = product.price + extraPrice;
    const addonsKey = Array.isArray(selectedAddons) ? selectedAddons.sort().join('-') : '';
    const colorKey = activeColor ? String(activeColor).replace(/\s+/g, '_') : 'default';
    const cartItemId = `${product.id}-${colorKey}-${addonsKey || 'base'}`;

    setCart(prevCart => {
      const existing = (prevCart || []).find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prevCart.map(item =>
          item.cartItemId === cartItemId
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      } else {
        return [
          ...(prevCart || []),
          {
            cartItemId,
            id: product.id,
            title: product.title,
            image: product.image,
            price: itemPrice,
            basePrice: product.price,
            selectedAddons: addonNames,
            selectedColor: activeColor || null,
            qty: 1
          }
        ];
      }
    });

    showToast(`Added ${product.title.substring(0, 22)}... to Cart!`);
  }, [addonsConfig, showToast]);

  const updateCartQty = useCallback((cartItemId, delta) => {
    setCart(prevCart => {
      return (prevCart || [])
        .map(item => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  }, []);

  const removeFromCart = useCallback((cartItemId) => {
    setCart(prevCart => (prevCart || []).filter(item => item.cartItemId !== cartItemId));
    showToast('Item removed from cart.');
  }, [showToast]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartSubtotal = useMemo(() => (cart || []).reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const cartCount = useMemo(() => (cart || []).reduce((sum, item) => sum + item.qty, 0), [cart]);

  // Wishlist operation with Firestore sync & LocalStorage fallback
  const userId = user?.uid || user?.id || user?.phone || null;

  useEffect(() => {
    let isMounted = true;
    const syncWishlist = async () => {
      if (!userId) return;
      try {
        const wishlistRef = collection(db, 'users', String(userId), 'wishlist');
        const snapshot = await getDocs(wishlistRef);
        const remoteIds = snapshot.docs.map(d => String(d.id));

        if (!isMounted) return;

        setWishlist(prev => {
          const prevList = prev || [];
          const prevIds = prevList.map(item => (typeof item === 'object' && item !== null ? String(item.id) : String(item)));
          const mergedIds = Array.from(new Set([...prevIds, ...remoteIds]));

          // Upload any local items missing remotely
          const missingLocals = prevIds.filter(id => !remoteIds.includes(id));
          for (const prodId of missingLocals) {
            setDoc(doc(db, 'users', String(userId), 'wishlist', String(prodId)), {
              productId: String(prodId),
              addedAt: new Date().toISOString()
            }, { merge: true }).catch(e => console.error(e));
          }

          return mergedIds;
        });
      } catch (err) {
        console.error('Error syncing wishlist with Firestore:', err);
      }
    };
    syncWishlist();
    return () => { isMounted = false; };
  }, [userId]);

  const toggleWishlist = useCallback((productOrId) => {
    const targetId = String(typeof productOrId === 'object' && productOrId !== null ? productOrId.id : productOrId);
    if (!targetId) return;

    setWishlist(prev => {
      const list = prev || [];
      const exists = list.some(item => (typeof item === 'object' && item !== null ? String(item.id) : String(item)) === targetId);

      let updated;
      if (exists) {
        showToast('Removed from Wishlist');
        updated = list.filter(item => (typeof item === 'object' && item !== null ? String(item.id) : String(item)) !== targetId);
      } else {
        showToast('Added to Wishlist!');
        updated = [...list, targetId];
      }

      if (userId) {
        const itemRef = doc(db, 'users', String(userId), 'wishlist', targetId);
        if (exists) {
          deleteDoc(itemRef).catch(e => console.error('Error deleting from Firestore wishlist:', e));
        } else {
          setDoc(itemRef, {
            productId: targetId,
            addedAt: new Date().toISOString()
          }, { merge: true }).catch(e => console.error('Error adding to Firestore wishlist:', e));
        }
      }

      return updated;
    });
  }, [userId, showToast]);

  // Upgraded Place order with Coins calculation, Shiprocket fields & Firestore write
  // Upgraded Place order with Coins calculation, Shiprocket fields & Firestore write (Synchronous Return)
  const placeOrder = useCallback((orderDetails) => {
    const newOrderId = `MJ-${Math.floor(80000 + Math.random() * 19000)}`;
    const finalTotal = orderDetails.totalAmount !== undefined ? orderDetails.totalAmount : cartSubtotal;
    const generatedAwb = `AWB-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const paymentMode = orderDetails.paymentMethod || orderDetails.paymentMode || 'Prepaid';
    const isPartialCod = paymentMode.toLowerCase().includes('cod') || paymentMode.toLowerCase().includes('partial');

    // Strict priority target recipient phone extraction
    const verifiedCustomerPhone = user?.phone || user?.phoneNumber || orderDetails.shippingDetails?.phone || orderDetails.customerPhone || orderDetails.phone || orderDetails.mobile || '';
    const pure10 = getPure10Phone(verifiedCustomerPhone);
    if (pure10.length !== 10) {
      console.error("[Checkout] Invalid recipient phone length:", pure10);
      return null;
    }

    const customerFullName = orderDetails.shippingDetails?.fullName || orderDetails.customerName || orderDetails.name || user?.name || 'RC Racer';
    const fullAddress = orderDetails.shippingDetails?.address || orderDetails.address || user?.address || 'Central Address';

    const newOrder = {
      id: newOrderId,
      customerName: customerFullName,
      customerPhone: `+91 ${pure10}`,
      mobile: pure10,
      phone: pure10,
      address: fullAddress,
      city: orderDetails.city || 'Mysore',
      state: orderDetails.state || 'Karnataka',
      pincode: orderDetails.pincode || '570001',
      paymentMethod: paymentMode,
      paymentMode: isPartialCod ? 'Partial COD' : 'Prepaid',
      advancePaid: isPartialCod ? 200 : finalTotal,
      codBalance: isPartialCod ? Math.max(0, finalTotal - 200) : 0,
      items: [...(cart || [])],
      total: finalTotal,
      coinsRedeemed: orderDetails.coinsRedeemed || 0,
      coinDiscount: orderDetails.coinsRedeemed ? Math.round(orderDetails.coinsRedeemed * 0.2) : 0,
      status: 'Processing',
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      awb: generatedAwb,
      shiprocketAwb: generatedAwb,
      courierPartner: 'BlueDart Express',
      currentHub: 'Mysore Central Dispatch Facility',
      deliveryStatus: 'Processing',
      shiprocketTrackingUrl: `https://shiprocket.co/tracking/${generatedAwb}`,
      shippingDetails: {
        fullName: customerFullName,
        phone: pure10,
        address: fullAddress
      }
    };

    // Background silent WhatsApp order confirmation dispatch via central lifecycle engine (Idempotent)
    if (!newOrder._sent) {
      newOrder._sent = true;
      triggerCheckoutOrderConfirmation(newOrder).catch(err => {
        console.warn('[WhatsApp Order Confirmation Error]:', err);
      });
    }

    // Loyalty Coins processing
    if (orderDetails.coinsRedeemed) {
      redeemUserCoins(orderDetails.coinsRedeemed);
    }
    
    // Award earned coins based on purchase
    const earnedCoins = Math.round(finalTotal * 0.01);
    addUserCoins(earnedCoins);

    // Order-Gated Referral Check
    const orderMobile = newOrder.mobile;
    setReferralNetwork(prev => {
      let updated = false;
      const list = (prev || []).map(ref => {
        if ((ref.joinedFriendMobile === orderMobile || (ref.joinedFriendMobile && orderMobile.endsWith(ref.joinedFriendMobile.slice(-10)))) && !ref.converted) {
          updated = true;
          addUserCoins(500);
          showToast(`🎉 Order Verified! Referrer ${ref.referrerName} awarded +500 RC Coins!`);
          return {
            ...ref,
            converted: true,
            orderId: newOrderId,
            referrerRewardCoins: 500,
            friendRewardCoins: 250,
            status: `🟢 Order Placed: Order #${newOrderId} (500 RC Coins Credited to Referrer)`
          };
        }
        return ref;
      });
      return updated ? list : prev;
    });

    // Register customer
    registerCustomer(newOrder.mobile, newOrder.customerName);

    // Optimistic local state update
    setOrders(prev => {
      const updatedOrders = [newOrder, ...(prev || [])];
      if (typeof window !== 'undefined') {
        localStorage.setItem('mj_orders_v3', JSON.stringify(updatedOrders));
        localStorage.setItem('mj_cart', JSON.stringify([]));
      }
      return updatedOrders;
    });

    // Save directly to Firestore orders collection (non-blocking)
    const orderDocRef = doc(db, 'orders', newOrderId);
    setDoc(orderDocRef, newOrder, { merge: true }).catch(err => {
      console.error('[Firestore] placeOrder write error:', err);
    });

    // Automatic Inventory Stock Deduction & Out-of-Stock auto handling
    (newOrder.items || []).forEach(async (item) => {
      const prodId = item.id || item.productId;
      const purchasedQty = Number(item.qty || item.quantity || 1);
      if (prodId && db) {
        try {
          const prodRef = doc(db, 'products', String(prodId));
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            const currentData = prodSnap.data();
            const currentStock = Number(currentData.stockCount ?? currentData.stock ?? currentData.remainingUnits ?? 10);
            const newStock = Math.max(0, currentStock - purchasedQty);
            const patch = {
              stockCount: newStock,
              stock: newStock,
              remainingUnits: newStock,
              inStock: newStock > 0
            };
            await updateDoc(prodRef, patch).catch(() => setDoc(prodRef, patch, { merge: true }));
          }
        } catch (e) {
          console.error('[Firestore] Stock deduction error for product:', prodId, e);
        }
      }
    });

    // Update local products state for real-time storefront response
    setProducts(prev => (prev || []).map(p => {
      const matched = (newOrder.items || []).find(item => String(item.id || item.productId) === String(p.id));
      if (matched) {
        const purchasedQty = Number(matched.qty || matched.quantity || 1);
        const currentStock = Number(p.stockCount ?? p.stock ?? p.remainingUnits ?? 10);
        const newStock = Math.max(0, currentStock - purchasedQty);
        return {
          ...p,
          stockCount: newStock,
          stock: newStock,
          remainingUnits: newStock,
          inStock: newStock > 0
        };
      }
      return p;
    }));

    clearCart();

    showToast(`Order #${newOrderId} Placed! Earned +${earnedCoins} RC Coins!`);
    return newOrderId;
  }, [cartSubtotal, cart, user, whatsappConfig, showToast, redeemUserCoins, addUserCoins, registerCustomer, clearCart]);

  // Shiprocket Order Logistics Updater
  const updateOrderShiprocket = useCallback(async (orderId, shiprocketData) => {
    if (!orderId) return;
    const awbVal = shiprocketData.awb || shiprocketData.shiprocketAwb || `AWB-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const trackingUrl = shiprocketData.shiprocketTrackingUrl || `https://shiprocket.co/tracking/${awbVal}`;
    const newStatus = shiprocketData.deliveryStatus || shiprocketData.status || 'In Transit';
    const patch = {
      shiprocketAwb: awbVal,
      awb: awbVal,
      courierPartner: shiprocketData.courierPartner || 'BlueDart Express',
      currentHub: shiprocketData.currentHub || 'Mysore Central Hub',
      deliveryStatus: newStatus,
      status: newStatus,
      lastNotifiedStatus: newStatus,
      shiprocketTrackingUrl: trackingUrl
    };

    setOrders(prev => (prev || []).map(o => (o.id === orderId ? { ...o, ...patch } : o)));
    showToast(`Shiprocket details updated for Order #${orderId}`);

    try {
      const docRef = doc(db, 'orders', String(orderId));
      await setDoc(docRef, patch, { merge: true });

      const targetOrder = (orders || []).find(o => String(o.id) === String(orderId)) || { id: orderId, ...patch };

      // Dispatch Milestone Logistics Alerts via Intelligent Shiprocket Analyzer
      await analyzeAndProcessShiprocketStatus(targetOrder, newStatus);
    } catch (err) {
      console.error('[Firestore] updateOrderShiprocket error:', err);
    }
  }, [orders, showToast]);

  // Product Admin actions & Firestore persistence
  const toggleHideProduct = useCallback(async (id) => {
    if (!id) return;
    const target = (products || []).find(p => String(p.id) === String(id) || String(p._id) === String(id)) ||
                   (latestRcCars || []).find(p => String(p.id) === String(id) || String(p._id) === String(id));
    const nextHidden = target ? (target.hidden !== true && target.isVisible !== false ? true : false) : true;
    const nextIsVisible = !nextHidden;

    setProducts(prev => (prev || []).map(item =>
      String(item.id) === String(id) || String(item._id) === String(id)
        ? { ...item, hidden: nextHidden, isVisible: nextIsVisible }
        : item
    ));
    setLatestRcCars(prev => (prev || []).map(item =>
      String(item.id) === String(id) || String(item._id) === String(id)
        ? { ...item, hidden: nextHidden, isVisible: nextIsVisible }
        : item
    ));
    showToast(`Product ${nextIsVisible ? 'Visible' : 'Hidden'} on Storefront`);

    try {
      const docRef = doc(db, 'products', String(id));
      await setDoc(docRef, { hidden: nextHidden, isVisible: nextIsVisible }, { merge: true });
    } catch (err) {
      console.error('[Firestore] toggleHideProduct error:', err);
    }
  }, [products, latestRcCars, showToast]);

  const toggleProductStock = useCallback(async (id) => {
    if (!id) return;
    const target = (products || []).find(p => String(p.id) === String(id) || String(p._id) === String(id)) ||
                   (latestRcCars || []).find(p => String(p.id) === String(id) || String(p._id) === String(id));
    const nextStock = target ? !(target.inStock !== false) : false;

    setProducts(prev => (prev || []).map(item =>
      String(item.id) === String(id) || String(item._id) === String(id)
        ? { ...item, inStock: nextStock }
        : item
    ));
    setLatestRcCars(prev => (prev || []).map(item =>
      String(item.id) === String(id) || String(item._id) === String(id)
        ? { ...item, inStock: nextStock }
        : item
    ));
    showToast(`Stock updated: ${nextStock ? 'In Stock' : 'Out of Stock'}`);

    try {
      const docRef = doc(db, 'products', String(id));
      await setDoc(docRef, { inStock: nextStock }, { merge: true });
    } catch (err) {
      console.error('[Firestore] toggleProductStock error:', err);
    }
  }, [products, latestRcCars, showToast]);

  const toggleProduct3D = useCallback(async (id) => {
    if (!id) return;
    const target = (products || []).find(p => String(p.id) === String(id) || String(p._id) === String(id)) ||
                   (latestRcCars || []).find(p => String(p.id) === String(id) || String(p._id) === String(id));
    const next3D = target ? !(target.enable3DView !== false && target.show3dViewer !== false) : true;

    setProducts(prev => (prev || []).map(item =>
      String(item.id) === String(id) || String(item._id) === String(id)
        ? { ...item, enable3DView: next3D, show3dViewer: next3D }
        : item
    ));
    setLatestRcCars(prev => (prev || []).map(item =>
      String(item.id) === String(id) || String(item._id) === String(id)
        ? { ...item, enable3DView: next3D, show3dViewer: next3D }
        : item
    ));
    showToast(`3D Orbital Viewer: ${next3D ? 'Enabled' : 'Disabled'}`);

    try {
      const docRef = doc(db, 'products', String(id));
      await setDoc(docRef, { enable3DView: next3D, show3dViewer: next3D }, { merge: true });
    } catch (err) {
      console.error('[Firestore] toggleProduct3D error:', err);
    }
  }, [products, latestRcCars, showToast]);

  const updateProductPrice = useCallback(async (id, newPrice, newMrp) => {
    if (!id) return;
    const discount = Math.round(((newMrp - newPrice) / newMrp) * 100);
    const patch = { price: Number(newPrice), mrp: Number(newMrp), originalPrice: Number(newMrp), discount };

    setProducts(prev => (prev || []).map(item =>
      String(item.id) === String(id) || String(item._id) === String(id)
        ? { ...item, ...patch }
        : item
    ));
    setLatestRcCars(prev => (prev || []).map(item =>
      String(item.id) === String(id) || String(item._id) === String(id)
        ? { ...item, ...patch }
        : item
    ));
    showToast(`Price updated to ₹${Number(newPrice).toLocaleString('en-IN')}`);

    try {
      const docRef = doc(db, 'products', String(id));
      await setDoc(docRef, patch, { merge: true });
    } catch (err) {
      console.error('[Firestore] updateProductPrice error:', err);
    }
  }, [showToast]);

  const updateProductDetails = useCallback(async (id, patchData) => {
    if (!id) return;
    setProducts(prev => (prev || []).map(item =>
      String(item.id) === String(id) || String(item._id) === String(id)
        ? { ...item, ...patchData }
        : item
    ));
    setLatestRcCars(prev => (prev || []).map(item =>
      String(item.id) === String(id) || String(item._id) === String(id)
        ? { ...item, ...patchData }
        : item
    ));
    showToast('Product details saved and synced live');

    try {
      const docRef = doc(db, 'products', String(id));
      await setDoc(docRef, patchData, { merge: true });
    } catch (err) {
      console.error('[Firestore] updateProductDetails error:', err);
    }
  }, [showToast]);

  const updateProduct = useCallback(async (idOrProduct, updatedFields) => {
    let targetId = typeof idOrProduct === 'object' && idOrProduct !== null ? (idOrProduct.id || idOrProduct._id) : idOrProduct;
    let patch = typeof idOrProduct === 'object' && idOrProduct !== null ? idOrProduct : updatedFields;
    if (!targetId) return;

    const newPrice = patch.price !== undefined ? Number(patch.price) : undefined;
    const newOrigPrice = patch.originalPrice !== undefined ? Number(patch.originalPrice) : (patch.mrp !== undefined ? Number(patch.mrp) : undefined);

    const patchPayload = { ...patch };
    if (newPrice !== undefined) patchPayload.price = newPrice;
    if (newOrigPrice !== undefined) {
      patchPayload.originalPrice = newOrigPrice;
      patchPayload.mrp = newOrigPrice;
    }

    setProducts(prev => (prev || []).map(item => {
      if (String(item.id) === String(targetId) || String(item._id) === String(targetId)) {
        return { ...item, ...patchPayload };
      }
      return item;
    }));

    setLatestRcCars(prev => (prev || []).map(item => {
      if (String(item.id) === String(targetId) || String(item._id) === String(targetId)) {
        return { ...item, ...patchPayload };
      }
      return item;
    }));

    showToast('Product updated live!');

    const cleanPatch = sanitizeForFirestore(patchPayload);

    try {
      const docRef = doc(db, 'products', String(targetId));
      await updateDoc(docRef, cleanPatch);
    } catch (err) {
      try {
        const docRef = doc(db, 'products', String(targetId));
        await setDoc(docRef, cleanPatch, { merge: true });
      } catch (e) {
        console.error('[Firestore] updateProduct error:', e);
      }
    }
  }, [showToast]);

  const addProduct = useCallback(async (newProd) => {
    const generatedDocRef = doc(collection(db, 'products'));
    const newId = String(newProd.id || generatedDocRef.id);
    const fullProduct = {
      ...newProd,
      id: newId,
      title: newProd.title || newProd.name || 'Untitled Scale Model',
      name: newProd.name || newProd.title || 'Untitled Scale Model',
      category: newProd.category || 'Bashers and Monster',
      brand: newProd.brand || 'MJ SCALE',
      scale: newProd.scale || '1:10',
      price: Number(newProd.price || 0),
      originalPrice: Number(newProd.originalPrice || newProd.mrp || newProd.price || 0),
      mrp: Number(newProd.mrp || newProd.originalPrice || newProd.price || 0),
      discount: (newProd.originalPrice || newProd.mrp) ? Math.round((((newProd.originalPrice || newProd.mrp) - (newProd.price || 0)) / (newProd.originalPrice || newProd.mrp)) * 100) : 20,
      rcCoins: Math.floor(Number(newProd.price || 0) * 0.01),
      inStock: newProd.inStock !== undefined ? Boolean(newProd.inStock) : true,
      hidden: Boolean(newProd.hidden || false),
      isVisible: newProd.isVisible !== undefined ? Boolean(newProd.isVisible) : true,
      rating: newProd.rating || 5.0,
      reviewsCount: newProd.reviewsCount || 1,
      boughtToday: 5,
      totalSold: 45,
      image: newProd.image || newProd.imageUrl || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
      imageUrl: newProd.imageUrl || newProd.image || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
      images: newProd.images && newProd.images.length > 0 ? newProd.images : [newProd.image || newProd.imageUrl || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'],
      description: newProd.description || 'Precision scale model engineered with authentic proportions, high-detail finish, and responsive controls.',
      specs: newProd.specs || {
        motor: 'Micro High RPM',
        drivetrain: '2WD Precision Scale',
        topSpeed: '20 km/h',
        esc: 'Micro ESC Unit',
        battery: 'Rechargeable LiPo',
        radio: '2.4GHz Controller'
      },
      createdAt: new Date().toISOString()
    };

    const cleanFirestoreProduct = sanitizeForFirestore(fullProduct);

    // 1. Explicitly write to Firestore products collection
    try {
      const docRef = doc(db, 'products', newId);
      await setDoc(docRef, cleanFirestoreProduct);
      console.log('✅ [Firestore] Product successfully created and persisted in products collection:', newId);
    } catch (err) {
      console.error('❌ [Firestore] addProduct error:', err);
      showToast(`Error saving product to database: ${err.message}`);
    }

    // 2. Update local state immediately with newly created Firestore ID
    setProducts(prev => {
      const exists = (prev || []).some(p => String(p.id) === String(newId));
      if (exists) return prev.map(p => String(p.id) === String(newId) ? fullProduct : p);
      return [fullProduct, ...(prev || [])];
    });

    showToast(`Added vehicle "${(fullProduct.title || fullProduct.name).substring(0, 20)}..."!`);
    return fullProduct;
  }, [showToast]);

  const deleteProduct = useCallback(async (id) => {
    if (!id) return;
    setProducts(prev => (prev || []).filter(item => String(item.id) !== String(id) && String(item._id) !== String(id)));
    showToast('Vehicle deleted successfully from store!');

    try {
      const docRef = doc(db, 'products', String(id));
      await deleteDoc(docRef);
    } catch (err) {
      console.error('[Firestore] deleteProduct error:', err);
    }
  }, [showToast]);

  const getProductById = useCallback((id) => {
    if (!id) return null;
    const list = (products && products.length > 0) ? products : (DEFAULT_PRODUCTS || []);
    return list.find(p => String(p.id || p._id).toLowerCase() === String(id).toLowerCase()) || null;
  }, [products]);

  // Automated Courier Tracking Simulator & Shiprocket Sync Lifecycle Engine
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders(prevOrders => {
        let hasChanges = false;
        const updated = (prevOrders || []).map(order => {
          if (!order.status || order.status === 'Order Placed' || order.status === 'Processing') {
            hasChanges = true;
            return { ...order, status: 'Packed & Bench-Tested', lastSyncedAt: new Date().toISOString() };
          } else if (order.status === 'Packed & Bench-Tested' || order.status === 'Packed') {
            hasChanges = true;
            return { ...order, status: 'Dispatched via Mysore Hub', lastSyncedAt: new Date().toISOString() };
          } else if (order.status === 'Dispatched via Mysore Hub' || order.status === 'Shipped') {
            hasChanges = true;
            return { ...order, status: 'In Transit (Out for Delivery)', lastSyncedAt: new Date().toISOString() };
          } else if (order.status === 'In Transit (Out for Delivery)' || order.status === 'In Transit') {
            hasChanges = true;
            if (whatsappConfig?.autoReviewRequest) {
              sendWhatsAppNotification({
                phone: order.mobile,
                templateType: 'delivery_review_request',
                data: { orderId: order.id, name: order.customerName },
                config: whatsappConfig
              });
              // Auto-simulate incoming WhatsApp feedback response in pending queue
              receiveWhatsAppReviewFeedback({
                phone: order.mobile,
                customerName: order.customerName,
                city: order.city || 'Mysore Hub',
                carModel: order.items?.[0]?.title || 'Scale Hobby RC Machine',
                rating: 5,
                comment: 'Unbelievable 6S speed & portal axle trail performance! Delivered in under 24h from Mysore Central Hub.'
              });
            }
            return { ...order, status: 'Delivered', lastSyncedAt: new Date().toISOString() };
          }
          return order;
        });

        if (hasChanges) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('mj_orders_v3', JSON.stringify(updated));
          }
          if (liveSyncChannel) {
            liveSyncChannel.postMessage({
              type: 'TELEMETRY_SYNC',
              payload: {
                orders: updated,
                cart: cart,
                activePhone: user?.phone
              }
            });
          }
        }

        return hasChanges ? updated : prevOrders;
      });
    }, 25000); // 25-second auto-progression pipeline tick

    return () => clearInterval(timer);
  }, [whatsappConfig, cart, user]);

  const receiveWhatsAppReviewFeedback = useCallback(async ({ phone, customerName, city, carModel, rating, comment }) => {
    const newPending = {
      id: `wa-rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerName: customerName || 'Verified Buyer',
      phone: phone || '9876543210',
      city: city || 'Mysore Hub',
      carModel: carModel || 'Scale Hobby RC',
      rating: rating || 5,
      comment: comment || 'Awesome performance and fast Mysore hub delivery!',
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    setReviewsList(prev => [newPending, ...(prev || [])]);
    if (db) {
      try {
        const docRef = doc(db, 'reviews', newPending.id);
        await setDoc(docRef, newPending, { merge: true });
      } catch (err) {
        console.warn('[Firestore] receiveWhatsAppReviewFeedback error:', err);
      }
    }
  }, []);

  const approveReview = useCallback(async (reviewId) => {
    setReviewsList(prev =>
      (prev || []).map(r => (r.id === reviewId ? { ...r, status: 'published' } : r))
    );
    if (db && reviewId) {
      try {
        const docRef = doc(db, 'reviews', String(reviewId));
        await setDoc(docRef, { status: 'published' }, { merge: true });
      } catch (err) {
        console.warn('[Firestore] approveReview error:', err);
      }
    }
    addUserCoins(200);
    showToast('Review Approved! Published to Storefront & +200 RC Coins credited!');
  }, [addUserCoins, showToast]);

  const declineReview = useCallback(async (reviewId) => {
    setReviewsList(prev => (prev || []).filter(r => r.id !== reviewId));
    if (db && reviewId) {
      try {
        const docRef = doc(db, 'reviews', String(reviewId));
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('[Firestore] declineReview error:', err);
      }
    }
    showToast('Review declined and removed from feedback queue.');
  }, [showToast]);

  const addReview = useCallback(async (review) => {
    const newRev = {
      ...review,
      id: review.id || `rev-${Date.now()}`,
      status: review.status || 'published',
      created_at: new Date().toISOString()
    };
    setReviewsList(prev => [newRev, ...(prev || []).filter(r => r.id !== newRev.id)]);
    if (db) {
      try {
        const docRef = doc(db, 'reviews', String(newRev.id));
        await setDoc(docRef, newRev, { merge: true });
      } catch (err) {
        console.warn('[Firestore] addReview error:', err);
      }
    }
  }, []);

  const deleteReview = useCallback(async (id) => {
    setReviewsList(prev => (prev || []).filter(r => r.id !== id));
    if (db && id) {
      try {
        const docRef = doc(db, 'reviews', String(id));
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('[Firestore] deleteReview error:', err);
      }
    }
    showToast('Review removed.');
  }, [showToast]);

  const handleShiprocketWebhook = useCallback((payload) => {
    if (!payload) return;
    const targetAwb = payload.awb || payload.awb_code;
    const newStatus = payload.current_status || payload.status || 'Delivered';

    setOrders(prev => {
      const updatedOrders = (prev || []).map(o => {
        if (o.awb === targetAwb || o.id === payload.order_id || o.id === payload.orderId) {
          showToast(`Shiprocket Webhook: Order #${o.id} auto-synced to ${newStatus}`);
          return { ...o, status: newStatus, lastSyncedAt: new Date().toISOString() };
        }
        return o;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('mj_orders_v3', JSON.stringify(updatedOrders));
      }
      if (liveSyncChannel) {
        liveSyncChannel.postMessage({
          type: 'TELEMETRY_SYNC',
          payload: {
            orders: updatedOrders,
            cart: cart,
            activePhone: user?.phone
          }
        });
      }
      return updatedOrders;
    });
  }, [cart, user, showToast]);

  const updateOrderStatus = useCallback((orderId, newStatus) => {
    setOrders(prev => {
      const updatedOrders = (prev || []).map(o => (o.id === orderId ? { ...o, status: newStatus, lastSyncedAt: new Date().toISOString() } : o));
      if (typeof window !== 'undefined') {
        localStorage.setItem('mj_orders_v3', JSON.stringify(updatedOrders));
      }
      if (liveSyncChannel) {
        liveSyncChannel.postMessage({
          type: 'TELEMETRY_SYNC',
          payload: {
            orders: updatedOrders,
            cart: cart,
            activePhone: user?.phone
          }
        });
      }
      return updatedOrders;
    });
    showToast(`Order #${orderId} status updated to ${newStatus}`);
  }, [cart, user, showToast]);

  const cancelOrder = useCallback((orderId) => {
    setOrders(prev => {
      const updatedOrders = (prev || []).map(o => (o.id === orderId ? { ...o, status: 'Cancelled', lastSyncedAt: new Date().toISOString() } : o));
      if (typeof window !== 'undefined') {
        localStorage.setItem('mj_orders_v3', JSON.stringify(updatedOrders));
      }
      if (liveSyncChannel) {
        liveSyncChannel.postMessage({
          type: 'TELEMETRY_SYNC',
          payload: {
            orders: updatedOrders,
            cart: cart,
            activePhone: user?.phone
          }
        });
      }
      return updatedOrders;
    });
    showToast(`Order #${orderId} has been cancelled.`);
  }, [cart, user, showToast]);

  const triggerLoginWelcome = useCallback((phone, name = 'RC Racer', coins = 500) => {
    if (!phone) return;
    const cleanDigits = String(phone).replace(/\D/g, '').slice(-10);
    const sessionKey = `welcome_sent_${cleanDigits}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) {
      console.log(`>>> [WhatsApp Session Guard]: Welcome onboarding already sent for +91${cleanDigits} in this session. Skipping.`);
      return;
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey, 'true');
    }

    const sanitizedCoins = formatCoins(coins);
    const now = Date.now();
    const expiresAt = now + (7 * 24 * 60 * 60 * 1000); // 7-day expiry timestamp
    const timestamp = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    // 1. Persist/Sync to Firestore users collection
    try {
      const userDocRef = doc(db, 'users', String(phone));
      setDoc(userDocRef, {
        phone,
        name,
        rcCoins: sanitizedCoins,
        permanentCoins: sanitizedCoins,
        coinsGrantedAt: new Date().toISOString(),
        expiresAt: expiresAt,
        joinedAt: new Date().toISOString()
      }, { merge: true }).catch(err => console.error('[Firestore] User coin update error:', err));
    } catch (e) {}

    // 2. Append live record to driverLogins
    const newLoginRecord = {
      id: `log-${Date.now()}`,
      phone: phone,
      name: name,
      timestamp: timestamp,
      authMethod: '6-Digit SMS OTP',
      otpStatus: '🟢 Delivered / Verified',
      device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile Browser (iOS/Android)' : 'Desktop Browser',
      ip: '103.24.120.44 (Mysore Hub)',
      coinsAwarded: coins,
      expiresAt: expiresAt
    };
    setDriverLogins(prev => [newLoginRecord, ...(prev || [])]);

    // 3. Append live record to otpLogs
    const newOtpRecord = {
      id: `otp-${Date.now()}`,
      phone: phone,
      code: '1234',
      status: '🟢 Delivered / Verified',
      sentAt: timestamp,
      verifiedAt: timestamp,
      gateway: 'WhatsApp Business API Gateway'
    };
    setOtpLogs(prev => [newOtpRecord, ...(prev || [])]);

    // 4. Trigger WhatsApp Welcome Cloud API event with 7-day expiring coins message
    if (isAutoWhatsAppWelcome !== false) {
      triggerAuthWelcomeAutomation({ phone, userName: name, coinsCredited: coins }).catch(err => {
        console.warn('[WhatsApp Cloud API] Welcome notice:', err);
      });
      showToast(`⚡ WhatsApp Auto-Welcome dispatched to +91${phone}`);
    } else {
      showToast(`Login verified for +91${phone}. Auto-WhatsApp is paused.`);
    }
  }, [isAutoWhatsAppWelcome, whatsappConfig, showToast]);

  // Custom Manual Coin Injection & Expiry Control
  const grantCustomCoins = useCallback(async (phone, coinsAmount, customExpiryTimestamp) => {
    if (!phone || !coinsAmount) return;
    const numCoins = Number(coinsAmount);
    const expiryTime = customExpiryTimestamp || (Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expiryFormatted = new Date(expiryTime).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Update customer list state
    setCustomers(prev => (prev || []).map(c => {
      if (c.phone === phone) {
        return {
          ...c,
          rcCoins: (c.rcCoins || 0) + numCoins,
          expiresAt: expiryTime
        };
      }
      return c;
    }));

    // Update user state if active user
    setUser(prev => {
      if (prev && prev.phone === phone) {
        return { ...prev, rcCoins: (prev.rcCoins || 0) + numCoins, expiresAt: expiryTime };
      }
      return prev;
    });

    // Sync directly to Firestore users/{phone}
    try {
      const userDocRef = doc(db, 'users', String(phone));
      await setDoc(userDocRef, {
        rcCoins: numCoins,
        coinsGrantedAt: new Date().toISOString(),
        expiresAt: expiryTime,
        lastAdminGrantAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error('[Firestore] grantCustomCoins error:', err);
    }

    // Trigger instant WhatsApp alert
    const alertMsg = `⚡ Bonus Coins Credited! You've received ${numCoins} RC Coins valid until ${expiryFormatted}. Start shopping now at MJ RC BASE!`;
    sendWhatsAppNotification({
      phone,
      templateType: 'custom_coins_grant',
      data: { coins: numCoins, expiry: expiryFormatted, message: alertMsg },
      config: whatsappConfig
    });

    showToast(`Granted +${numCoins} RC Coins to +91${phone} (Expires: ${expiryFormatted})`);
  }, [whatsappConfig, showToast]);

  const processReferral = useCallback((refCode, newPhone, newName = 'RC Racer') => {
    if (!refCode) return;
    const existingRef = (referralNetwork || []).find(r => r.joinedFriendMobile === newPhone);
    if (existingRef) return;

    const refDigits = refCode.replace(/[^0-9]/g, '');
    const referrer = (customers || []).find(c => c.phone && c.phone.endsWith(refDigits));
    const referrerName = referrer ? referrer.name : 'Nitin Sharma';
    const referrerMobile = referrer ? referrer.phone : '9876543210';

    const newRecord = {
      id: `ref-${Date.now()}`,
      referrerMobile: referrerMobile,
      referrerName: referrerName,
      joinedFriendMobile: newPhone,
      joinedFriendName: newName,
      referralCode: refCode,
      referrerRewardCoins: 0,
      friendRewardCoins: 0,
      status: '🟡 Friend Registered (No Order Placed - 0 Coins Credited)',
      converted: false,
      orderId: null,
      joinedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    setReferralNetwork(prev => [newRecord, ...(prev || [])]);
    showToast(`🎉 Referral Linked with ${referrerName}! First order required to unlock +500 RC Coins reward.`);
  }, [referralNetwork, customers, showToast]);

  const sendTestWhatsAppMessage = useCallback(async (testPhone = '9876543210') => {
    const res = await sendWhatsAppNotification({
      phone: testPhone,
      templateType: 'test_welcome',
      data: { message: whatsAppTemplate },
      config: whatsappConfig
    });
    if (res.success) {
      showToast(`⚡ Test WhatsApp dispatched to +91${testPhone} (${res.mode || 'simulated'} mode)!`);
    } else {
      showToast(`WhatsApp test result: ${res.reason || res.error || 'Triggered'}`);
    }
  }, [whatsAppTemplate, whatsappConfig, showToast]);

  const broadcastFestiveCampaign = useCallback((campaignData) => {
    const targetCustomers = customers || [];
    targetCustomers.forEach(cust => {
      sendWhatsAppNotification({
        phone: cust.phone,
        templateType: 'flashSale',
        data: {
          name: cust.name,
          title: campaignData.title || festiveCampaign.title,
          discount: campaignData.discount || festiveCampaign.discount,
          message: campaignData.message || festiveCampaign.message
        }
      });
    });
    showToast(`[WhatsApp Blast]: Sent Festive Deal "${campaignData.title || festiveCampaign.title}" to ${targetCustomers.length} drivers!`);
  }, [customers, festiveCampaign, showToast]);

  const logoutUser = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mjrc_user');
      localStorage.removeItem('mjrc_token');
      localStorage.removeItem('mjrc_active_phone');
      localStorage.removeItem('mjrc_auth');
      localStorage.removeItem('mj_user_v2');
      localStorage.removeItem('mj_auth_user');
      sessionStorage.clear();
    }
    setUser(null);
    setCart([]);
    setWishlist([]);
    setIsAccountOpen(false);
    setIsOtpOpen(false);
    setIsCheckoutOpen(false);
    setPendingCheckout(false);
    showToast('Logged out cleanly. Device session cleared.');
  }, [showToast]);

  const resetToDefault = useCallback(() => {
    setProducts(DEFAULT_PRODUCTS);
    setHeroBanner(DEFAULT_HERO_BANNER);
    setAddonsConfig(DEFAULT_ADDONS);
    setOrders(DEFAULT_ORDERS);
    setCustomers(DEFAULT_CUSTOMERS);
    setUser(DEFAULT_USER);
    setCart([]);
    setDriverLogins(DEFAULT_DRIVER_LOGINS);
    setOtpLogs(DEFAULT_OTP_LOGS);
    setReferralNetwork(DEFAULT_REFERRAL_NETWORK);
    setWhatsAppTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    setIsAutoWhatsAppWelcome(true);
    localStorage.clear();
    showToast('Storefront reset to defaults!');
  }, [showToast]);

  const syncCatalog = useCallback(() => {
    try {
      const saved = localStorage.getItem('mjrc_products') || localStorage.getItem('mj_products_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
          broadcastCatalogUpdate(parsed);
          return true;
        }
      }
      setProducts(DEFAULT_PRODUCTS);
      broadcastCatalogUpdate(DEFAULT_PRODUCTS);
      return true;
    } catch (e) {
      console.warn('Sync catalog error:', e);
      return false;
    }
  }, []);

  const [categoryVisibility, setCategoryVisibility] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_category_visibility');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Listen to Firestore settings/storefront document for real-time visibility settings
  useEffect(() => {
    const settingsDoc = doc(db, 'settings', 'storefront');
    const unsubscribe = onSnapshot(settingsDoc, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.brandVisibility) {
          setBrandVisibility(data.brandVisibility);
          try { localStorage.setItem('mj_brand_visibility', JSON.stringify(data.brandVisibility)); } catch (e) {}
        }
        if (data.categoryVisibility) {
          setCategoryVisibility(data.categoryVisibility);
          try { localStorage.setItem('mj_category_visibility', JSON.stringify(data.categoryVisibility)); } catch (e) {}
        }
      }
    }, (err) => {
      console.warn('[Firestore] Settings listener notice:', err);
    });

    return () => unsubscribe();
  }, []);

  const toggleCategoryVisibility = useCallback(async (categoryName) => {
    if (!categoryName) return;
    setCategoryVisibility(prev => {
      const current = prev[categoryName] !== false;
      const updated = { ...prev, [categoryName]: !current };
      try { localStorage.setItem('mj_category_visibility', JSON.stringify(updated)); } catch (e) {}
      setDoc(doc(db, 'settings', 'storefront'), { categoryVisibility: updated }, { merge: true }).catch(err => {
        console.error('[Firestore] categoryVisibility sync error:', err);
      });
      return updated;
    });
  }, []);

  const [loyaltyRules, setLoyaltyRules] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_loyalty_rules');
      return saved ? JSON.parse(saved) : {
        coinRedeemRate: 0.2, // 500 coins = ₹100
        minCoinsForDiscount: 100,
        welcomeCoinsBonus: 500,
        earnCoinsPercent: 1
      };
    } catch {
      return {
        coinRedeemRate: 0.2,
        minCoinsForDiscount: 100,
        welcomeCoinsBonus: 500,
        earnCoinsPercent: 1
      };
    }
  });

  // Listen to Firestore settings/loyalty document for real-time loyalty rules
  useEffect(() => {
    const docRef = doc(db, 'settings', 'loyalty');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const minVal = data.minCoinsRequired !== undefined ? Number(data.minCoinsRequired) : (data.minCoinsForDiscount !== undefined ? Number(data.minCoinsForDiscount) : 100);
        
        // Direct auto-reset of corrupted minCoinsRequired values (>500 or 104111111)
        if (minVal > 500 || minVal === 104111111) {
          console.warn('[Firestore Auto-Reset] Corrupted minCoinsRequired detected:', minVal, '-> Overwriting Firestore with clean defaults.');
          const cleanDoc = {
            ...data,
            coinRedemptionRate: 0.20,
            coinRedeemRate: 0.20,
            minCoinsRequired: 100,
            minCoinsForDiscount: 100,
            welcomeBonusCoins: 500,
            welcomeCoinsBonus: 500
          };
          setDoc(docRef, cleanDoc, { merge: true }).catch(err => console.warn('Auto-reset setDoc error:', err));
          setLoyaltyRules(cleanDoc);
          try { localStorage.setItem('mj_loyalty_rules', JSON.stringify(cleanDoc)); } catch (e) {}
        } else {
          setLoyaltyRules(prev => ({
            ...prev,
            ...data,
            minCoinsRequired: minVal,
            minCoinsForDiscount: minVal
          }));
          try { localStorage.setItem('mj_loyalty_rules', JSON.stringify(data)); } catch (e) {}
        }
      } else {
        const cleanDoc = {
          coinRedemptionRate: 0.20,
          coinRedeemRate: 0.20,
          minCoinsRequired: 100,
          minCoinsForDiscount: 100,
          welcomeBonusCoins: 500,
          welcomeCoinsBonus: 500
        };
        setDoc(docRef, cleanDoc, { merge: true }).catch(() => {});
        setLoyaltyRules(cleanDoc);
      }
    }, (err) => {
      console.warn('[Firestore] Loyalty settings listener notice:', err);
    });
    return () => unsubscribe();
  }, []);

  const updateLoyaltyRules = useCallback(async (newRules) => {
    setLoyaltyRules(prev => {
      const updated = {
        ...prev,
        ...newRules,
        coinRedemptionRate: newRules.coinRedeemRate || newRules.coinRedemptionRate || prev.coinRedemptionRate || prev.coinRedeemRate || 0.20,
        coinRedeemRate: newRules.coinRedeemRate || newRules.coinRedemptionRate || prev.coinRedeemRate || prev.coinRedemptionRate || 0.20,
        minCoinsRequired: newRules.minCoinsRequired !== undefined ? newRules.minCoinsRequired : (newRules.minCoinsForDiscount !== undefined ? newRules.minCoinsForDiscount : 100),
        minCoinsForDiscount: newRules.minCoinsForDiscount !== undefined ? newRules.minCoinsForDiscount : (newRules.minCoinsRequired !== undefined ? newRules.minCoinsRequired : 100)
      };
      try { localStorage.setItem('mj_loyalty_rules', JSON.stringify(updated)); } catch (e) {}
      setDoc(doc(db, 'settings', 'loyalty'), updated, { merge: true }).catch(err => {
        console.error('[Firestore] loyalty rules sync error:', err);
      });
      return updated;
    });
    showToast('Loyalty rules updated & synced to Firestore!');
  }, [showToast]);

  const visibleProducts = useMemo(() => {
    return (products || []).filter(p => {
      if (p.hidden || p.isVisible === false) return false;
      if (p.brand && brandVisibility && brandVisibility[p.brand] === false) return false;
      if (p.category && categoryVisibility && categoryVisibility[p.category] === false) return false;
      return true;
    });
  }, [products, brandVisibility, categoryVisibility]);

  const contextValue = useMemo(() => ({
    logout: logoutUser,
    logoutUser,
    handleLogout: logoutUser,
    products: visibleProducts,
    allProducts: products,
    categoryVisibility,
    setCategoryVisibility,
    toggleCategoryVisibility,
    setProducts,
    toggleHideProduct,
    heroBanner,
    setHeroBanner,
    addonsConfig,
    setAddonsConfig,
    orders,
    setOrders,
    customers,
    setCustomers,
    cart,
    setCart,
    wishlist,
    setWishlist,
    user,
    setUser,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedScale,
    setSelectedScale,
    selectedBrand,
    setSelectedBrand,
    isCartOpen,
    setIsCartOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isOtpOpen,
    setIsOtpOpen,
    isAccountOpen,
    setIsAccountOpen,
    isAdminOpen,
    setIsAdminOpen,
    pendingCheckout,
    setPendingCheckout,
    activeProductModal,
    setActiveProductModal,
    toastMessage,
    showToast,
    registerCustomer,
    redeemUserCoins,
    addUserCoins,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartCount,
    toggleWishlist,
    placeOrder,
    updateProductPrice,
    updateProductDetails,
    updateProduct,
    addProduct,
    deleteProduct,
    broadcastRealtimeSync,
    updateStoreState,
    whatsappConfig,
    setWhatsappConfig,
    broadcastTemplates,
    setBroadcastTemplates,
    reviewsList,
    addReview,
    deleteReview,
    receiveWhatsAppReviewFeedback,
    approveReview,
    declineReview,
    updateOrderStatus,
    cancelOrder,
    handleShiprocketWebhook,
    referralsList,
    setReferralsList,
    festiveCampaign,
    setFestiveCampaign,
    triggerLoginWelcome,
    processReferral,
    sendTestWhatsAppMessage,
    broadcastFestiveCampaign,
    resetToDefault,
    isScaleModelsEnabled,
    setIsScaleModelsEnabled,
    driverLogins,
    setDriverLogins,
    otpLogs,
    setOtpLogs,
    referralNetwork,
    setReferralNetwork,
    whatsAppTemplate,
    setWhatsAppTemplate,
    isAutoWhatsAppWelcome,
    setIsAutoWhatsAppWelcome,
    whatsAppWelcomeTemplate,
    setWhatsAppWelcomeTemplate,
    brandVisibility,
    setBrandVisibility,
    toggleBrandVisibility,
    brandsList,
    saveBrand,
    deleteBrand,
    restoreDefaultBrands,
    brandTabTitles,
    updateBrandTabTitles,
    categoriesList,
    saveCategory,
    deleteCategory,
    restoreDefaultCategories,
    categories: categoriesList || DEFAULT_CATEGORIES,
    brands: DEFAULT_BRANDS,
    scaleModelsEnabled: isScaleModelsEnabled,
    setScaleModelsEnabled: setIsScaleModelsEnabled,
    latestRcCars: activeLatestRcCars || latestRcCars || DEFAULT_LATEST_RC_CARS,
    setLatestRcCars,
    customScaleCategories,
    setCustomScaleCategories,
    addCustomScaleCategory,
    broadcastCatalogUpdate,
    syncCatalog,
    loyaltyRules,
    updateLoyaltyRules,
    grantCustomCoins,
    toggleProductStock,
    welcomeConfig,
    updateWelcomeConfig,
    marqueeTicker,
    updateMarqueeTicker,
    welcomeBonusCoins,
    updateWelcomeBonusCoins,
    currentUser: user,
    setCurrentUser: setUser,
    triggerCampaignBroadcast,
    triggerLogisticsAlert,
    whatsappLogs,
    setWhatsappLogs,
    clearTestWhatsAppLogs,
    purgeAllTestUsersAndResetCrm,
    purgeAllTestOrdersAndResetDatabase,
    sendCloudWhatsAppMessage,
    getProductById,
    fetchUserProfileAndRestoreData,
    saveUserAddress
  }), [
    fetchUserProfileAndRestoreData, saveUserAddress,
    logoutUser, products, heroBanner, addonsConfig, orders, customers, cart, wishlist, user,
    searchQuery, selectedCategory, selectedScale, selectedBrand,
    isCartOpen, isCheckoutOpen, isOtpOpen, isAccountOpen, isAdminOpen,
    pendingCheckout, activeProductModal, toastMessage,
    showToast, registerCustomer, redeemUserCoins, addUserCoins,
    addToCart, updateCartQty, removeFromCart, clearCart, cartSubtotal, cartCount,
    toggleWishlist, placeOrder, updateProductPrice, updateProductDetails,
    addProduct, deleteProduct, broadcastRealtimeSync, updateStoreState,
    whatsappConfig, broadcastTemplates, reviewsList, addReview, deleteReview,
    receiveWhatsAppReviewFeedback, approveReview, declineReview,
    updateOrderStatus, cancelOrder, handleShiprocketWebhook, referralsList, festiveCampaign,
    triggerLoginWelcome, processReferral, sendTestWhatsAppMessage,
    broadcastFestiveCampaign, resetToDefault, isScaleModelsEnabled,
    driverLogins, otpLogs, referralNetwork, whatsAppTemplate, isAutoWhatsAppWelcome,
    brandVisibility, toggleBrandVisibility, brandsList, saveBrand, deleteBrand, restoreDefaultBrands,
    brandTabTitles, updateBrandTabTitles, welcomeConfig, updateWelcomeConfig, welcomeBonusCoins, updateWelcomeBonusCoins, triggerCampaignBroadcast, triggerLogisticsAlert,
    categoriesList, saveCategory, deleteCategory, restoreDefaultCategories, latestRcCars, customScaleCategories,
    addCustomScaleCategory, syncCatalog, loyaltyRules, updateLoyaltyRules, grantCustomCoins,
    toggleProductStock, toggleProduct3D, updateOrderShiprocket, whatsappLogs, clearTestWhatsAppLogs, purgeAllTestUsersAndResetCrm, purgeAllTestOrdersAndResetDatabase, getProductById
  ]);

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};

export { StoreContext };
export default StoreProvider;
