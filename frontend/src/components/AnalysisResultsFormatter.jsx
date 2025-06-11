import React, { useState } from 'react';
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
  Target,
  Copy,
  Download,
  RotateCcw,
  CheckCircle,
  Clock,
  Zap,
  Sparkles
} from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Enhanced AnalysisResultsFormatter Component
 * 
 * Transforms raw AI analysis text into a beautiful, structured format
 * with proper sections, icons, professional styling, and enhanced output controls
 */
const AnalysisResultsFormatter = ({ 
  analysisText,
  metadata = null,           // NEW: Enhanced metadata from API
  onCopy = null,             // NEW: Callback for copy action
  onClear = null,            // NEW: Callback for clear action
  onNewAnalysis = null,      // NEW: Callback for new analysis
  showControls = true,       // NEW: Whether to show copy/clear buttons
  showRawOutput = false      // NEW: Whether to show raw textarea
}) => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [copyStatus, setCopyStatus] = useState('idle'); // idle, copying, success, error

  // =============================================================================
  // PARSING LOGIC (Enhanced)
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
  // ENHANCED OUTPUT FUNCTIONALITY
  // =============================================================================

  /**
   * Handle copying analysis to clipboard
   */
  const handleCopyToClipboard = async () => {
    if (!analysisText) return;

    setCopyStatus('copying');

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(analysisText);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = analysisText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setCopyStatus('success');
      
      // Notify parent component if callback provided
      onCopy?.();
      
      // Reset status after delay
      setTimeout(() => setCopyStatus('idle'), 3000);

    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  /**
   * Handle download
   */
  const handleDownload = () => {
    const blob = new Blob([analysisText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Format goal name for display
   */
  const formatGoalName = (goal) => {
    const goalNames = {
      'find_common_features': 'Feature Analysis',
      'findFeatures': 'Feature Analysis',
      'copy_image': 'Image Recreation Prompt',
      'copyImage': 'Image Recreation Prompt',
      'copy_character': 'Character Generation Prompt',
      'copyCharacter': 'Character Generation Prompt',
      'copy_style': 'Style Guide Creation',
      'copyStyle': 'Style Guide Creation'
    };
    return goalNames[goal] || goal?.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim() || 'Analysis';
  };

  /**
   * Format engine name for display
   */
  const formatEngineName = (engine) => {
    const engineNames = {
      'midjourney': 'Midjourney',
      'dalle': 'DALL-E 3',
      'stable_diffusion': 'Stable Diffusion',
      'stableDiffusion': 'Stable Diffusion',
      'gemini_imagen': 'Gemini Imagen',
      'geminiImagen': 'Gemini Imagen',
      'flux': 'Flux',
      'leonardo': 'Leonardo AI'
    };
    return engineNames[engine] || engine?.replace(/_/g, ' ') || '';
  };

  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================

  /**
   * Render enhanced metadata section
   */
  const renderEnhancedMetadata = () => {
    if (!metadata) return null;

    return (
      <motion.div 
        className="mb-8 p-6 glass-effect rounded-xl border border-white/10"
        variants={sectionVariants}
      >
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-400" />
          Analysis Details
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {metadata.imageCount && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {metadata.imageCount}
              </div>
              <div className="text-gray-400">
                Image{metadata.imageCount !== 1 ? 's' : ''}
              </div>
            </div>
          )}
          
          {(metadata.outputGoal || metadata.goal) && (
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-400 mb-1">
                {formatGoalName(metadata.outputGoal || metadata.goal)}
              </div>
              <div className="text-gray-400">
                Analysis Type
              </div>
            </div>
          )}
          
          {(metadata.generationEngine || metadata.engine) && (
            <div className="text-center">
              <div className="text-lg font-semibold text-green-400 mb-1">
                {formatEngineName(metadata.generationEngine || metadata.engine)}
              </div>
              <div className="text-gray-400">
                Optimized For
              </div>
            </div>
          )}
          
          {metadata.processingTime && (
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-400 mb-1">
                {metadata.processingTime}
              </div>
              <div className="text-gray-400">
                Processing Time
              </div>
            </div>
          )}
        </div>
        
        {(metadata.hasCustomPrompt || metadata.customPrompt) && (
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <span className="inline-flex items-center text-sm text-yellow-300 font-medium">
              <Sparkles className="w-4 h-4 mr-1" />
              Enhanced with custom instructions
            </span>
          </div>
        )}
      </motion.div>
    );
  };

  /**
   * Render analysis section
   */
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

  /**
   * Render summary section
   */
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

  /**
   * Render raw output section
   */
  const renderRawOutput = () => {
    if (!showRawOutput) return null;

    return (
      <motion.div 
        className="space-y-4"
        variants={sectionVariants}
      >
        <h4 className="text-lg font-semibold text-white flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-400" />
          Raw Analysis Output
        </h4>
        
        <textarea
          value={analysisText}
          readOnly
          className="w-full p-4 bg-black/20 border border-white/10 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
          style={{
            minHeight: '200px',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: '14px',
            lineHeight: '1.6'
          }}
        />
        
        <div className="text-xs text-gray-400 text-right">
          {analysisText?.length || 0} characters
        </div>
      </motion.div>
    );
  };

  /**
   * Render enhanced control buttons
   */
  const renderEnhancedControls = () => {
    if (!showControls) return null;

    return (
      <motion.div 
        className="flex flex-wrap gap-3 pt-6 border-t border-white/10"
        variants={sectionVariants}
      >
        {/* Copy Button */}
        <motion.button
          onClick={handleCopyToClipboard}
          disabled={copyStatus === 'copying'}
          className={`
            flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300
            ${copyStatus === 'success' 
              ? 'bg-green-600 text-white' 
              : copyStatus === 'error'
              ? 'bg-red-600 text-white'
              : 'glass-button bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          whileHover={copyStatus === 'idle' ? { scale: 1.05 } : {}}
          whileTap={copyStatus === 'idle' ? { scale: 0.95 } : {}}
        >
          {copyStatus === 'copying' && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Copy className="w-4 h-4" />
              </motion.div>
              <span>Copying...</span>
            </>
          )}
          {copyStatus === 'success' && (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Copied!</span>
            </>
          )}
          {copyStatus === 'error' && (
            <>
              <Copy className="w-4 h-4" />
              <span>Failed</span>
            </>
          )}
          {copyStatus === 'idle' && (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Analysis</span>
            </>
          )}
        </motion.button>

        {/* Download Button */}
        <motion.button
          onClick={handleDownload}
          className="glass-button px-6 py-3 text-white font-semibold bg-gradient-to-r from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </motion.button>

        {/* Clear Button (if callback provided) */}
        {onClear && (
          <motion.button
            onClick={onClear}
            className="glass-button px-6 py-3 text-white font-semibold bg-gradient-to-r from-gray-500/20 to-slate-500/20 hover:from-gray-500/30 hover:to-slate-500/30 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </motion.button>
        )}

        {/* New Analysis Button (if callback provided) */}
        {onNewAnalysis && (
          <motion.button
            onClick={onNewAnalysis}
            className="glass-button px-6 py-3 text-white font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            New Analysis
          </motion.button>
        )}
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
      {/* Success Header */}
      <motion.div
        className="text-center mb-8"
        variants={sectionVariants}
      >
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          <CheckCircle className="w-8 h-8 text-green-400" />
        </motion.div>
        
        <h2 className="text-3xl font-bold gradient-text mb-2">
          Analysis Complete!
        </h2>
        
        <p className="text-gray-400">
          {metadata?.optimizedFor ? `Optimized for ${formatEngineName(metadata.optimizedFor)}` : 'Comprehensive AI-powered analysis'}
        </p>
      </motion.div>

      {/* Enhanced metadata display */}
      {renderEnhancedMetadata()}

      {/* Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sectionConfig.map(renderSection)}
      </div>

      {/* Summary Section */}
      {renderSummary()}

      {/* Raw Output Section */}
      {renderRawOutput()}

      {/* Enhanced Control Buttons */}
      {renderEnhancedControls()}

      {/* Pro Tips */}
      {metadata && (
        <motion.div 
          className="glass-effect p-4 rounded-lg border border-white/10"
          variants={sectionVariants}
        >
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
            Pro Tips
          </h4>
          <div className="text-xs text-gray-300 space-y-1">
            {(metadata.outputGoal === 'find_common_features' || metadata.outputGoal === 'findFeatures') ? (
              <>
                <p>• Use this analysis to better understand your image composition and elements</p>
                <p>• Look for insights that might improve future photography or design work</p>
              </>
            ) : (
              <>
                <p>• Copy this prompt and paste it into {formatEngineName(metadata.generationEngine || metadata.engine) || 'your chosen AI generator'} for best results</p>
                <p>• You may need to adjust parameters based on your specific use case</p>
                <p>• Experiment with variations to achieve your desired output</p>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

AnalysisResultsFormatter.propTypes = {
  analysisText: PropTypes.string.isRequired,
  metadata: PropTypes.object,
  onCopy: PropTypes.func,
  onClear: PropTypes.func,
  onNewAnalysis: PropTypes.func,
  showControls: PropTypes.bool,
  showRawOutput: PropTypes.bool
};

export default AnalysisResultsFormatter;