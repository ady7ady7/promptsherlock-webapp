// =============================================================================
// OPTIMIZED MAIN.JSX WITH PROGRESSIVE LAZY LOADING
// File: frontend/src/main.jsx - REPLACE EXISTING
// =============================================================================

import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
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
 * Router loading component - lighter than full page loader
 */
const RouterLoading = () => (
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
 * This includes the home page and analysis form
 */
const LazyApp = lazy(() => import('./App.jsx'));

/**
 * AuthProvider - loads Firebase auth when needed
 * Wrapped in its own lazy loader to avoid loading full Firebase on initial load
 */
const LazyAuthProvider = lazy(() => 
  import('./components/AuthContext').then(module => ({
    default: ({ children }) => {
      // Only initialize Firebase when auth is actually needed
      const AuthProvider = module.AuthProvider;
      return <AuthProvider>{children}</AuthProvider>;
    }
  }))
);

/**
 * Router System - loads routing infrastructure
 * Split to avoid loading all routes immediately
 */
const LazyRouter = lazy(async () => {
  // Dynamic import of router components
  const [
    { BrowserRouter: Router, Routes, Route },
    { lazyComponents }
  ] = await Promise.all([
    import('react-router-dom'),
    import('./lazy/lazyLoaders')
  ]);
  
  return {
    default: function AppRouter({ children }) {
      return (
        <Router>
          <Routes>
            {/* Main Application Route - loads immediately */}
            <Route path="/" element={<LazyApp />} />
            
            {/* Legal Pages - lazy loaded on navigation */}
            <Route 
              path="/privacy" 
              element={<lazyComponents.Privacy />} 
            />
            <Route 
              path="/terms" 
              element={<lazyComponents.Terms />} 
            />
            
            {/* 404 Error Page - lazy loaded */}
            <Route 
              path="*" 
              element={<lazyComponents.NotFound />} 
            />
          </Routes>
        </Router>
      );
    }
  };
});

// =============================================================================
// PROGRESSIVE ENHANCEMENT STRATEGY
// =============================================================================

/**
 * App Shell component that loads critical functionality first
 * Then progressively enhances with additional features
 */
const AppShell = () => {
  return (
    <StrictMode>
      {/* Level 1: Critical Loading - App Structure */}
      <Suspense fallback={<CriticalLoading />}>
        {/* Level 2: Authentication - Lazy loaded */}
        <Suspense fallback={<CriticalLoading />}>
          <LazyAuthProvider>
            {/* Level 3: Routing - Lazy loaded */}
            <Suspense fallback={<RouterLoading />}>
              <LazyRouter />
            </Suspense>
          </LazyAuthProvider>
        </Suspense>
      </Suspense>
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
      
      // Preload router components for faster navigation
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
  if ('web-vitals' in window || window.webVitals) {
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

// =============================================================================
// APP INITIALIZATION
// =============================================================================

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}