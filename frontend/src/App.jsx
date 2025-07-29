// =============================================================================
// OPTIMIZED APP.JSX WITH LAZY FRAMER MOTION LOADING
// File: frontend/src/App.jsx - REPLACE EXISTING
// =============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Search, 
  Zap, 
  Shield, 
  Brain, 
  Heart, 
  Sparkles,
  Eye,
  Clock,
  Users,
  Palette,
  Wand2,
  Target,
  Lightbulb
} from 'lucide-react';

// Import components (these are lightweight)
import AnalysisForm from './components/AnalysisForm';
import Navigation from './components/Navigation';
import { useAuth } from './components/AuthContext';

// =============================================================================
// LAZY MOTION LOADING STRATEGY
// =============================================================================

/**
 * Lazy load Framer Motion modules when user interacts
 */
let motionModules = null;
let motionLoadingPromise = null;

const loadFramerMotion = async () => {
  if (motionModules) return motionModules;
  if (motionLoadingPromise) return motionLoadingPromise;
  
  motionLoadingPromise = (async () => {
    try {
      console.log('🎬 Loading Framer Motion for animations...');
      const { motion, useMotionValue, useTransform } = await import('framer-motion');
      
      motionModules = {
        motion,
        useMotionValue,
        useTransform
      };
      
      console.log('✅ Framer Motion loaded successfully');
      return motionModules;
    } catch (error) {
      console.error('❌ Failed to load Framer Motion:', error);
      // Fallback to plain HTML elements
      motionModules = {
        motion: {
          div: 'div',
          header: 'header',
          main: 'main',
          footer: 'footer',
          h1: 'h1',
          p: 'p',
          button: 'button'
        },
        useMotionValue: () => ({ get: () => 0, set: () => {}, onChange: () => () => {} }),
        useTransform: () => 0
      };
      return motionModules;
    }
  })();
  
  return motionLoadingPromise;
};

// =============================================================================
// LAZY MOTION WRAPPER COMPONENTS
// =============================================================================

/**
 * Lazy motion wrapper that loads Framer Motion on interaction
 */
const LazyMotion = ({ 
  component = 'div', 
  children, 
  className, 
  variants,
  initial,
  animate,
  whileHover,
  whileTap,
  style,
  ...props 
}) => {
  const [MotionComponent, setMotionComponent] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const handleInteraction = useCallback(async () => {
    if (!hasInteracted && !MotionComponent) {
      setHasInteracted(true);
      const { motion } = await loadFramerMotion();
      setMotionComponent(() => motion[component]);
    }
  }, [hasInteracted, MotionComponent, component]);
  
  // Interaction event handlers
  const interactionProps = {
    onMouseEnter: handleInteraction,
    onFocus: handleInteraction,
    onTouchStart: handleInteraction,
    ...props
  };
  
  // If motion component not loaded yet, use plain HTML element
  if (!MotionComponent) {
    const Element = component;
    return (
      <Element 
        className={className} 
        style={style}
        {...interactionProps}
      >
        {children}
      </Element>
    );
  }
  
  // Use motion component with full animation capabilities
  return (
    <MotionComponent
      className={className}
      style={style}
      variants={variants}
      initial={initial}
      animate={animate}
      whileHover={whileHover}
      whileTap={whileTap}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

/**
 * Lazy carousel with motion values
 */
const LazyCarousel = ({ children, className }) => {
  const [motionValues, setMotionValues] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);
  const autoScrollRef = useRef(null);
  
  // Load motion values when needed
  useEffect(() => {
    const loadMotionValues = async () => {
      const { useMotionValue, useTransform } = await loadFramerMotion();
      const dragX = useMotionValue(0);
      const beltProgress = useTransform(dragX, (x) => {
        const TOTAL_WIDTH = 6 * 320; // 6 features * 320px
        const normalizedX = ((x % TOTAL_WIDTH) + TOTAL_WIDTH) % TOTAL_WIDTH;
        return (normalizedX / TOTAL_WIDTH) * 100;
      });
      
      setMotionValues({ dragX, beltProgress });
    };
    
    loadMotionValues();
  }, []);
  
  // Auto-scroll logic (without motion initially)
  useEffect(() => {
    const AUTO_SCROLL_SPEED = 0.5;
    const AUTO_SCROLL_INTERVAL = 16;
    
    if (!isPaused && !isDragging && !isHovered && motionValues) {
      autoScrollRef.current = setInterval(() => {
        const currentX = motionValues.dragX.get();
        motionValues.dragX.set(currentX - AUTO_SCROLL_SPEED);
      }, AUTO_SCROLL_INTERVAL);
    } else {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isPaused, isDragging, isHovered, motionValues]);
  
  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!isDragging) {
      setIsPaused(false);
    }
  };
  
  if (!motionValues) {
    // Fallback static carousel while motion loads
    return (
      <div 
        className={className}
        ref={carouselRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    );
  }
  
  return (
    <LazyMotion
      component="div"
      className={className}
      ref={carouselRef}
      style={{ x: motionValues.dragX }}
      drag="x"
      dragElastic={0.1}
      dragMomentum={false}
      onDragStart={() => {
        setIsDragging(true);
        setIsPaused(true);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        setTimeout(() => setIsPaused(false), 2000);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </LazyMotion>
  );
};

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

function App() {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [motionLoaded, setMotionLoaded] = useState(false);
  const { currentUser, loading } = useAuth();

  // =============================================================================
  // LAZY LOADING TRIGGERS
  // =============================================================================

  /**
   * Preload Framer Motion after initial render
   */
  useEffect(() => {
    // Preload motion after a short delay for better initial page load
    const timer = setTimeout(() => {
      loadFramerMotion().then(() => {
        setMotionLoaded(true);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleAnalysisComplete = (results) => {
    setHasAnalysis(true);
    // Scroll to results
    setTimeout(() => {
      document.querySelector('#analysis-results')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
  };

  // =============================================================================
  // FEATURE DATA
  // =============================================================================

  const features = [
    {
      icon: Search,
      title: 'AI Analysis',
      description: 'Sherlock "investigates" your images, extracting style, mood, composition, and subject matter.',
      bgGradient: 'from-blue-500/10 to-cyan-500/10'
    },
    {
      icon: Zap,
      title: 'Engine Specific Prompts',
      description: 'Choose your target engine (Midjourney, DALL·E, Stable Diffusion, Gemini Imagen, etc.) (Coming soon)',
      bgGradient: 'from-yellow-500/10 to-orange-500/10'
    },
    {
      icon: Palette,
      title: 'Style & Character Profiles',
      description: 'Build a library of recurring styles and characters for consistent branding. (Coming soon)',
      bgGradient: 'from-purple-500/10 to-pink-500/10'
    },
    {
      icon: Lightbulb,
      title: 'Instant Inspiration',
      description: 'Turn any image into a perfect AI prompt—no guesswork.',
      bgGradient: 'from-green-500/10 to-emerald-500/10'
    },
    {
      icon: Target,
      title: 'Style Consistency',
      description: 'Keep your unique look across projects.',
      bgGradient: 'from-red-500/10 to-rose-500/10'
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Skip manual prompt writing, focus on creating.',
      bgGradient: 'from-indigo-500/10 to-violet-500/10'
    }
  ];

  // Create infinite loop by duplicating features
  const infiniteFeatures = [...features, ...features, ...features];

  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================

  /**
   * Renders the main header section
   */
  const renderHeader = () => (
    <LazyMotion
      component="header"
      className="text-center mb-16"
      variants={{
        hidden: { opacity: 0, y: -50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
      }}
      initial="hidden"
      animate="visible"
    >
      {/* Logo and Brand */}
      <LazyMotion
        component="div"
        className="flex items-center justify-center mb-6"
        whileHover={{ scale: 1.05 }}
      >
        <LazyMotion
          component="div"
          className="glass-effect p-4 rounded-2xl mr-4"
          whileHover={{ 
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)',
            scale: 1.1 
          }}
        >
          <Search className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
        </LazyMotion>
        
        <LazyMotion
          component="h1"
          className="gradient-text text-4xl md:text-5xl lg:text-6xl font-bold"
          variants={{
            hidden: { opacity: 0, scale: 0.8 },
            visible: { opacity: 1, scale: 1, transition: { duration: 0.6, delay: 0.2 } }
          }}
        >
          Prompt Sherlock
        </LazyMotion>
      </LazyMotion>

      {/* Marketing Tagline */}
      <LazyMotion
        component="div"
        className="max-w-3xl mx-auto mb-8"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.4 } }
        }}
      >
        <p className="text-blue-200 text-lg md:text-xl lg:text-2xl mb-4 italic">
          Uncover. Create. Repeat.<br />
          Turn any image into the perfect AI art prompt.
        </p>
      </LazyMotion>

      {/* Simplified Marketing Description */}
      <LazyMotion
        component="div"
        className="max-w-4xl mx-auto mb-12 glass-effect p-8 rounded-xl"
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.6 } }
        }}
      >
        <p className="text-white text-lg md:text-xl leading-relaxed mb-8 text-center">
          <strong className="gradient-text">Upload up to 10 images</strong> and let Prompt Sherlock instantly "investigate" every detail—style, mood, characters, composition, and more. Get ready-to-use prompts, tailored for top AI engines like Midjourney, DALL·E, Stable Diffusion, Gemini Imagen, and more.
        </p>
        
        {/* Centered CTA Button */}
        <div className="text-center">
          <LazyMotion
            component="button"
            className="glass-button px-10 py-5 text-white font-bold text-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 border border-blue-400/30 mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => document.querySelector('#upload-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Get Started Now
          </LazyMotion>
          
          <p className="text-gray-400 text-sm mt-4">
            Upload Your First Image and See Sherlock in Action!
          </p>
        </div>
      </LazyMotion>

      {/* Infinite Draggable Feature Carousel */}
      <LazyMotion
        component="div"
        className="max-w-7xl mx-auto overflow-hidden px-4 py-4"
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.8 } }
        }}
        initial="hidden"
        animate="visible"
      >
        <div className="relative">
          {/* Background Pattern Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
            <LazyMotion
              component="div"
              className="absolute inset-0 opacity-10"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%']
              }}
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(147,51,234,0.3) 0%, transparent 50%)',
                backgroundSize: '200% 200%'
              }}
            />
          </div>

          {/* Carousel Container */}
          <LazyCarousel className="flex space-x-6 cursor-grab active:cursor-grabbing">
            {infiniteFeatures.map((feature, index) => (
              <LazyMotion
                key={`${feature.title}-${index}`}
                component="div"
                className="glass-effect p-6 rounded-xl hover:bg-white/15 transition-all duration-300 flex-shrink-0 relative overflow-hidden"
                style={{ width: '300px' }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)'
                }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Background Pattern */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-50`} />
                
                {/* Content */}
                <LazyMotion
                  component="div"
                  className="relative z-10 flex flex-col items-center text-center space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <LazyMotion
                    component="div"
                    className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full backdrop-blur-sm"
                    whileHover={{ rotate: 360 }}
                  >
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </LazyMotion>
                  
                  <h3 className="text-white font-semibold text-lg">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-300 text-sm">
                    {feature.description}
                  </p>
                </LazyMotion>
              </LazyMotion>
            ))}
          </LazyCarousel>
        </div>
        
        {/* Belt Indicator - Simple fallback if motion not loaded */}
        <div className="relative w-full max-w-md mx-auto mt-8 mb-4">
          <div className="h-1 bg-white/20 rounded-full relative">
            <div className="absolute top-1/2 w-4 h-4 bg-blue-400 rounded-full shadow-lg animate-pulse" 
                 style={{ left: '50%', transform: 'translate(-50%, -50%)' }} />
          </div>
        </div>
      </LazyMotion>
    </LazyMotion>
  );

  /**
   * Renders the main content area
   */
  const renderMainContent = () => (
    <LazyMotion
      component="main"
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 1.0 } }
      }}
      initial="hidden"
      animate="visible"
      id="upload-section"
    >
      <AnalysisForm
        onAnalysisComplete={handleAnalysisComplete}
        apiUrl={import.meta.env.VITE_API_URL}
      />
    </LazyMotion>
  );

  /**
   * Renders the footer section with navigation
   */
  const renderFooter = () => (
    <LazyMotion
      component="footer"
      className="mt-20 pt-12 border-t border-white/10"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.6, delay: 1.2 } }
      }}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <Search className="w-6 h-6 text-blue-400 mr-2" />
              <span className="gradient-text font-bold text-xl">Prompt Sherlock</span>
            </div>
            <p className="text-gray-400 text-sm">
              AI-powered creative sidekick that investigates images to create perfect AI art prompts.
            </p>
          </div>

          {/* Privacy Statement */}
          <div className="text-center">
            <h4 className="text-white font-semibold mb-3 flex items-center justify-center">
              <Shield className="w-5 h-5 mr-2 text-green-400" />
              Privacy Promise
            </h4>
            <p className="text-gray-400 text-sm">
              Your images are processed securely and deleted immediately after analysis. 
              We never store or share your data.
            </p>
          </div>

          {/* Powered By */}
          <div className="text-center md:text-right">
            <h4 className="text-white font-semibold mb-3 flex items-center justify-center md:justify-end">
              <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
              Powered By
            </h4>
            <div className="space-y-1 text-gray-400 text-sm">
              <p>Google Gemini</p>
              <p>React & Tailwind CSS</p>
              {motionLoaded && <p>Framer Motion</p>}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <Navigation />

        {/* Copyright */}
        <div className="text-center py-6 border-t border-white/5 mt-8">
          <LazyMotion 
            component="p"
            className="text-gray-500 text-sm flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
          >
            Made with <Heart className="w-4 h-4 mx-1 text-red-400" /> for the creative community
          </LazyMotion>
          <p className="text-gray-600 text-xs mt-2">
            © 2024 Prompt Sherlock. Privacy-focused AI prompt generation.
          </p>
        </div>
      </div>
    </LazyMotion>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <LazyMotion
          component="div"
          className="max-w-7xl mx-auto"
          variants={{
            hidden: { opacity: 0 },
            visible: { 
              opacity: 1,
              transition: { 
                duration: 0.6,
                staggerChildren: 0.2 
              }
            }
          }}
          initial="hidden"
          animate="visible"
        >
          {renderHeader()}
          {renderMainContent()}
          {renderFooter()}
        </LazyMotion>
      </div>
      
      {/* Performance indicator */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 text-xs text-gray-500">
          Motion: {motionLoaded ? '✅' : '⏳'}
        </div>
      )}
    </div>
  );
}

export default App;