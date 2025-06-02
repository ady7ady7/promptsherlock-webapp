import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Eye, 
  Trash2, 
  Lock, 
  Server, 
  UserCheck,
  ArrowLeft,
  Calendar,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Privacy Policy Page Component
 * 
 * Features:
 * - Professional layout with glass morphism
 * - Comprehensive privacy sections
 * - Emphasis on immediate deletion and no data retention
 * - Mobile-responsive design
 * - Framer Motion animations
 */
const Privacy = () => {
  // =============================================================================
  // ANIMATION VARIANTS
  // =============================================================================
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
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

  // =============================================================================
  // PRIVACY SECTIONS DATA
  // =============================================================================

  const privacySections = [
    {
      id: 'image-processing',
      icon: Eye,
      title: 'Image Processing',
      content: [
        {
          subtitle: 'Immediate Processing',
          text: 'When you upload images to ImageAnalyzer, they are processed immediately by our AI systems. Your images are temporarily stored in memory during analysis and are completely removed from our servers within seconds of processing completion.'
        },
        {
          subtitle: 'No Permanent Storage',
          text: 'We do not save, store, or retain your images in any permanent storage system. Once analysis is complete, all traces of your images are automatically deleted from our servers and cannot be recovered.'
        },
        {
          subtitle: 'Secure Transmission',
          text: 'All image uploads are transmitted using industry-standard SSL/TLS encryption. Your images are protected during transmission and processing.'
        }
      ]
    },
    {
      id: 'data-collection',
      icon: Server,
      title: 'Data Collection',
      content: [
        {
          subtitle: 'What We Collect',
          text: 'We collect minimal technical information necessary for service operation, including: IP addresses for rate limiting, browser information for compatibility, and basic usage analytics for service improvement.'
        },
        {
          subtitle: 'What We Don\'t Collect',
          text: 'We do not collect, store, or process: personal identifying information, user accounts or profiles, image metadata beyond what is necessary for analysis, or any data that could identify you personally.'
        },
        {
          subtitle: 'Analytics Data',
          text: 'We may collect anonymous usage statistics to improve our service, including number of images processed, analysis completion times, and error rates. This data cannot be linked to individual users.'
        }
      ]
    },
    {
      id: 'user-rights',
      icon: UserCheck,
      title: 'Your Rights',
      content: [
        {
          subtitle: 'Right to Privacy',
          text: 'You have the absolute right to privacy when using our service. Since we don\'t store your images or personal data, there is no data to access, modify, or delete after processing is complete.'
        },
        {
          subtitle: 'Data Portability',
          text: 'Analysis results are provided to you immediately and are yours to keep. You can save, export, or use the analysis results as you see fit.'
        },
        {
          subtitle: 'Service Transparency',
          text: 'We are committed to transparency about our data practices. If you have questions about how your data is handled, please contact us for clarification.'
        }
      ]
    }
  ];

  const keyPromises = [
    {
      icon: Trash2,
      title: 'Immediate Deletion',
      description: 'Images deleted within seconds of analysis completion'
    },
    {
      icon: Lock,
      title: 'Zero Data Retention',
      description: 'No permanent storage of user images or personal data'
    },
    {
      icon: Shield,
      title: 'Privacy by Design',
      description: 'Built from the ground up with privacy as the core principle'
    }
  ];

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderHeader = () => (
    <motion.div
      className="text-center mb-12"
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Back Navigation */}
      <div className="flex justify-start mb-8">
        <Link 
          to="/"
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header Content */}
      <div className="glass-effect p-8 rounded-2xl">
        <div className="flex items-center justify-center mb-6">
          <motion.div
            className="p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full mr-4"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            <Shield className="w-10 h-10 text-green-400" />
          </motion.div>
          <h1 className="gradient-text text-4xl md:text-5xl font-bold">
            Privacy Policy
          </h1>
        </div>
        
        <p className="text-blue-200 text-lg md:text-xl max-w-3xl mx-auto mb-4">
          Your privacy is our top priority. Learn how we protect your data and respect your privacy.
        </p>
        
        <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );

  const renderKeyPromises = () => (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
      variants={containerVariants}
    >
      {keyPromises.map((promise, index) => (
        <motion.div
          key={promise.title}
          className="glass-effect p-6 rounded-xl text-center hover:bg-white/15 transition-all duration-300"
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            className="p-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full w-fit mx-auto mb-4"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <promise.icon className="w-6 h-6 text-green-400" />
          </motion.div>
          <h3 className="text-white font-semibold text-lg mb-2">
            {promise.title}
          </h3>
          <p className="text-gray-300 text-sm">
            {promise.description}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );

  const renderPrivacySections = () => (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
    >
      {privacySections.map((section, index) => (
        <motion.section
          key={section.id}
          className="glass-effect p-8 rounded-xl"
          variants={itemVariants}
          id={section.id}
        >
          <div className="flex items-start space-x-4 mb-6">
            <motion.div
              className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <section.icon className="w-6 h-6 text-blue-400" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {section.title}
              </h2>
            </div>
          </div>

          <div className="space-y-6 ml-16">
            {section.content.map((item, itemIndex) => (
              <motion.div
                key={itemIndex}
                className="border-l-2 border-blue-500/30 pl-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + itemIndex * 0.05 }}
              >
                <h3 className="text-lg font-semibold text-blue-300 mb-3">
                  {item.subtitle}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      ))}
    </motion.div>
  );

  const renderAdditionalInfo = () => (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12"
      variants={containerVariants}
    >
      {/* Contact Information */}
      <motion.div
        className="glass-effect p-6 rounded-xl"
        variants={itemVariants}
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-blue-400" />
          Contact Us
        </h3>
        <div className="space-y-3 text-gray-300">
          <p>
            If you have questions about this Privacy Policy or our data practices, 
            please contact us:
          </p>
          <div className="space-y-2 text-sm">
            <p>Email: privacy@imageanalyzer.app</p>
            <p>Response time: Within 48 hours</p>
          </div>
        </div>
      </motion.div>

      {/* Policy Updates */}
      <motion.div
        className="glass-effect p-6 rounded-xl"
        variants={itemVariants}
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-purple-400" />
          Policy Updates
        </h3>
        <div className="space-y-3 text-gray-300">
          <p>
            We may update this Privacy Policy to reflect changes in our practices 
            or for legal compliance.
          </p>
          <div className="space-y-2 text-sm">
            <p>• Changes will be posted on this page</p>
            <p>• Major changes will be highlighted</p>
            <p>• Continued use implies acceptance</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          {renderHeader()}

          {/* Key Privacy Promises */}
          {renderKeyPromises()}

          {/* Main Privacy Sections */}
          {renderPrivacySections()}

          {/* Additional Information */}
          {renderAdditionalInfo()}

          {/* Bottom Navigation */}
          <motion.div
            className="mt-12 pt-8 border-t border-white/10 text-center"
            variants={itemVariants}
          >
            <div className="space-y-4">
              <p className="text-gray-400">
                Read our full legal terms and service conditions
              </p>
              <div className="flex justify-center space-x-4">
                <Link 
                  to="/terms"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Terms of Service →
                </Link>
                <Link 
                  to="/"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;