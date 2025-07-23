// =============================================================================
// FIREBASE INTEGRATION WRAPPER
// File: frontend/src/utils/firebaseIntegration.js
// =============================================================================

import { useFirebase } from '../hooks/useFirebase.js';
import { useEffect } from 'react';

/**
 * Firebase Integration Wrapper Hook
 * Minimal integration that doesn't interfere with existing app logic
 */
export function useFirebaseIntegration() {
  const {
    isInitialized,
    trackEvent,
    trackPageView,
    trackSessionStart,
    trackUserInteraction,
    trackError,
    logError
  } = useFirebase();

  // Initialize Firebase tracking when ready
  useEffect(() => {
    if (isInitialized) {
      trackSessionStart();
      trackPageView('/');
      trackEvent('app_loaded', {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent
      });
    }
  }, [isInitialized, trackSessionStart, trackPageView, trackEvent]);

  // Simple wrapper functions that match your existing patterns
  const analytics = {
    // Track when analysis form is used
    trackAnalysisStart: (imageCount, hasCustomPrompt) => {
      trackUserInteraction('analysis_started', {
        image_count: imageCount,
        has_custom_prompt: hasCustomPrompt
      });
    },

    // Track when analysis completes
    trackAnalysisComplete: (success, imageCount, duration) => {
      trackUserInteraction('analysis_completed', {
        success,
        image_count: imageCount,
        duration_ms: duration
      });
    },

    // Track feature usage
    trackFeatureUsed: (featureName, data = {}) => {
      trackUserInteraction('feature_used', {
        feature: featureName,
        ...data
      });
    },

    // Track errors without interfering with existing error handling
    trackAppError: (error, context = '') => {
      trackError(error, { context, component: 'App' });
    }
  };

  // Error boundary integration
  const handleError = (error, errorInfo) => {
    logError(error, errorInfo);
    // Don't interfere with existing error handling
    return error;
  };

  return {
    analytics,
    handleError,
    isFirebaseReady: isInitialized
  };
}