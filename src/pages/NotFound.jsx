import React from 'react';
import { motion } from 'framer-motion';
import { Home, Search, Eye, ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * 404 Not Found Page Component - Prompt Sherlock
 * 
 * Features:
 * - Friendly 404 error page with detective theme
 * - Navigation back to main sections
 * - Glass morphism styling
 * - Animated elements
 * - Helpful suggestions
 * - Updated branding for Prompt Sherlock
 */
const NotFound = () => {
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

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  const floatingVariants = {
    floating: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const magnetGlassVariants = {
    idle: {
      rotate: 0,
      scale: 1
    },
    hover: {
      rotate: [0, -10, 10, -10, 0],
      scale: 1.1,
      transition: {
        duration: 0.6,
        ease: 'easeInOut'
      }
    }
  };

  const navigationOptions = [
    {
      to: '/',
      icon: Home,
      title: 'Home',
      description: 'Return to Prompt Sherlock and start investigating images'
    },
    {
      to: '/privacy',
      icon: Eye,
      title: 'Privacy Policy',
      description: 'Learn about our privacy practices'
    },
    {
      to: '/terms',
      icon: Sparkles,
      title: 'Terms of Service',
      description: 'Read our terms and conditions'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main 404 Section */}
          <motion.div
            className="glass-effect p-12 rounded-2xl mb-8"
            variants={itemVariants}
          >
            {/* 404 Number with Detective Theme */}
            <motion.div
              className="mb-8"
              variants={floatingVariants}
              animate="floating"
            >
              <h1 className="text-8xl md:text-9xl font-bold gradient-text mb-4">
                404
              </h1>
              <motion.div
                className="w-24 h-24 mx-auto glass-effect rounded-full flex items-center justify-center"
                variants={magnetGlassVariants}
                initial="idle"
                whileHover="hover"
              >
                <Search className="w-12 h-12 text-blue-400" />
              </motion.div>
            </motion.div>

            {/* Error Message with Sherlock Theme */}
            <motion.div
              className="space-y-4"
              variants={itemVariants}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Case Unsolved
              </h2>
              <p className="text-xl text-blue-200 mb-6">
                This page seems to have vanished without a trace!
              </p>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Don't worry though! Our AI might be great at analyzing images and generating prompts, 
                but it's still learning to keep track of web pages. 
                Let's get you back to solving creative mysteries.
              </p>
            </motion.div>

            {/* Call to Action */}
            <motion.div
              className="mt-8"
              variants={itemVariants}
            >
              <motion.button
                className="glass-button px-8 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white font-semibold transition-all duration-300 mb-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/'}
              >
                🔍 Start a New Investigation
              </motion.button>
              <p className="text-sm text-gray-400 mt-2">
                Upload Your First Image—See Sherlock in Action!
              </p>
            </motion.div>
          </motion.div>

          {/* Navigation Options */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            {navigationOptions.map((option, index) => (
              <motion.div
                key={option.to}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={option.to}
                  className="block glass-effect p-6 rounded-xl hover:bg-white/15 transition-all duration-300 group"
                >
                  <motion.div
                    className="flex flex-col items-center space-y-3"
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <option.icon className="w-6 h-6 text-blue-400" />
                    </motion.div>
                    
                    <h3 className="text-white font-semibold text-lg group-hover:text-blue-300 transition-colors">
                      {option.title}
                    </h3>
                    
                    <p className="text-gray-400 text-sm text-center">
                      {option.description}
                    </p>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Detective Quote */}
          <motion.div
            className="mt-12 glass-effect p-6 rounded-xl"
            variants={itemVariants}
          >
            <motion.div
              className="flex items-center justify-center mb-4"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <Search className="w-8 h-8 text-blue-400 mr-3" />
              <span className="gradient-text text-2xl font-bold">Prompt Sherlock</span>
            </motion.div>
            <blockquote className="text-blue-200 italic text-lg">
              "When you have eliminated the impossible, whatever remains, however improbable, 
              must be the truth... or in this case, a really great AI art prompt!"
            </blockquote>
            <p className="text-gray-400 text-sm mt-3">
              — Detective Wisdom, adapted for the digital age
            </p>
          </motion.div>

          {/* Back to Investigation */}
          <motion.div
            className="mt-8 text-center"
            variants={itemVariants}
          >
            <p className="text-gray-400 mb-4">
              Ready to get back to the investigation?
            </p>
            <Link 
              to="/"
              className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Return to Prompt Sherlock HQ</span>
              <span className="text-2xl">🕵️</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;