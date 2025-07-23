// =============================================================================
// IMPROVED FIREBASE CONFIGURATION
// File: frontend/src/firebase/firebase.js - REPLACE EXISTING
// =============================================================================

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Firebase configuration validation
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingVars.length > 0) {
  console.warn('🔥 Missing Firebase environment variables:', missingVars);
  console.warn('🔥 Firebase will run in offline mode');
}

// Firebase configuration with environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug: Log configuration status in development
if (import.meta.env.DEV) {
  console.log('🔥 Firebase Configuration Status:', {
    apiKey: firebaseConfig.apiKey ? '✅ Set' : '❌ Missing',
    authDomain: firebaseConfig.authDomain ? '✅ Set' : '❌ Missing',
    projectId: firebaseConfig.projectId ? '✅ Set' : '❌ Missing',
    storageBucket: firebaseConfig.storageBucket ? '✅ Set' : '❌ Missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? '✅ Set' : '❌ Missing',
    appId: firebaseConfig.appId ? '✅ Set' : '❌ Missing',
  });
}

let app = null;
let auth = null;
let db = null;

try {
  // Only initialize if we have the minimum required config
  if (firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Connect to emulators in development if enabled
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      try {
        connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('🔥 Connected to Firebase emulators');
      } catch (emulatorError) {
        console.warn('⚠️ Firebase emulators not available:', emulatorError.message);
      }
    }

    console.log('✅ Firebase initialized successfully');
  } else {
    console.warn('⚠️ Firebase not initialized - missing required configuration');
    console.warn('App will continue without Firebase features');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.warn('App will continue without Firebase features');
  
  // Reset to null on error
  app = null;
  auth = null;
  db = null;
}

// Enhanced error handling for Firestore operations
const safeFirestoreOperation = async (operation, fallback = null) => {
  if (!db) {
    console.warn('Firestore not available');
    return fallback;
  }

  try {
    return await operation();
  } catch (error) {
    // Handle specific Firestore errors
    if (error.code === 'permission-denied') {
      console.warn('Firestore permission denied - user may not be authenticated');
    } else if (error.code === 'unavailable') {
      console.warn('Firestore service unavailable');
    } else if (error.code === 'unauthenticated') {
      console.warn('Firestore unauthenticated - retrying authentication');
    } else {
      console.error('Firestore operation failed:', error);
    }
    return fallback;
  }
};

// Export with error handling wrapper
export { auth, db, safeFirestoreOperation };
export default app;