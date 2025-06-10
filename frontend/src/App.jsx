import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
import { Link } from 'react-router-dom';
import AnalysisForm from './components/AnalysisForm';
import Navigation from './components/Navigation';

/**
 * Main Application Component - Prompt Sherlock
 * 
 * Features:
 * - Modern glass morphism design
 * - Framer Motion animations
 * - Responsive layout
 * - AI-powered prompt generation branding
 * - Smooth draggable carousel
 */
function App() {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  // =============================================================================
  // ANIMATION VARIANTS
  // =============================================================================

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut'
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        delay: 0.2
      }
    }
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        delay: 0.4
      }
    }
  };

  const featureVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
        delay: 0.6
      }
    }
  };

  const footerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        delay: 1.0
      }
    }
  };

  // =============================================================================
  // FEATURE DATA - Original 3 + New 3
  // =============================================================================

  const features = [
    // Original 3 boxes (keeping exactly as they were)
    {
      icon: Search,
      title: 'AI Analysis',
      description: 'Sherlock "investigates" your images, extracting style, mood, composition, and subject matter.'
    },
    {
      icon: Zap,
      title: 'Engine Specific Prompts',
      description: 'Choose your target engine (Midjourney, DALL·E, Stable Diffusion, Gemini Imagen, etc.) and get prompts crafted for optimal results. (Coming soon)'
    },
    {
      icon: Palette,
      title: 'Style & Character Profiles',
      description: 'Build a library of recurring styles and characters for consistent branding and storytelling. (Coming soon)'
    },
    // New 3 boxes
    {
      icon: Lightbulb,
      title: 'Instant Inspiration',
      description: 'Turn any image into a perfect AI prompt—no guesswork.'
    },
    {
      icon: Target,
      title: 'Style Consistency',
      description: 'Keep your unique look across projects.'
    },
    {
      icon: Clock,
      title: 'Save Hours',
      description: 'Skip manual prompt writing, focus on creating.'
    }
  ];

  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================

  /**
   * Renders the main header section with Prompt Sherlock branding
   */
  const renderHeader = () => (
    <motion.header
      className="text-center mb-16"
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Logo and Brand */}
      <motion.div
        className="flex items-center justify-center mb-6"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="glass-effect p-4 rounded-2xl mr-4"
          whileHover={{ 
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)',
            scale: 1.1 
          }}
          transition={{ duration: 0.3 }}
        >
          <Search className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
        </motion.div>
        
        <motion.h1
          className="gradient-text text-4xl md:text-5xl lg:text-6xl font-bold"
          variants={titleVariants}
        >
          Prompt Sherlock
        </motion.h1>
      </motion.div>

      {/* Marketing Tagline */}
      <motion.div
        className="max-w-3xl mx-auto mb-8"
        variants={subtitleVariants}
      >
        <p className="text-blue-200 text-lg md:text-xl lg:text-2xl mb-4 italic">
          Uncover. Create. Repeat.<br />
          Turn any image into the perfect AI art prompt.
        </p>
      </motion.div>

      {/* Simplified Marketing Description - Only intro + button */}
      <motion.div
        className="max-w-4xl mx-auto mb-12 glass-effect p-8 rounded-xl"
        variants={subtitleVariants}
      >
        <p className="text-white text-lg md:text-xl leading-relaxed mb-8 text-center">
          <strong className="gradient-text">Upload up to 10 images</strong> and let Prompt Sherlock instantly "investigate" every detail—style, mood, characters, composition, and more. Get ready-to-use prompts, tailored for top AI engines like Midjourney, DALL·E, Stable Diffusion, Gemini Imagen, and more.
        </p>
        
        {/* Centered CTA Button */}
        <div className="text-center">
          <motion.button
            className="glass-button px-10 py-5 text-white font-bold text-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 border border-blue-400/30 mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => document.querySelector('#upload-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Get Started Now
          </motion.button>
          
          <p className="text-gray-400 text-sm mt-4">
            Upload Your First Image—See Sherlock in Action!
          </p>
        </div>
      </motion.div>

      {/* Smooth Draggable Feature Carousel - 6 boxes total */}
      <motion.div
        className="max-w-7xl mx-auto overflow-hidden"
        variants={featureVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="flex space-x-6 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{
            left: -(features.length - 3) * 320, // Approximate width per card + gap
            right: 0
          }}
          dragElastic={0.2}
          dragMomentum={true}
          dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(event, info) => {
            setIsDragging(false);
            // Calculate which slide we're closest to based on drag distance
            const dragDistance = info.offset.x;
            const slideWidth = 320;
            const slidesFromStart = Math.round(-dragDistance / slideWidth);
            const newSlide = Math.max(0, Math.min(features.length - 3, slidesFromStart));
            setCurrentSlide(newSlide);
          }}
          animate={{ x: -currentSlide * 320 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ width: `${features.length * 320}px` }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="glass-effect p-6 rounded-xl hover:bg-white/15 transition-all duration-300 flex-shrink-0"
              style={{ width: '300px' }}
              whileHover={!isDragging ? { 
                scale: 1.05,
                boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)'
              } : {}}
              whileTap={!isDragging ? { scale: 0.95 } : {}}
            >
              <motion.div
                className="flex flex-col items-center text-center space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
              >
                <motion.div
                  className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full"
                  whileHover={!isDragging ? { rotate: 360 } : {}}
                  transition={{ duration: 0.6 }}
                >
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </motion.div>
                
                <h3 className="text-white font-semibold text-lg">
                  {feature.title}
                </h3>
                
                <p className="text-gray-300 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Dot Indicators */}
        <div className="flex justify-center space-x-2 mt-6">
          {Array.from({ length: features.length - 2 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-blue-400 scale-125' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
      </motion.div>
    </motion.header>
  );

  /**
   * Renders the main content area
   */
  const renderMainContent = () => (
    <motion.main
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      id="upload-section"
    >
      <AnalysisForm
        onAnalysisComplete={handleAnalysisComplete}
        apiUrl={import.meta.env.VITE_API_URL}
      />
    </motion.main>
  );

  /**
   * Renders the footer section with navigation
   */
  const renderFooter = () => (
    <motion.footer
      className="mt-20 pt-12 border-t border-white/10"
      variants={footerVariants}
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
              <p>Framer Motion</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <Navigation />

        {/* Copyright */}
        <div className="text-center py-6 border-t border-white/5 mt-8">
          <motion.p 
            className="text-gray-500 text-sm flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            Made with <Heart className="w-4 h-4 mx-1 text-red-400" /> for the creative community
          </motion.p>
          <p className="text-gray-600 text-xs mt-2">
            © 2024 Prompt Sherlock. Privacy-focused AI prompt generation.
          </p>
        </div>
      </div>
    </motion.footer>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {renderHeader()}
          {renderMainContent()}
          {renderFooter()}
        </motion.div>
      </div>
    </div>
  );
}

export default App;