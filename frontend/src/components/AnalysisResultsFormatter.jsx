import React from 'react';
import { motion } from 'framer-motion';
import { 
  Eye,
  Palette,
  MapPin,
  Settings,
  FileText,
  Lightbulb,
  Star,
  Image as ImageIcon,
  Layers,
  Target
} from 'lucide-react';

/**
 * AnalysisResultsFormatter Component
 * 
 * Transforms raw AI analysis text into a beautiful, structured format
 * with proper sections, icons, and professional styling
 */
const AnalysisResultsFormatter = ({ analysisText }) => {
  // =============================================================================
  // PARSING LOGIC
  // =============================================================================

  const parseAnalysis = (text) => {
    const sections = {
      visualDescription: '',
      composition: '',
      context: '',
      technical: '',
      textContent: '',
      interpretation: '',
      notableFeatures: '',
      multiImage: '',
      summary: ''
    };

    // Split by main sections
    const sectionRegex = /### 🔍 \*\*Visual Description:\*\*|### 🎨 \*\*Composition & Aesthetics:\*\*|### 🏞️ \*\*Context & Environment:\*\*|### 🔧 \*\*Technical Analysis:\*\*|### 📝 \*\*Text & Readable Content:\*\*|### 💭 \*\*Interpretation & Insights:\*\*|### ⭐ \*\*Notable Features:\*\*|### 🔗 \*\*Multi-Image Analysis\*\*|In summary/;
    
    const parts = text.split(sectionRegex);
    
    // Extract content for each section
    if (parts.length > 1) {
      sections.visualDescription = cleanText(parts[1] || '');
      sections.composition = cleanText(parts[2] || '');
      sections.context = cleanText(parts[3] || '');
      sections.technical = cleanText(parts[4] || '');
      sections.textContent = cleanText(parts[5] || '');
      sections.interpretation = cleanText(parts[6] || '');
      sections.notableFeatures = cleanText(parts[7] || '');
      sections.multiImage = cleanText(parts[8] || '');
      sections.summary = cleanText(parts[9] || '');
    }

    // If parsing fails, use the full text as summary
    if (!sections.visualDescription && !sections.composition) {
      sections.summary = cleanText(text);
    }

    return sections;
  };

  const cleanText = (text) => {
    return text
      .replace(/###|\*\*|\*|#{1,6}/g, '') // Remove markdown symbols
      .replace(/🔍|🎨|🏞️|🔧|📝|💭|⭐|🔗/g, '') // Remove emoji headers
      .replace(/\n\s*\n/g, '\n\n') // Clean up extra whitespace
      .trim();
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
        staggerChildren: 0.1
      }
    }
  };

  const sectionVariants = {
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

  // =============================================================================
  // SECTION CONFIGURATION
  // =============================================================================

  const sections = parseAnalysis(analysisText);

  const sectionConfig = [
    {
      key: 'visualDescription',
      title: 'Visual Description',
      icon: Eye,
      color: 'blue',
      description: 'What we can see in the image'
    },
    {
      key: 'composition',
      title: 'Composition & Aesthetics',
      icon: Palette,
      color: 'purple',
      description: 'Artistic style, colors, and visual elements'
    },
    {
      key: 'context',
      title: 'Context & Environment',
      icon: MapPin,
      color: 'green',
      description: 'Setting, location, and environmental details'
    },
    {
      key: 'technical',
      title: 'Technical Analysis',
      icon: Settings,
      color: 'orange',
      description: 'Camera settings and technical aspects'
    },
    {
      key: 'textContent',
      title: 'Text & Readable Content',
      icon: FileText,
      color: 'cyan',
      description: 'Any visible text, logos, or writing'
    },
    {
      key: 'interpretation',
      title: 'Interpretation & Insights',
      icon: Lightbulb,
      color: 'yellow',
      description: 'Meaning, story, and deeper analysis'
    },
    {
      key: 'notableFeatures',
      title: 'Notable Features',
      icon: Star,
      color: 'pink',
      description: 'Unique or standout elements'
    },
    {
      key: 'multiImage',
      title: 'Multi-Image Analysis',
      icon: Layers,
      color: 'indigo',
      description: 'Relationships between multiple images'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      purple: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
      green: 'text-green-400 bg-green-500/20 border-green-500/30',
      orange: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
      cyan: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
      yellow: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      pink: 'text-pink-400 bg-pink-500/20 border-pink-500/30',
      indigo: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30'
    };
    return colors[color] || colors.blue;
  };

  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================

  const renderSection = (config) => {
    const content = sections[config.key];
    if (!content || content.length < 10) return null;

    const colorClasses = getColorClasses(config.color);
    
    return (
      <motion.div
        key={config.key}
        className="glass-effect p-6 rounded-xl border border-white/10"
        variants={sectionVariants}
        whileHover={{ 
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
          borderColor: 'rgba(59, 130, 246, 0.4)'
        }}
      >
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <motion.div
            className={`p-3 rounded-xl ${colorClasses} flex-shrink-0`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <config.icon className="w-6 h-6" />
          </motion.div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-3">
              <h3 className="text-xl font-bold text-white mb-1">
                {config.title}
              </h3>
              <p className="text-sm text-gray-400">
                {config.description}
              </p>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {content}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSummary = () => {
    if (!sections.summary || sections.summary.length < 10) return null;
    
    return (
      <motion.div
        className="glass-effect p-8 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
        variants={sectionVariants}
        whileHover={{ 
          boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
          scale: 1.01
        }}
      >
        <div className="flex items-start space-x-4">
          <motion.div
            className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 flex-shrink-0"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Target className="w-8 h-8" />
          </motion.div>
          
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-2">
              Summary & Key Insights
            </h3>
            <p className="text-blue-200 text-sm mb-4">
              Overall analysis and conclusions
            </p>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-line">
                {sections.summary}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (!analysisText || analysisText.length < 50) {
    return (
      <div className="glass-effect p-8 rounded-xl text-center">
        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">No analysis available</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        variants={sectionVariants}
      >
        <h2 className="text-3xl font-bold gradient-text mb-2">
          AI Analysis Results
        </h2>
        <p className="text-gray-400">
          Comprehensive image analysis by Prompt Sherlock
        </p>
      </motion.div>

      {/* Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sectionConfig.map(renderSection)}
      </div>

      {/* Summary Section */}
      {renderSummary()}

      {/* Footer Actions */}
      <motion.div
        className="flex justify-center space-x-4 pt-6"
        variants={sectionVariants}
      >
        <motion.button
          className="glass-button px-6 py-3 text-white font-semibold bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            navigator.clipboard.writeText(analysisText);
            // Could add toast notification here
          }}
        >
          Copy Analysis
        </motion.button>
        
        <motion.button
          className="glass-button px-6 py-3 text-white font-semibold bg-gradient-to-r from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const blob = new Blob([analysisText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'prompt-sherlock-analysis.txt';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download Report
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default AnalysisResultsFormatter;