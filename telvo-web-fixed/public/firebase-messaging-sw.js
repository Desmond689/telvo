// public/firebase-messaging-sw.js
//
// Required for Firebase Cloud Messaging (web push) to work when the tab is
// backgrounded or closed. Uses the compat SDK because service workers can't
// use bundler-based imports. Fill in the same config values as your
// .env.local (these are public client identifiers, safe to ship).
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'REPLACE_WITH_VITE_FIREBASE_API_KEY',
  authDomain: 'telvo-452fd.firebaseapp.com',
  projectId: 'telvo-452fd',
  messagingSenderId: 'REPLACE_WITH_VITE_FIREBASE_SENDER_ID',
  appId: 'REPLACE_WITH_VITE_FIREBASE_APP_ID',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'TELVO', {
    body: body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  });
});
