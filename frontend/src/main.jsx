// =============================================================================
// FIXED MAIN.JSX - PRODUCTION READY WITH STATIC IMPORTS
// File: frontend/src/main.jsx - REPLACE EXISTING
// =============================================================================

import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
// LAZY LOADED COMPONENTS - SPLIT BY USAGE PATTERN
// =============================================================================

/**
 * Core App component - loads main functionality
 */
const LazyApp = lazy(() => import('./App.jsx'));

/**
 * AuthProvider - loads Firebase auth when needed
 */
const LazyAuthProvider = lazy(() => 
  import('./components/AuthContext').then(module => ({
    default: ({ children }) => {
      const AuthProvider = module.AuthProvider;
      return <AuthProvider>{children}</AuthProvider>;
    }
  }))
);

/**
 * Legal pages - lazy loaded on navigation
 */
const LazyPrivacyPage = lazy(() => import('./pages/Privacy.jsx'));
const LazyTermsPage = lazy(() => import('./pages/Terms.jsx'));
const LazyNotFoundPage = lazy(() => import('./pages/NotFound.jsx'));

// =============================================================================
// ROUTER COMPONENT - STATIC IMPORTS, LAZY PAGES
// =============================================================================

/**
 * App Router with lazy loaded pages (not lazy router itself)
 */
const AppRouter = ({ children }) => {
  return (
    <Router>
      <Routes>
        {/* Main Application Route - loads immediately */}
        <Route path="/" element={<LazyApp />} />
        
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
// PROGRESSIVE ENHANCEMENT STRATEGY
// =============================================================================

/**
 * App Shell component that loads critical functionality first
 */
const AppShell = () => {
  return (
    <StrictMode>
      {/* Level 1: Critical Loading - Router Structure (Static) */}
      <AppRouter>
        {/* Level 2: Authentication - Lazy loaded */}
        <Suspense fallback={<CriticalLoading />}>
          <LazyAuthProvider>
            {/* App content loaded via routes */}
          </LazyAuthProvider>
        </Suspense>
      </AppRouter>
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
  // Monitor Core Web Vitals
  if (import.meta.env.PROD) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    }).catch(() => {});
  }
  
  // Monitor bundle loading performance
  if (performance.mark) {
    performance.mark('app-start');
    window.addEventListener('load', () => {
      performance.mark('app-loaded');
      performance.measure('app-load-time', 'app-start', 'app-loaded');
    });
  }
};

// =============================================================================
// APPLICATION INITIALIZATION
// =============================================================================

/**
 * Initialize the React application with progressive loading
 */
const initializeApp = () => {
  const root = createRoot(document.getElementById('root'));
  
  // Render app shell immediately
  root.render(<AppShell />);
  
  // Setup performance monitoring
  if (import.meta.env.PROD) {
    initPerformanceMonitoring();
  }
  
  // Preload non-critical chunks
  setTimeout(preloadCriticalChunks, 1000);
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

// =============================================================================
// APP INITIALIZATION
// =============================================================================

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}