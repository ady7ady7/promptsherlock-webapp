// =============================================================================
// FIREBASE ANALYTICS & TRACKING HOOK
// File: frontend/src/hooks/useFirebase.js
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

/**
 * Firebase Integration Hook
 * Provides analytics and error tracking capabilities
 */
export function useFirebase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState(null);

  // Initialize Firebase connection
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Check if Firebase is available and configured
        if (auth && db) {
          setIsInitialized(true);
          console.log('✅ Firebase hook initialized');
        } else {
          console.warn('⚠️ Firebase not properly configured');
          setIsInitialized(false);
        }
      } catch (error) {
        console.error('❌ Firebase hook initialization failed:', error);
        setIsInitialized(false);
      }
    };

    initializeFirebase();
  }, []);

  // Track user authentication state
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
    });

    return unsubscribe;
  }, []);

  // Safe Firestore operation wrapper
  const safeFirestoreOperation = useCallback(async (operation) => {
    if (!isInitialized || !db) {
      console.warn('Firebase not initialized, skipping operation');
      return null;
    }

    try {
      return await operation();
    } catch (error) {
      console.error('Firestore operation failed:', error);
      return null;
    }
  }, [isInitialized]);

  // Track events
  const trackEvent = useCallback(async (eventName, eventData = {}) => {
    return safeFirestoreOperation(async () => {
      if (!user) return;

      const eventDoc = doc(db, 'analytics', 'events');
      await setDoc(eventDoc, {
        [eventName]: increment(1),
        lastUpdated: serverTimestamp()
      }, { merge: true });

      console.log(`📊 Event tracked: ${eventName}`, eventData);
    });
  }, [user, safeFirestoreOperation]);

  // Track page views
  const trackPageView = useCallback(async (pagePath) => {
    return safeFirestoreOperation(async () => {
      if (!user) return;

      const pageDoc = doc(db, 'analytics', 'pageviews');
      await setDoc(pageDoc, {
        [pagePath]: increment(1),
        lastUpdated: serverTimestamp()
      }, { merge: true });

      console.log(`📄 Page view tracked: ${pagePath}`);
    });
  }, [user, safeFirestoreOperation]);

  // Track session start
  const trackSessionStart = useCallback(async () => {
    return safeFirestoreOperation(async () => {
      if (!user) return;

      const sessionDoc = doc(db, 'analytics', 'sessions');
      await setDoc(sessionDoc, {
        total: increment(1),
        lastSession: serverTimestamp()
      }, { merge: true });

      console.log('🚀 Session started');
    });
  }, [user, safeFirestoreOperation]);

  // Track user interactions
  const trackUserInteraction = useCallback(async (interactionType, data = {}) => {
    return safeFirestoreOperation(async () => {
      if (!user) return;

      const interactionDoc = doc(db, 'analytics', 'interactions');
      await setDoc(interactionDoc, {
        [interactionType]: increment(1),
        lastUpdated: serverTimestamp()
      }, { merge: true });

      console.log(`👆 Interaction tracked: ${interactionType}`, data);
    });
  }, [user, safeFirestoreOperation]);

  // Track errors
  const trackError = useCallback(async (error, context = {}) => {
    return safeFirestoreOperation(async () => {
      const errorDoc = doc(db, 'analytics', 'errors');
      await setDoc(errorDoc, {
        total: increment(1),
        lastError: {
          message: error.message || 'Unknown error',
          timestamp: serverTimestamp(),
          context
        }
      }, { merge: true });

      console.error('🐛 Error tracked:', error, context);
    });
  }, [safeFirestoreOperation]);

  // Log errors (development only)
  const logError = useCallback((error, errorInfo = {}) => {
    if (import.meta.env.DEV) {
      console.group('🐛 Error Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }

    // Track in production
    if (import.meta.env.PROD) {
      trackError(error, errorInfo);
    }
  }, [trackError]);

  return {
    isInitialized,
    user,
    trackEvent,
    trackPageView,
    trackSessionStart,
    trackUserInteraction,
    trackError,
    logError
  };
}