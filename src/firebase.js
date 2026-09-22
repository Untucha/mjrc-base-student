import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = (typeof import.meta !== 'undefined' && import.meta.env) || process.env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyD6cOmimC_92slcut0GNWAigJdv512xVz4",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "mjrcbase-78c20.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "mjrcbase-78c20",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "mjrcbase-78c20.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "523627612468",
  appId: env.VITE_FIREBASE_APP_ID || "1:523627612468:web:bbb22e267a009e6dccfd61"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
