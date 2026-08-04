// src/lib/firebase.ts
//
// Single Firebase client instance for the whole web app.
// This connects to the SAME Firebase project used by the TELVO mobile app
// (see backend/src/config/firebase.js and lib/config/firebase_config.dart
// in the main repo) so data created on web is visible on mobile and vice
// versa. Do NOT create a second Firebase project for the web client.

import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

const requiredEnv = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_SENDER_ID',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_AUTH_DOMAIN',
] as const;

const missing = requiredEnv.filter((key) => !import.meta.env[key]);
if (missing.length > 0) {
  // Fail loudly in dev rather than silently running against an
  // unconfigured/undefined Firebase project.
  // eslint-disable-next-line no-console
  console.error(
    `[TELVO] Missing Firebase environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env.local and fill in real values from the Firebase console.'
  );
}

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('[TELVO] Failed to enable local auth persistence:', error);
});

// Optional: local emulator support for development without touching prod data.
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

// FCM only works in supported, secure (https/localhost) contexts.
export const getMessagingIfSupported = async () => {
  if (await isSupported()) {
    return getMessaging(app);
  }
  return null;
};

// Collection names - MUST match backend/src/config/database.js COLLECTIONS
// exactly, since both clients read/write the same collections.
export const COLLECTIONS = {
  USERS: 'users',
  JOBS: 'jobs',
  PAYMENTS: 'payments',
  CHATS: 'chats',
  MESSAGES: 'messages',
  REVIEWS: 'reviews',
  NOTIFICATIONS: 'notifications',
  ADMINS: 'admins',
  WALLETS: 'wallets',
  DISPUTES: 'disputes',
  FRAUD_REPORTS: 'fraud_reports',
  PROMOTIONS: 'promotions',
  CATEGORIES: 'categories',
  DONATIONS: 'donations',
  APP_CONFIG: 'app_config',
  SETTINGS: 'settings',
} as const;
