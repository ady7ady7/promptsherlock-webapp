import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Scale, 
  AlertTriangle, 
  Users, 
  Shield, 
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Terms of Service Page Component
 * 
 * Features:
 * - Professional legal-style formatting
 * - Service usage terms and conditions
 * - Acceptable use policy
 * - Limitation of liability
 * - Mobile-responsive design
 * - Glass morphism styling
 */
const Terms = () => {
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
  // TERMS SECTIONS DATA
  // =============================================================================

  const termsSections = [
    {
      id: 'service-description',
      icon: FileText,
      title: '1. Service Description',
      content: [
        {
          subtitle: '1.1 Service Overview',
          text: 'ImageAnalyzer ("the Service") is an AI-powered image analysis platform that provides automated analysis and insights for user-uploaded images. The Service uses advanced computer vision technology to analyze visual content and generate detailed descriptions.'
        },
        {
          subtitle: '1.2 Service Availability',
          text: 'We strive to maintain high availability of the Service but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.'
        },
        {
          subtitle: '1.3 Service Modifications',
          text: 'We reserve the right to modify, update, or discontinue the Service at any time with or without notice. We will make reasonable efforts to notify users of significant changes that affect service functionality.'
        }
      ]
    },
    {
      id: 'acceptable-use',
      icon: Users,
      title: '2. Acceptable Use Policy',
      content: [
        {
          subtitle: '2.1 Permitted Uses',
          text: 'You may use the Service for lawful purposes including: analyzing personal images, business image content, educational research, and creative projects. Commercial use is permitted within reasonable limits.'
        },
        {
          subtitle: '2.2 Prohibited Uses',
          text: 'You may not: upload illegal, harmful, or inappropriate content; attempt to reverse engineer or exploit the Service; use the Service for harassment, spam, or malicious activities; violate any applicable laws or regulations.'
        },
        {
          subtitle: '2.3 Content Responsibility',
          text: 'You are solely responsible for the content you upload and analyze. You must have the right to upload and process any images you submit to the Service. You warrant that your use complies with all applicable laws.'
        }
      ]
    },
    {
      id: 'user-obligations',
      icon: CheckCircle,
      title: '3. User Obligations',
      content: [
        {
          subtitle: '3.1 Compliance',
          text: 'You agree to comply with all applicable laws, regulations, and these Terms of Service when using our platform. You are responsible for ensuring your use is lawful in your jurisdiction.'
        },
        {
          subtitle: '3.2 Security',
          text: 'You agree not to attempt to gain unauthorized access to the Service, interfere with its operation, or compromise its security. Any security vulnerabilities should be reported responsibly.'
        },
        {
          subtitle: '3.3 Rate Limits',
          text: 'You agree to respect rate limits and fair use policies. Excessive use that impacts service availability for other users may result in temporary restrictions.'
        }
      ]
    },
    {
      id: 'limitation-liability',
      icon: Scale,
      title: '4. Limitation of Liability',
      content: [
        {
          subtitle: '4.1 Service Disclaimer',
          text: 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.'
        },
        {
          subtitle: '4.2 Limitation of Damages',
          text: 'IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING FROM YOUR USE OF THE SERVICE.'
        },
        {
          subtitle: '4.3 Maximum Liability',
          text: 'OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM OR RELATING TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE TWELVE MONTHS PRECEDING THE CLAIM.'
        }
      ]
    },
    {
      id: 'intellectual-property',
      icon: Shield,
      title: '5. Intellectual Property',
      content: [
        {
          subtitle: '5.1 Service Ownership',
          text: 'The Service, including its technology, algorithms, and user interface, is owned by us and protected by intellectual property laws. You receive a limited license to use the Service according to these Terms.'
        },
        {
          subtitle: '5.2 User Content',
          text: 'You retain ownership of images you upload. By using the Service, you grant us a temporary license to process your images solely for providing analysis results. This license expires when processing is complete.'
        },
        {
          subtitle: '5.3 Analysis Results',
          text: 'Analysis results generated by the Service are provided to you for your use. We do not claim ownership of analysis results, though the underlying AI technology remains our intellectual property.'
        }
      ]
    },
    {
      id: 'termination',
      icon: XCircle,
      title: '6. Termination',
      content: [
        {
          subtitle: '6.1 Termination Rights',
          text: 'We may suspend or terminate your access to the Service at any time for violation of these Terms, illegal activity, or conduct that harms the Service or other users.'
        },
        {
          subtitle: '6.2 Effect of Termination',
          text: 'Upon termination, your right to use the Service ceases immediately. Since we do not store user data, termination does not affect previously downloaded analysis results.'
        },
        {
          subtitle: '6.3 Survival',
          text: 'Sections relating to intellectual property, limitation of liability, and dispute resolution survive termination of these Terms.'
        }
      ]
    }
  ];

  const importantNotices = [
    {
      icon: AlertTriangle,
      title: 'Legal Compliance',
      description: 'Users must comply with all applicable laws and regulations',
      type: 'warning'
    },
    {
      icon: Shield,
      title: 'Privacy Protection',
      description: 'Images are processed securely and deleted immediately',
      type: 'success'
    },
    {
      icon: Info,
      title: 'Fair Use',
      description: 'Service is provided for reasonable personal and commercial use',
      type: 'info'
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
            className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full mr-4"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            <Scale className="w-10 h-10 text-blue-400" />
          </motion.div>
          <h1 className="gradient-text text-4xl md:text-5xl font-bold">
            Terms of Service
          </h1>
        </div>
        
        <p className="text-blue-200 text-lg md:text-xl max-w-3xl mx-auto mb-4">
          Legal terms and conditions governing your use of ImageAnalyzer services.
        </p>
        
        <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span>Effective date: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );

  const renderImportantNotices = () => (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
      variants={containerVariants}
    >
      {importantNotices.map((notice, index) => (
        <motion.div
          key={notice.title}
          className={`glass-effect p-6 rounded-xl border-l-4 hover:bg-white/15 transition-all duration-300 ${
            notice.type === 'warning' ? 'border-yellow-500' :
            notice.type === 'success' ? 'border-green-500' :
            'border-blue-500'
          }`}
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            className={`p-3 rounded-full w-fit mb-4 ${
              notice.type === 'warning' ? 'bg-yellow-500/20' :
              notice.type === 'success' ? 'bg-green-500/20' :
              'bg-blue-500/20'
            }`}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <notice.icon className={`w-6 h-6 ${
              notice.type === 'warning' ? 'text-yellow-400' :
              notice.type === 'success' ? 'text-green-400' :
              'text-blue-400'
            }`} />
          </motion.div>
          <h3 className="text-white font-semibold text-lg mb-2">
            {notice.title}
          </h3>
          <p className="text-gray-300 text-sm">
            {notice.description}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );

  const renderTermsSections = () => (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
    >
      {termsSections.map((section, index) => (
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
                <h3 className="text-lg font-semibold text-blue-300 mb-3 font-mono">
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
      {/* Governing Law */}
      <motion.div
        className="glass-effect p-6 rounded-xl"
        variants={itemVariants}
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Scale className="w-5 h-5 mr-2 text-blue-400" />
          Governing Law
        </h3>
        <div className="space-y-3 text-gray-300">
          <p>
            These Terms are governed by and construed in accordance with applicable laws. 
            Any disputes will be resolved through appropriate legal channels.
          </p>
          <div className="space-y-2 text-sm">
            <p>• Terms subject to local jurisdiction</p>
            <p>• Disputes resolved through mediation first</p>
            <p>• Applicable consumer protection laws apply</p>
          </div>
        </div>
      </motion.div>

      {/* Contact for Legal Issues */}
      <motion.div
        className="glass-effect p-6 rounded-xl"
        variants={itemVariants}
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-purple-400" />
          Legal Contact
        </h3>
        <div className="space-y-3 text-gray-300">
          <p>
            For legal questions about these Terms or to report violations, 
            please contact our legal team.
          </p>
          <div className="space-y-2 text-sm">
            <p>Email: legal@imageanalyzer.app</p>
            <p>Response time: Within 5 business days</p>
            <p>Include: Detailed description of issue</p>
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

          {/* Important Notices */}
          {renderImportantNotices()}

          {/* Main Terms Sections */}
          {renderTermsSections()}

          {/* Additional Legal Information */}
          {renderAdditionalInfo()}

          {/* Bottom Navigation */}
          <motion.div
            className="mt-12 pt-8 border-t border-white/10 text-center"
            variants={itemVariants}
          >
            <div className="space-y-4">
              <p className="text-gray-400">
                Learn about our privacy practices and data protection
              </p>
              <div className="flex justify-center space-x-4">
                <Link 
                  to="/privacy"
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  Privacy Policy →
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

export default Terms;