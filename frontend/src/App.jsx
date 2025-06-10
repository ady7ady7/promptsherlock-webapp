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
  Wand2
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
 * - Sherlock detective theme
 */
function App() {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [hasAnalysis, setHasAnalysis] = useState(false);

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
  // FEATURE DATA - Updated for Prompt Sherlock
  // =============================================================================

  const features = [
    {
      icon: Search,
      title: 'AI Detective Analysis',
      description: 'Sherlock "investigates" every image, extracting style, mood, composition, and subject matter.'
    },
    {
      icon: Zap,
      title: 'Instant, Tool-Specific Prompts',
      description: 'Choose your target engine (Midjourney, DALL·E, Stable Diffusion, Gemini Imagen, etc.) and get prompts crafted for optimal results. (SOON)'
    },
    {
      icon: Palette,
      title: 'Style & Character Profiles',
      description: 'Build a library of recurring styles and characters for consistent branding and storytelling. (SOON)'
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
          Uncover. Create. Repeat. Instantly turn inspiration into AI art prompts, tailored for your favorite tools.
        </p>
        <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto font-semibold">
          Turn any image into the perfect AI art prompt—no guesswork, no wasted time.
        </p>
      </motion.div>

      {/* Marketing Description - Optimized */}
      <motion.div
        className="max-w-4xl mx-auto mb-12 glass-effect p-8 rounded-xl"
        variants={subtitleVariants}
      >
        <p className="text-white text-lg md:text-xl leading-relaxed mb-8 text-center">
          <strong className="gradient-text">Upload up to 10 images</strong> and let Prompt Sherlock instantly "investigate" every detail—style, mood, characters, composition, and more. Get ready-to-use prompts, expertly tailored for top AI engines like Midjourney, DALL·E, Stable Diffusion, Gemini Imagen, and more.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div>
            <h3 className="text-blue-300 font-bold text-xl mb-4 flex items-center">
              <Wand2 className="w-6 h-6 mr-3" />
              Why Prompt Sherlock?
            </h3>
            <ul className="text-gray-300 space-y-3">
              <li className="flex items-start">
                <span className="text-blue-400 mr-3">•</span>
                <div>
                  <strong className="text-white">Instant Inspiration:</strong> Turn any image into a perfect AI prompt—no guesswork.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-3">•</span>
                <div>
                  <strong className="text-white">Tool-Optimized:</strong> Prompts fine-tuned for your favorite AI engine.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-3">•</span>
                <div>
                  <strong className="text-white">Style Consistency:</strong> Keep your unique look across projects.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-3">•</span>
                <div>
                  <strong className="text-white">Save Hours:</strong> Skip manual prompt writing—focus on creating.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-3">•</span>
                <div>
                  <strong className="text-white">Interactive Refinement:</strong> Tweak and perfect prompts with our editor. <span className="text-purple-300 text-sm italic">(Coming soon)</span>
                </div>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-purple-300 font-bold text-xl mb-4 flex items-center">
              <Users className="w-6 h-6 mr-3" />
              Who's it for?
            </h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">Digital artists, designers, marketers, AI creators</strong>—anyone who wants to transform inspiration into stunning AI art, fast.
            </p>
            
            <div className="space-y-4">
              <motion.button
                className="glass-button w-full py-4 text-white font-bold text-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 border border-blue-400/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => document.querySelector('#upload-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Started Now
              </motion.button>
              
              <p className="text-center text-sm text-gray-400">
                Upload Your First Image—See Sherlock in Action!
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature Highlights */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        variants={containerVariants}
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            className="glass-effect p-6 rounded-xl hover:bg-white/15 transition-all duration-300"
            variants={featureVariants}
            custom={index}
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)'
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="flex flex-col items-center text-center space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
            >
              <motion.div
                className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full"
                whileHover={{ rotate: 360 }}
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
              <p>Claude 3.5 Sonnet</p>
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