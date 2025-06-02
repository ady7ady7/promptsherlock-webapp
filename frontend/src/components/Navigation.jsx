import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Shield, FileText, Eye, Home } from 'lucide-react';

/**
 * Navigation Component for Footer Links
 * 
 * Features:
 * - Footer navigation links
 * - Active route highlighting
 * - Smooth hover animations
 * - Glass morphism styling
 * - Mobile-responsive design
 */
const Navigation = () => {
  const location = useLocation();

  // =============================================================================
  // NAVIGATION DATA
  // =============================================================================

  const navigationLinks = [
    {
      to: '/',
      icon: Home,
      label: 'Home',
      description: 'AI Image Analysis'
    },
    {
      to: '/privacy',
      icon: Shield,
      label: 'Privacy Policy',
      description: 'Data Protection'
    },
    {
      to: '/terms',
      icon: FileText,
      label: 'Terms of Service',
      description: 'Legal Terms'
    }
  ];

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const isActive = (path) => {
    return location.pathname === path;
  };

  // =============================================================================
  // ANIMATION VARIANTS
  // =============================================================================

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  };

  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================

  const renderNavigationLinks = () => (
    <motion.div
      className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {navigationLinks.map((link) => (
        <motion.div
          key={link.to}
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to={link.to}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
              isActive(link.to)
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'hover:bg-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <motion.div
              className={`p-2 rounded-full transition-all duration-300 ${
                isActive(link.to)
                  ? 'bg-blue-500/30'
                  : 'bg-white/10 group-hover:bg-white/20'
              }`}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <link.icon className={`w-4 h-4 ${
                isActive(link.to) ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'
              }`} />
            </motion.div>
            
            <div className="text-left">
              <div className={`font-medium text-sm ${
                isActive(link.to) ? 'text-blue-300' : 'group-hover:text-white'
              }`}>
                {link.label}
              </div>
              <div className="text-xs text-gray-500 group-hover:text-gray-400">
                {link.description}
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );

  const renderCompactLinks = () => (
    <motion.div
      className="flex justify-center items-center space-x-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {navigationLinks.map((link) => (
        <motion.div
          key={link.to}
          variants={itemVariants}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Link
            to={link.to}
            className={`text-sm transition-colors duration-200 ${
              isActive(link.to)
                ? 'text-blue-400 font-medium'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <nav className="mt-8">
      {/* Desktop Navigation - Full Links */}
      <div className="hidden md:block">
        {renderNavigationLinks()}
      </div>

      {/* Mobile Navigation - Compact Links */}
      <div className="block md:hidden">
        {renderCompactLinks()}
      </div>
    </nav>
  );
};

export default Navigation;