import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Zap, 
  Shield, 
  Brain,
  Sparkles,
  Heart
} from 'lucide-react';
import AnalysisForm from './components/AnalysisForm';
import Navigation from './components/Navigation';

function App() {
  const [analysisHistory, setAnalysisHistory] = useState([]);

  /**
   * Handles completion of analysis
   * @param {Object} results - Analysis results from API
   */
  const handleAnalysisComplete = (results) => {
    setAnalysisHistory(prev => [
      {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...results
      },
      ...prev
    ]);
    
    console.log('Analysis completed:', results);
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
        ease: 'easeOut',
        staggerChildren: 0.2
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
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
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.7,
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
  // FEATURE DATA
  // =============================================================================

  const features = [
    {
      icon: Zap,
      title: 'Fast Analysis',
      description: 'Get detailed insights in seconds'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Images deleted immediately after analysis'
    },
    {
      icon: Brain,
      title: 'AI Powered',
      description: 'Advanced computer vision technology'
    }
  ];

  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================

  /**
   * Renders the main header section
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
          <Eye className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
        </motion.div>
        
        <motion.h1
          className="gradient-text text-4xl md:text-5xl lg:text-6xl font-bold"
          variants={titleVariants}
        >
          ImageAnalyzer
        </motion.h1>
      </motion.div>

      {/* Subtitle */}
      <motion.div
        className="max-w-3xl mx-auto mb-8"
        variants={subtitleVariants}
      >
        <p className="text-blue-200 text-lg md:text-xl lg:text-2xl mb-4">
          Transform your images into detailed insights with AI-powered analysis
        </p>
        <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
          Upload up to 10 images and get comprehensive descriptions, object identification, 
          and contextual understanding powered by advanced computer vision.
        </p>
      </motion.div>

      {/* Feature Highlights */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
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
              <Eye className="w-6 h-6 text-blue-400 mr-2" />
              <span className="gradient-text font-bold text-xl">ImageAnalyzer</span>
            </div>
            <p className="text-gray-400 text-sm">
              AI-powered image analysis with privacy and security at its core.
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

          {/* Tech Stack */}
          <div className="text-center md:text-right">
            <h4 className="text-white font-semibold mb-3 flex items-center justify-center md:justify-end">
              <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
              Powered By
            </h4>
            <div className="space-y-1 text-gray-400 text-sm">
              <p>Google Gemini AI</p>
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
            Made with <Heart className="w-4 h-4 mx-1 text-red-400" /> for the community
          </motion.p>
          <p className="text-gray-600 text-xs mt-2">
            © 2024 ImageAnalyzer. Privacy-focused AI image analysis.
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
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            className="space-y-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header Section */}
            {renderHeader()}

            {/* Main Content */}
            {renderMainContent()}

            {/* Footer Section */}
            {renderFooter()}
          </motion.div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <motion.button
        className="fixed bottom-8 right-8 glass-effect p-3 rounded-full text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all duration-300"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, duration: 0.3 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Scroll to top"
      >
        <Eye className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

export default App;