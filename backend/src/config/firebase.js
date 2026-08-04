// src/config/firebase.js
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getMessaging } = require('firebase-admin/messaging');
const { logger } = require('../utils/logger');

let firestore;
let auth;
let messaging;

const initializeFirebase = () => {
  if (!admin.apps.length) {
    try {
      let credential;

      if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
        credential = admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        });
      } else {
        credential = admin.credential.applicationDefault();
      }

      admin.initializeApp({
        credential,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });

      firestore = getFirestore();
      auth = getAuth();
      messaging = getMessaging();

      logger.info('🔥 Firebase initialized successfully');
    } catch (error) {
      logger.error('Firebase initialization error:', error);
      throw error;
    }
  }
};

const getFirestoreInstance = () => {
  if (!firestore) {
    throw new Error('Firestore not initialized. Call initializeFirebase first.');
  }
  return firestore;
};

const getAuthInstance = () => {
  if (!auth) {
    throw new Error('Auth not initialized. Call initializeFirebase first.');
  }
  return auth;
};

const getMessagingInstance = () => {
  if (!messaging) {
    throw new Error('Messaging not initialized. Call initializeFirebase first.');
  }
  return messaging;
};

module.exports = {
  initializeFirebase,
  admin,
  getFirestore: getFirestoreInstance,
  getAuth: getAuthInstance,
  getMessaging: getMessagingInstance,
};