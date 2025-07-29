// =============================================================================
// OPTIMIZED AUTHCONTEXT WITH LAZY FIREBASE LOADING
// File: frontend/src/components/AuthContext.jsx - REPLACE EXISTING
// =============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// =============================================================================
// LAZY FIREBASE IMPORTS - NO IMMEDIATE LOADING
// =============================================================================

// These will be loaded only when authentication is actually needed
let lazyAuth = null;
let lazyDb = null;
let firebaseModules = null;

/**
 * Lazy load Firebase modules only when needed
 */
const loadFirebaseModules = async () => {
  if (firebaseModules) return firebaseModules;
  
  try {
    // Dynamic imports - only load when actually needed
    const [
      { lazyFirebaseAuth, lazyFirebaseFirestore },
      { doc, getDoc, setDoc }
    ] = await Promise.all([
      import('../firebase/firebase'),
      import('firebase/firestore')
    ]);
    
    firebaseModules = {
      auth: lazyFirebaseAuth,
      firestore: lazyFirebaseFirestore,
      doc,
      getDoc,
      setDoc
    };
    
    console.log('✅ Firebase modules loaded lazily for authentication');
    return firebaseModules;
  } catch (error) {
    console.error('❌ Failed to load Firebase modules:', error);
    throw error;
  }
};

// =============================================================================
// AUTH CONTEXT SETUP
// =============================================================================

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// =============================================================================
// OPTIMIZED AUTH PROVIDER
// =============================================================================

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  // =============================================================================
  // LAZY FIREBASE INITIALIZATION
  // =============================================================================

  /**
   * Initialize Firebase only when authentication is needed
   */
  const initializeFirebase = useCallback(async () => {
    if (initializationAttempted) return isFirebaseAvailable;
    
    setInitializationAttempted(true);
    
    try {
      // Check if Firebase is configured before loading modules
      const { isFirebaseConfigured } = await import('../firebase/firebase');
      
      if (!isFirebaseConfigured()) {
        console.warn('⚠️ Firebase not configured, running in offline mode');
        setIsFirebaseAvailable(false);
        setLoading(false);
        return false;
      }
      
      // Load Firebase modules lazily
      const modules = await loadFirebaseModules();
      
      // Initialize auth
      lazyAuth = await modules.auth.getAuth();
      lazyDb = await modules.firestore.getFirestore();
      
      setIsFirebaseAvailable(true);
      console.log('✅ Firebase initialized lazily for authentication');
      return true;
    } catch (error) {
      console.error('❌ Firebase lazy initialization failed:', error);
      setError(`Firebase initialization failed: ${error.message}`);
      setIsFirebaseAvailable(false);
      setLoading(false);
      return false;
    }
  }, [initializationAttempted, isFirebaseAvailable]);

  // =============================================================================
  // USER INITIALIZATION
  // =============================================================================

  /**
   * Initialize user in Firestore with lazy loading
   */
  const initializeUser = useCallback(async (user) => {
    if (!user) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      // Only initialize Firestore if Firebase is available
      if (isFirebaseAvailable && lazyDb) {
        const modules = await loadFirebaseModules();
        
        // Create user document reference
        const userRef = await modules.firestore.doc('users', user.uid);
        const userSnap = await modules.firestore.getDoc(userRef);

        if (!(await userSnap.exists())) {
          await modules.firestore.setDoc(userRef, {
            usageCount: 0,
            isPro: false,
            createdAt: new Date(),
            lastLogin: new Date()
          });
          console.log('✅ New user initialized in Firestore');
        } else {
          // Update last login
          await modules.firestore.setDoc(userRef, {
            lastLogin: new Date()
          }, { merge: true });
          console.log('✅ User login updated in Firestore');
        }
      }

      setCurrentUser(user);
      setError(null);
    } catch (error) {
      console.error('❌ User initialization failed:', error);
      setError(`User initialization failed: ${error.message}`);
      // Set user anyway for offline functionality
      setCurrentUser(user);
    } finally {
      setLoading(false);
    }
  }, [isFirebaseAvailable]);

  // =============================================================================
  // AUTHENTICATION STATE MANAGEMENT
  // =============================================================================

  /**
   * Setup authentication listener with lazy loading
   */
  useEffect(() => {
    let unsubscribe = () => {};
    let mounted = true;

    const setupAuthentication = async () => {
      try {
        // Initialize Firebase lazily
        const firebaseReady = await initializeFirebase();
        
        if (!firebaseReady || !mounted) {
          if (mounted) setLoading(false);
          return;
        }

        // Load auth modules
        const modules = await loadFirebaseModules();
        
        // Setup auth state listener
        unsubscribe = await modules.auth.onAuthStateChanged(async (user) => {
          if (!mounted) return;
          
          try {
            if (user) {
              console.log('✅ User authenticated:', user.uid);
              await initializeUser(user);
            } else {
              console.log('👤 No user authenticated, attempting anonymous sign-in');
              
              try {
                // Attempt anonymous sign-in
                const authInstance = await modules.auth.getAuth();
                const result = await modules.auth.signInAnonymously(authInstance);
                console.log('✅ Anonymous user created:', result.user.uid);
                await initializeUser(result.user);
              } catch (anonError) {
                console.error('❌ Anonymous sign-in failed:', anonError);
                setError(`Authentication failed: ${anonError.message}`);
                setCurrentUser(null);
                setLoading(false);
              }
            }
          } catch (error) {
            console.error('❌ Auth state change handler failed:', error);
            setError(`Authentication error: ${error.message}`);
            if (mounted) setLoading(false);
          }
        });

        console.log('✅ Auth state listener established');
      } catch (error) {
        console.error('❌ Authentication setup failed:', error);
        setError(`Firebase setup failed: ${error.message}`);
        if (mounted) setLoading(false);
      }
    };

    // Start authentication setup
    setupAuthentication();

    // Cleanup function
    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
        console.log('🧹 Auth listener cleaned up');
      }
    };
  }, []); // Empty dependency array - only run once

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Retry Firebase connection
   */
  const retryConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInitializationAttempted(false); // Reset to allow retry
    
    try {
      const firebaseReady = await initializeFirebase();
      
      if (firebaseReady) {
        const modules = await loadFirebaseModules();
        const authInstance = await modules.auth.getAuth();
        const result = await modules.auth.signInAnonymously(authInstance);
        await initializeUser(result.user);
      } else {
        setError('Firebase services still not available');
        setLoading(false);
      }
    } catch (error) {
      setError(`Retry failed: ${error.message}`);
      setLoading(false);
    }
  }, [initializeFirebase, initializeUser]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const value = {
    currentUser,
    loading,
    error,
    isFirebaseAvailable,
    retryConnection,
    clearError
  };

  // =============================================================================
  // ERROR BOUNDARY COMPONENT
  // =============================================================================

  /**
   * Error boundary for critical Firebase errors
   */
  if (error && !currentUser && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center p-4">
        <div className="glass-effect p-8 rounded-xl max-w-md w-full text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Firebase Connection Error</h2>
          <p className="text-gray-300 mb-4 text-sm">{error}</p>
          <div className="space-y-3">
            <button
              onClick={retryConnection}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Retry Connection
            </button>
            <button
              onClick={() => {
                setError(null);
                setCurrentUser({ uid: 'offline-user', isAnonymous: true });
                setLoading(false);
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Continue Offline
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            App functionality may be limited without Firebase connection
          </p>
        </div>
      </div>
    );
  }

  // =============================================================================
  // LOADING STATE COMPONENT
  // =============================================================================

  /**
   * Loading state with Firebase initialization progress
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">
            {initializationAttempted ? 'Initializing Authentication...' : 'Loading App...'}
          </p>
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};