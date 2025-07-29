// =============================================================================
// FIXED AUTHCONTEXT - STATIC IMPORTS FOR CRITICAL AUTH
// File: frontend/src/components/AuthContext.jsx - REPLACE EXISTING
// =============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// =============================================================================
// STATIC FIREBASE IMPORTS FOR CRITICAL AUTH PATH
// =============================================================================

// Import Firebase statically since auth is critical for app functionality
import { auth, db, safeFirestoreOperation } from '../firebase/firebase';

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
// OPTIMIZED AUTH PROVIDER - NO LAZY LOADING FOR CRITICAL PATH
// =============================================================================

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false);

  // =============================================================================
  // FIREBASE AVAILABILITY CHECK
  // =============================================================================

  /**
   * Check if Firebase is available without lazy loading
   */
  useEffect(() => {
    const checkFirebaseAvailability = () => {
      try {
        if (auth && db) {
          setIsFirebaseAvailable(true);
          console.log('✅ Firebase services available');
        } else {
          setIsFirebaseAvailable(false);
          console.warn('⚠️ Firebase services not available, running in offline mode');
        }
      } catch (error) {
        console.error('❌ Firebase availability check failed:', error);
        setIsFirebaseAvailable(false);
      }
    };

    checkFirebaseAvailability();
  }, []);

  // =============================================================================
  // USER INITIALIZATION
  // =============================================================================

  /**
   * Initialize user in Firestore
   */
  const initializeUser = useCallback(async (user) => {
    if (!user) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      // Only initialize Firestore if Firebase is available
      if (isFirebaseAvailable && db) {
        await safeFirestoreOperation(async () => {
          // Dynamically import Firestore functions only when needed
          const { doc, getDoc, setDoc } = await import('firebase/firestore');
          
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              usageCount: 0,
              isPro: false,
              createdAt: new Date(),
              lastLogin: new Date()
            });
            console.log('✅ New user initialized in Firestore');
          } else {
            // Update last login
            await setDoc(userRef, {
              lastLogin: new Date()
            }, { merge: true });
            console.log('✅ User login updated in Firestore');
          }
        });
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
   * Setup authentication listener
   */
  useEffect(() => {
    let unsubscribe = () => {};
    let mounted = true;

    const setupAuthentication = async () => {
      try {
        if (!isFirebaseAvailable || !auth) {
          console.warn('⚠️ Firebase Auth not available, skipping authentication');
          if (mounted) setLoading(false);
          return;
        }

        // Dynamically import auth functions only when needed
        const { onAuthStateChanged, signInAnonymously } = await import('firebase/auth');
        
        // Setup auth state listener
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!mounted) return;
          
          try {
            if (user) {
              console.log('✅ User authenticated:', user.uid);
              await initializeUser(user);
            } else {
              console.log('👤 No user authenticated, attempting anonymous sign-in');
              
              try {
                // Attempt anonymous sign-in
                const result = await signInAnonymously(auth);
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
  }, [isFirebaseAvailable, initializeUser]);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Retry Firebase connection
   */
  const retryConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (auth) {
        const { signInAnonymously } = await import('firebase/auth');
        const result = await signInAnonymously(auth);
        await initializeUser(result.user);
      } else {
        setError('Firebase services still not available');
        setLoading(false);
      }
    } catch (error) {
      setError(`Retry failed: ${error.message}`);
      setLoading(false);
    }
  }, [initializeUser]);

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
          <p className="text-white text-lg">Initializing Authentication...</p>
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
          <div className="mt-4 text-gray-400 text-sm">
            Firebase Status: {isFirebaseAvailable ? '✅ Available' : '⏳ Checking...'}
          </div>
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