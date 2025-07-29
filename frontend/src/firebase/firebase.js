// =============================================================================
// OPTIMIZED FIREBASE CONFIGURATION - MINIMAL BUNDLE SIZE
// File: frontend/src/firebase/firebase.js - REPLACE EXISTING
// =============================================================================

// =============================================================================
// LAZY FIREBASE INITIALIZATION STRATEGY
// =============================================================================

/**
 * Firebase configuration - only store config, don't initialize immediately
 */
const getFirebaseConfig = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'VITE_FIREBASE_PROJECT_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

  if (missingVars.length > 0) {
    console.warn('🔥 Missing Firebase environment variables:', missingVars);
    return null;
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };
};

// =============================================================================
// LAZY INITIALIZATION FUNCTIONS
// =============================================================================

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let initializationPromise = null;

/**
 * Lazy initialize Firebase app - only when actually needed
 */
const initializeFirebaseApp = async () => {
  if (firebaseApp) return firebaseApp;
  
  if (initializationPromise) return initializationPromise;
  
  initializationPromise = (async () => {
    try {
      const config = getFirebaseConfig();
      if (!config) {
        throw new Error('Firebase configuration not available');
      }

      // ONLY import Firebase core when needed
      const { initializeApp } = await import('firebase/app');
      
      firebaseApp = initializeApp(config);
      
      console.log('✅ Firebase app initialized lazily');
      return firebaseApp;
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      initializationPromise = null; // Reset for retry
      throw error;
    }
  })();
  
  return initializationPromise;
};

/**
 * Lazy initialize Firebase Auth - ONLY Auth, no other modules
 */
const initializeFirebaseAuth = async () => {
  if (firebaseAuth) return firebaseAuth;
  
  try {
    const app = await initializeFirebaseApp();
    
    // ONLY import Auth module when needed
    const { getAuth, connectAuthEmulator } = await import('firebase/auth');
    
    firebaseAuth = getAuth(app);
    
    // Connect to emulator in development if enabled
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      try {
        connectAuthEmulator(firebaseAuth, "http://localhost:9099", { disableWarnings: true });
        console.log('🔥 Connected to Firebase Auth emulator');
      } catch (emulatorError) {
        console.warn('⚠️ Firebase Auth emulator not available:', emulatorError.message);
      }
    }
    
    console.log('✅ Firebase Auth initialized lazily');
    return firebaseAuth;
  } catch (error) {
    console.error('❌ Firebase Auth initialization failed:', error);
    throw error;
  }
};

/**
 * Lazy initialize Firebase Firestore - ONLY Firestore, minimal functions
 */
const initializeFirebaseFirestore = async () => {
  if (firebaseDb) return firebaseDb;
  
  try {
    const app = await initializeFirebaseApp();
    
    // ONLY import essential Firestore functions
    const { getFirestore, connectFirestoreEmulator } = await import('firebase/firestore');
    
    firebaseDb = getFirestore(app);
    
    // Connect to emulator in development if enabled
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      try {
        connectFirestoreEmulator(firebaseDb, 'localhost', 8080);
        console.log('🔥 Connected to Firebase Firestore emulator');
      } catch (emulatorError) {
        console.warn('⚠️ Firebase Firestore emulator not available:', emulatorError.message);
      }
    }
    
    console.log('✅ Firebase Firestore initialized lazily');
    return firebaseDb;
  } catch (error) {
    console.error('❌ Firebase Firestore initialization failed:', error);
    throw error;
  }
};

// =============================================================================
// LAZY FIREBASE OPERATIONS
// =============================================================================

/**
 * Safe Firebase operation wrapper with lazy loading
 */
const createLazyFirebaseOperation = (moduleLoader, operationName) => {
  return async (...args) => {
    try {
      const module = await moduleLoader();
      return await module[operationName](...args);
    } catch (error) {
      console.error(`Firebase ${operationName} failed:`, error);
      
      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        console.warn('Firebase permission denied - user may not be authenticated');
      } else if (error.code === 'unavailable') {
        console.warn('Firebase service unavailable');
      } else if (error.code === 'unauthenticated') {
        console.warn('Firebase unauthenticated - retrying authentication');
      }
      
      throw error;
    }
  };
};

// =============================================================================
// LAZY LOADED FIREBASE FUNCTIONS
// =============================================================================

/**
 * Lazy Firebase Auth functions - only load when needed
 */
export const lazyFirebaseAuth = {
  // Get auth instance
  getAuth: async () => {
    return await initializeFirebaseAuth();
  },
  
  // Sign in anonymously
  signInAnonymously: createLazyFirebaseOperation(
    async () => {
      const auth = await initializeFirebaseAuth();
      const { signInAnonymously } = await import('firebase/auth');
      return { signInAnonymously: (authInstance) => signInAnonymously(authInstance || auth) };
    },
    'signInAnonymously'
  ),
  
  // Auth state listener
  onAuthStateChanged: createLazyFirebaseOperation(
    async () => {
      const auth = await initializeFirebaseAuth();
      const { onAuthStateChanged } = await import('firebase/auth');
      return { onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback) };
    },
    'onAuthStateChanged'
  ),
  
  // Get ID token
  getIdToken: createLazyFirebaseOperation(
    async () => {
      const { getIdToken } = await import('firebase/auth');
      return { getIdToken };
    },
    'getIdToken'
  )
};

/**
 * Lazy Firebase Firestore functions - only essential operations
 */
export const lazyFirebaseFirestore = {
  // Get Firestore instance
  getFirestore: async () => {
    return await initializeFirebaseFirestore();
  },
  
  // Document operations
  doc: createLazyFirebaseOperation(
    async () => {
      const db = await initializeFirebaseFirestore();
      const { doc } = await import('firebase/firestore');
      return { doc: (...args) => doc(db, ...args) };
    },
    'doc'
  ),
  
  getDoc: createLazyFirebaseOperation(
    async () => {
      const { getDoc } = await import('firebase/firestore');
      return { getDoc };
    },
    'getDoc'
  ),
  
  setDoc: createLazyFirebaseOperation(
    async () => {
      const { setDoc } = await import('firebase/firestore');
      return { setDoc };
    },
    'setDoc'
  ),
  
  updateDoc: createLazyFirebaseOperation(
    async () => {
      const { updateDoc } = await import('firebase/firestore');
      return { updateDoc };
    },
    'updateDoc'
  ),
  
  // Server utilities
  serverTimestamp: createLazyFirebaseOperation(
    async () => {
      const { serverTimestamp } = await import('firebase/firestore');
      return { serverTimestamp };
    },
    'serverTimestamp'
  ),
  
  increment: createLazyFirebaseOperation(
    async () => {
      const { increment } = await import('firebase/firestore');
      return { increment };
    },
    'increment'
  )
};

// =============================================================================
// COMPATIBILITY LAYER FOR EXISTING CODE
// =============================================================================

/**
 * Legacy compatibility - these will be lazily initialized
 * This allows existing code to work while lazy loading happens in background
 */
let legacyAuth = null;
let legacyDb = null;

// Lazy getter for auth (maintains existing import pattern)
Object.defineProperty(globalThis, 'auth', {
  get: async () => {
    if (!legacyAuth) {
      legacyAuth = await initializeFirebaseAuth();
    }
    return legacyAuth;
  },
  configurable: true
});

// Lazy getter for db (maintains existing import pattern)
Object.defineProperty(globalThis, 'db', {
  get: async () => {
    if (!legacyDb) {
      legacyDb = await initializeFirebaseFirestore();
    }
    return legacyDb;
  },
  configurable: true
});

// =============================================================================
// EXPORTS - LAZY LOADED
// =============================================================================

/**
 * Main exports - these will lazy load Firebase when accessed
 */
export const auth = {
  get current() {
    return legacyAuth;
  },
  async initialize() {
    legacyAuth = await initializeFirebaseAuth();
    return legacyAuth;
  }
};

export const db = {
  get current() {
    return legacyDb;
  },
  async initialize() {
    legacyDb = await initializeFirebaseFirestore();
    return legacyDb;
  }
};

/**
 * Safe operation wrapper for backward compatibility
 */
export const safeFirestoreOperation = async (operation, fallback = null) => {
  try {
    const dbInstance = await initializeFirebaseFirestore();
    return await operation(dbInstance);
  } catch (error) {
    console.error('Firestore operation failed:', error);
    return fallback;
  }
};

/**
 * Preload Firebase modules (called from app initialization)
 */
export const preloadFirebase = () => {
  // Only preload if user has good connection
  if (navigator.connection?.effectiveType !== 'slow-2g') {
    // Preload Firebase core after idle
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        initializeFirebaseApp().catch(() => {});
      });
    }
  }
};

/**
 * Check if Firebase is available without initializing
 */
export const isFirebaseConfigured = () => {
  return getFirebaseConfig() !== null;
};

// Export default app (will be null until initialized)
export default firebaseApp;