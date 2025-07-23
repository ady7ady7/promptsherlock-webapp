// =============================================================================
// FIXED AUTHCONTEXT WITH COMPREHENSIVE ERROR HANDLING
// File: frontend/src/components/AuthContext.jsx
// =============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false);

  // Check Firebase availability
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

  // Safe Firestore operations
  const safeFirestoreOperation = async (operation, fallback = null) => {
    if (!isFirebaseAvailable || !db) {
      console.warn('Firestore not available, skipping operation');
      return fallback;
    }

    try {
      return await operation();
    } catch (error) {
      console.error('Firestore operation failed:', error);
      setError(`Firestore error: ${error.message}`);
      return fallback;
    }
  };

  // Initialize user in Firestore
  const initializeUser = async (user) => {
    try {
      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      // Attempt to initialize user in Firestore
      await safeFirestoreOperation(async () => {
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

      setCurrentUser(user);
      setError(null);
    } catch (error) {
      console.error('❌ User initialization failed:', error);
      setError(`Authentication error: ${error.message}`);
      setCurrentUser(user); // Set user anyway for offline functionality
    } finally {
      setLoading(false);
    }
  };

  // Handle authentication state changes
  useEffect(() => {
    let unsubscribe = () => {};

    const setupAuth = async () => {
      try {
        if (!isFirebaseAvailable || !auth) {
          console.warn('⚠️ Firebase Auth not available, skipping authentication');
          setLoading(false);
          return;
        }

        // Listen for authentication state changes
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          try {
            if (user) {
              console.log('✅ User authenticated:', user.uid);
              await initializeUser(user);
            } else {
              console.log('👤 No user authenticated, attempting anonymous sign-in');
              
              // Attempt anonymous sign-in
              try {
                const anonymousUser = await signInAnonymously(auth);
                console.log('✅ Anonymous user created:', anonymousUser.user.uid);
                await initializeUser(anonymousUser.user);
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
            setLoading(false);
          }
        });

        console.log('✅ Auth state listener established');
      } catch (error) {
        console.error('❌ Auth setup failed:', error);
        setError(`Firebase setup failed: ${error.message}`);
        setLoading(false);
      }
    };

    setupAuth();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log('🧹 Auth listener cleaned up');
      }
    };
  }, [isFirebaseAvailable]);

  // Retry Firebase connection
  const retryConnection = async () => {
    setLoading(true);
    setError(null);
    
    // Re-check Firebase availability
    if (auth && db) {
      setIsFirebaseAvailable(true);
      try {
        const anonymousUser = await signInAnonymously(auth);
        await initializeUser(anonymousUser.user);
      } catch (error) {
        setError(`Retry failed: ${error.message}`);
        setLoading(false);
      }
    } else {
      setError('Firebase services still not available');
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    isFirebaseAvailable,
    retryConnection,
    clearError
  };

  // Show error boundary for critical Firebase errors
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

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      {loading && (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Initializing Firebase...</p>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};