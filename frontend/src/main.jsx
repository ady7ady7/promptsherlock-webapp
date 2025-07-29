// =============================================================================
// FIXED MAIN.JSX - CORRECTED AUTHPROVIDER HIERARCHY
// File: frontend/src/main.jsx - REPLACE EXISTING
// =============================================================================

import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext'; // STATIC IMPORT FOR CRITICAL AUTH
import './index.css';

// =============================================================================
// LOADING COMPONENTS - LOADED IMMEDIATELY
// =============================================================================

/**
 * Critical loading component for initial app shell
 */
const CriticalLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-white text-lg">Initializing App...</p>
    </div>
  </div>
);

/**
 * Page loading component - for lazy loaded pages
 */
const PageLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-blue-500/20 rounded mx-auto mb-4"></div>
        <div className="h-4 w-32 bg-blue-500/10 rounded mx-auto"></div>
      </div>
    </div>
  </div>
);

// =============================================================================
// LAZY LOADED COMPONENTS - ONLY NON-CRITICAL COMPONENTS
// =============================================================================

/**
 * Core App component - loads main functionality
 * This needs AuthProvider to be available, so AuthProvider must be static
 */
const LazyApp = lazy(() => import('./App.jsx'));

/**
 * Legal pages - lazy loaded on navigation
 */
const LazyPrivacyPage = lazy(() => import('./pages/Privacy.jsx'));
const LazyTermsPage = lazy(() => import('./pages/Terms.jsx'));
const LazyNotFoundPage = lazy(() => import('./pages/NotFound.jsx'));

// =============================================================================
// ROUTER COMPONENT - STATIC IMPORTS FOR CRITICAL PATH
// =============================================================================

/**
 * App Router with lazy loaded pages
 */
const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Main Application Route - loads immediately */}
        <Route 
          path="/" 
          element={
            <Suspense fallback={<CriticalLoading />}>
              <LazyApp />
            </Suspense>
          } 
        />
        
        {/* Legal Pages - lazy loaded on navigation */}
        <Route 
          path="/privacy" 
          element={
            <Suspense fallback={<PageLoading />}>
              <LazyPrivacyPage />
            </Suspense>
          } 
        />
        <Route 
          path="/terms" 
          element={
            <Suspense fallback={<PageLoading />}>
              <LazyTermsPage />
            </Suspense>
          } 
        />
        
        {/* 404 Error Page - lazy loaded */}
        <Route 
          path="*" 
          element={
            <Suspense fallback={<PageLoading />}>
              <LazyNotFoundPage />
            </Suspense>
          } 
        />
      </Routes>
    </Router>
  );
};

// =============================================================================
// APP SHELL - CORRECT COMPONENT HIERARCHY
// =============================================================================

/**
 * App Shell component with correct provider hierarchy
 * AuthProvider MUST wrap all components that use useAuth
 */
const AppShell = () => {
  return (
    <StrictMode>
      {/* Level 1: Authentication Provider - STATIC IMPORT (Critical) */}
      <AuthProvider>
        {/* Level 2: Router - Static import but lazy loaded routes */}
        <AppRouter />
      </AuthProvider>
    </StrictMode>
  );
};

// =============================================================================
// PERFORMANCE OPTIMIZATIONS
// =============================================================================

/**
 * Preload critical chunks after initial load
 */
const preloadCriticalChunks = () => {
  // Only preload if browser supports idle callbacks and user has good connection
  if (window.requestIdleCallback && navigator.connection?.effectiveType !== 'slow-2g') {
    window.requestIdleCallback(() => {
      // Preload Framer Motion for interactions
      import('framer-motion').catch(() => {});
      
      // Preload pages for faster navigation
      Promise.allSettled([
        import('./pages/Privacy.jsx'),
        import('./pages/Terms.jsx')
      ]).catch(() => {});
    });
  }
};

/**
 * Initialize performance monitoring
 */
const initPerformanceMonitoring = () => {
  // Monitor Core Web Vitals only in production
  if (import.meta.env.PROD) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => console.log('CLS:', metric));
      getFID((metric) => console.log('FID:', metric));
      getFCP((metric) => console.log('FCP:', metric));
      getLCP((metric) => console.log('LCP:', metric));
      getTTFB((metric) => console.log('TTFB:', metric));
    }).catch(() => {});
  }
  
  // Monitor bundle loading performance
  if (performance.mark) {
    performance.mark('app-start');
    window.addEventListener('load', () => {
      performance.mark('app-loaded');
      performance.measure('app-load-time', 'app-start', 'app-loaded');
      
      if (import.meta.env.DEV) {
        const measure = performance.getEntriesByName('app-load-time')[0];
        console.log('📊 App load time:', measure.duration + 'ms');
      }
    });
  }
};

// =============================================================================
// APPLICATION INITIALIZATION
// =============================================================================

/**
 * Initialize the React application
 */
const initializeApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Root element not found! Make sure index.html has <div id="root"></div>');
    return;
  }
  
  const root = createRoot(rootElement);
  
  // Render app shell immediately
  root.render(<AppShell />);
  
  // Setup performance monitoring
  if (import.meta.env.PROD) {
    initPerformanceMonitoring();
  }
  
  // Preload non-critical chunks after a delay
  setTimeout(preloadCriticalChunks, 1000);
  
  console.log('✅ App initialized successfully');
};

// =============================================================================
// ERROR HANDLING FOR CHUNK LOADING FAILURES
// =============================================================================

/**
 * Handle chunk loading errors (network issues, cache problems)
 */
window.addEventListener('error', (event) => {
  const isChunkError = event.message.includes('Loading chunk') || 
                      event.message.includes('ChunkLoadError');
  
  if (isChunkError) {
    console.warn('Chunk loading failed, attempting to reload:', event.message);
    // Attempt to reload the page once
    if (!sessionStorage.getItem('chunk-reload-attempted')) {
      sessionStorage.setItem('chunk-reload-attempted', 'true');
      window.location.reload();
    }
  }
});

/**
 * Handle dynamic import errors
 */
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('Failed to fetch dynamically imported module')) {
    console.warn('Dynamic import failed:', event.reason.message);
    // Let React's error boundaries handle this
    event.preventDefault();
  }
});

/**
 * Handle AuthProvider errors specifically
 */
window.addEventListener('error', (event) => {
  if (event.message.includes('useAuth must be used within an AuthProvider')) {
    console.error('🚨 CRITICAL: AuthProvider not properly initialized!');
    console.error('This usually means AuthProvider is not wrapping the component that uses useAuth');
    // You could implement a fallback here if needed
  }
});

// =============================================================================
// APP INITIALIZATION
// =============================================================================

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}