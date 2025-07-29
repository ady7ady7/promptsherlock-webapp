// =============================================================================
// LAZY LOADING UTILITIES
// File: frontend/src/lazy/lazyLoaders.js - CREATE NEW FILE
// =============================================================================

import { lazy, Suspense } from 'react';

// =============================================================================
// LOADING FALLBACK COMPONENTS
// =============================================================================

/**
 * Minimal loading spinner for critical components
 */
const MinimalSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

/**
 * Loading placeholder for motion components
 */
const MotionLoading = () => (
  <div className="opacity-50 transition-opacity duration-300">
    <MinimalSpinner />
  </div>
);

/**
 * Loading placeholder for pages
 */
const PageLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

// =============================================================================
// LAZY LOADING WRAPPER FUNCTIONS
// =============================================================================

/**
 * Create a lazy component with retry logic and error boundary
 */
export const createLazyComponent = (importFunc, fallback = MinimalSpinner) => {
  const LazyComponent = lazy(() => 
    importFunc().catch(error => {
      console.error('Lazy loading failed:', error);
      // Retry after delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(importFunc());
        }, 1000);
      });
    })
  );
  
  return function LazyWrapper(props) {
    return (
      <Suspense fallback={<fallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
};

/**
 * Create a lazy loader for heavy libraries with progressive loading
 */
export const createProgressiveLazyLoader = (importFunc, preloadCondition) => {
  let cachedModule = null;
  let loading = false;
  
  const loadModule = async () => {
    if (cachedModule) return cachedModule;
    if (loading) return new Promise(resolve => {
      const check = () => {
        if (cachedModule) resolve(cachedModule);
        else setTimeout(check, 50);
      };
      check();
    });
    
    loading = true;
    try {
      cachedModule = await importFunc();
      loading = false;
      return cachedModule;
    } catch (error) {
      loading = false;
      throw error;
    }
  };
  
  // Preload if condition is met
  if (preloadCondition && preloadCondition()) {
    loadModule().catch(console.error);
  }
  
  return {
    load: loadModule,
    preload: () => loadModule().catch(console.error)
  };
};

// =============================================================================
// SPECIFIC LAZY LOADERS FOR YOUR APP
// =============================================================================

/**
 * Lazy load Framer Motion components
 */
export const LazyFramerMotion = createProgressiveLazyLoader(
  () => import('framer-motion'),
  () => window.requestIdleCallback !== undefined // Preload if browser supports idle callbacks
);

/**
 * Lazy load Axios for form submissions
 */
export const LazyAxios = createProgressiveLazyLoader(
  () => import('axios'),
  () => false // Only load when actually needed
);

/**
 * Lazy load Firebase Auth
 */
export const LazyFirebaseAuth = createProgressiveLazyLoader(
  async () => {
    const { getAuth, signInAnonymously, onAuthStateChanged } = await import('firebase/auth');
    return { getAuth, signInAnonymously, onAuthStateChanged };
  },
  () => document.readyState === 'complete' // Preload after page is fully loaded
);

/**
 * Lazy load Firebase Firestore (only essential functions)
 */
export const LazyFirebaseFirestore = createProgressiveLazyLoader(
  async () => {
    const { getFirestore, doc, getDoc, setDoc } = await import('firebase/firestore');
    return { getFirestore, doc, getDoc, setDoc };
  },
  () => false // Only load when needed for user operations
);

// =============================================================================
// LAZY LOADED PAGES
// =============================================================================

/**
 * Lazy load Privacy page
 */
export const LazyPrivacyPage = createLazyComponent(
  () => import('../pages/Privacy.jsx'),
  PageLoading
);

/**
 * Lazy load Terms page  
 */
export const LazyTermsPage = createLazyComponent(
  () => import('../pages/Terms.jsx'),
  PageLoading
);

/**
 * Lazy load 404 page
 */
export const LazyNotFoundPage = createLazyComponent(
  () => import('../pages/NotFound.jsx'),
  PageLoading
);

// =============================================================================
// COMPONENT-SPECIFIC LAZY LOADERS
// =============================================================================

/**
 * Lazy Motion wrapper that loads Framer Motion on first interaction
 */
export const LazyMotionWrapper = ({ children, fallback, ...motionProps }) => {
  const [MotionComponent, setMotionComponent] = useState(null);
  const [isInteracted, setIsInteracted] = useState(false);
  
  useEffect(() => {
    if (isInteracted && !MotionComponent) {
      LazyFramerMotion.load().then(({ motion }) => {
        setMotionComponent(() => motion.div);
      });
    }
  }, [isInteracted, MotionComponent]);
  
  const handleInteraction = useCallback(() => {
    setIsInteracted(true);
  }, []);
  
  if (!MotionComponent) {
    return (
      <div 
        {...motionProps}
        onMouseEnter={handleInteraction}
        onFocus={handleInteraction}
        onClick={handleInteraction}
      >
        {children}
      </div>
    );
  }
  
  return (
    <MotionComponent {...motionProps}>
      {children}
    </MotionComponent>
  );
};

/**
 * Lazy AnimatePresence wrapper
 */
export const LazyAnimatePresence = ({ children, ...props }) => {
  const [AnimatePresence, setAnimatePresence] = useState(null);
  
  useEffect(() => {
    LazyFramerMotion.load().then(({ AnimatePresence: AP }) => {
      setAnimatePresence(() => AP);
    });
  }, []);
  
  if (!AnimatePresence) {
    return <>{children}</>;
  }
  
  return (
    <AnimatePresence {...props}>
      {children}
    </AnimatePresence>
  );
};

// =============================================================================
// EXPORT COLLECTIONS
// =============================================================================

export const lazyLoaders = {
  framerMotion: LazyFramerMotion,
  axios: LazyAxios,
  firebaseAuth: LazyFirebaseAuth,
  firebaseFirestore: LazyFirebaseFirestore
};

export const lazyComponents = {
  Privacy: LazyPrivacyPage,
  Terms: LazyTermsPage,
  NotFound: LazyNotFoundPage
};

export const lazyWrappers = {
  Motion: LazyMotionWrapper,
  AnimatePresence: LazyAnimatePresence
};