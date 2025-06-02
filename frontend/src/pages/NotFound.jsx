import React from 'react';
import { motion } from 'framer-motion';
import { Home, Search, Eye, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * 404 Not Found Page Component
 * 
 * Features:
 * - Friendly 404 error page
 * - Navigation back to main sections
 * - Glass morphism styling
 * - Animated elements
 * - Helpful suggestions
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

  const navigationOptions = [
    {
      to: '/',
      icon: Home,
      title: 'Home',
      description: 'Return to the main page'
    },
    {
      to: '/privacy',
      icon: Eye,
      title: 'Privacy Policy',
      description: 'Learn about our privacy practices'
    },
    {
      to: '/terms',
      icon: Search,
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
            {/* 404 Number */}
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
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Search className="w-12 h-12 text-blue-400" />
              </motion.div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              className="space-y-4"
              variants={itemVariants}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Page Not Found
              </h2>
              <p className="text-xl text-blue-200 mb-6">
                The page you're looking for seems to have wandered off into the digital void.
              </p>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Don't worry though! Our AI might be great at analyzing images, 
                but it's still learning to keep track of web pages. 
                Let's get you back on track.
              </p>
            </motion.div>
          </motion.div>

          {/* Navigation Options */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            variants={containerVariants}
          >
            {navigationOptions.map((option, index) => (
              <motion.div
                key={option.to}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to={option.to}>
                  <div className="glass-effect p-6 rounded-xl hover:bg-white/15 transition-all duration-300 h-full">
                    <motion.div
                      className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full w-fit mx-auto mb-4"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <option.icon className="w-8 h-8 text-blue-400" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {option.title}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {option.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="glass-effect p-6 rounded-xl"
            variants={itemVariants}
          >
            <h3 className="text-xl font-semibold text-white mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6">
              <Link 
                to="/"
                className="glow-button flex items-center space-x-2 px-6 py-3"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Go Home</span>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="btn-outline px-6 py-3"
              >
                Go Back
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="btn-ghost px-6 py-3"
              >
                Refresh Page
              </button>
            </div>
          </motion.div>

          {/* Fun Fact */}
          <motion.div
            className="mt-8 text-center"
            variants={itemVariants}
          >
            <p className="text-gray-500 text-sm">
              Fun fact: 404 errors are named after room 404 at CERN, 
              where the web was invented! 🌐
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;