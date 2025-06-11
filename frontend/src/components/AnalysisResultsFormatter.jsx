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
  Sparkles
} from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Clean AnalysisResultsFormatter Component
 * Consistent snake_case naming throughout
 */
const AnalysisResultsFormatter = ({ 
  analysisText,
  metadata = null,
  onCopy = null,
  onClear = null,
  onNewAnalysis = null,
  showControls = true,
  showRawOutput = false
}) => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [copy_status, setCopyStatus] = useState('idle');

  // =============================================================================
  // UTILITY FUNCTIONS - Clean, single version
  // =============================================================================

  const formatGoalName = (goal) => {
    const goalNames = {
      'find_common_features': 'Feature Analysis',
      'copy_image': 'Image Recreation Prompt',
      'copy_character': 'Character Generation Prompt',
      'copy_style': 'Style Guide Creation'
    };
    return goalNames[goal] || goal?.replace(/_/g, ' ').trim() || 'Analysis';
  };

  const formatEngineName = (engine) => {
    const engineNames = {
      'midjourney': 'Midjourney',
      'dalle': 'DALL-E 3',
      'stable_diffusion': 'Stable Diffusion',
      'gemini_imagen': 'Gemini Imagen',
      'flux': 'Flux',
      'leonardo': 'Leonardo AI'
    };
    return engineNames[engine] || engine?.replace(/_/g, ' ') || '';
  };

  // =============================================================================
  // PARSING LOGIC
  // =============================================================================

  const parseAnalysis = (text) => {
    const sections = {
      visual_description: '',
      composition: '',
      context: '',
      technical: '',
      text_content: '',
      interpretation: '',
      notable_features: '',
      multi_image: '',
      summary: ''
    };

    const sectionRegex = /### 🔍 \*\*Visual Description:\*\*|### 🎨 \*\*Composition & Aesthetics:\*\*|### 🏞️ \*\*Context & Environment:\*\*|### 🔧 \*\*Technical Analysis:\*\*|### 📝 \*\*Text & Readable Content:\*\*|### 💭 \*\*Interpretation & Insights:\*\*|### ⭐ \*\*Notable Features:\*\*|### 🔗 \*\*Multi-Image Analysis\*\*|In summary/;
    
    const parts = text.split(sectionRegex);
    
    if (parts.length > 1) {
      sections.visual_description = cleanText(parts[1] || '');
      sections.composition = cleanText(parts[2] || '');
      sections.context = cleanText(parts[3] || '');
      sections.technical = cleanText(parts[4] || '');
      sections.text_content = cleanText(parts[5] || '');
      sections.interpretation = cleanText(parts[6] || '');
      sections.notable_features = cleanText(parts[7] || '');
      sections.multi_image = cleanText(parts[8] || '');
      sections.summary = cleanText(parts[9] || '');
    }

    if (!sections.visual_description && !sections.composition) {
      sections.summary = cleanText(text);
    }

    return sections;
  };

  const cleanText = (text) => {
    return text
      .replace(/###|\*\*|\*|#{1,6}/g, '')
      .replace(/🔍|🎨|🏞️|🔧|📝|💭|⭐|🔗/g, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  };

  // =============================================================================
  // OUTPUT FUNCTIONALITY
  // =============================================================================

  const handleCopyToClipboard = async () => {
    if (!analysisText) return;

    setCopyStatus('copying');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(analysisText);
      } else {
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
      onCopy?.();
      setTimeout(() => setCopyStatus('idle'), 3000);

    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

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
      key: 'visual_description',
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
      key: 'text_content',
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
      key: 'notable_features',
      title: 'Notable Features',
      icon: Star,
      color: 'pink',
      description: 'Unique or standout elements'
    },
    {
      key: 'multi_image',
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
          {metadata.image_count && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {metadata.image_count}
              </div>
              <div className="text-gray-400">
                Image{metadata.image_count !== 1 ? 's' : ''}
              </div>
            </div>
          )}
          
          {metadata.goal && (
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-400 mb-1">
                {formatGoalName(metadata.goal)}
              </div>
              <div className="text-gray-400">
                Analysis Type
              </div>
            </div>
          )}
          
          {metadata.engine && (
            <div className="text-center">
              <div className="text-lg font-semibold text-green-400 mb-1">
                {formatEngineName(metadata.engine)}
              </div>
              <div className="text-gray-400">
                Optimized For
              </div>
            </div>
          )}
          
          {metadata.processing_time && (
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-400 mb-1">
                {metadata.processing_time}
              </div>
              <div className="text-gray-400">
                Processing Time
              </div>
            </div>
          )}
        </div>
        
        {metadata.has_custom_prompt && (
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
          <motion.div
            className={`p-3 rounded-xl ${colorClasses} flex-shrink-0`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <config.icon className="w-6 h-6" />
          </motion.div>
          
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

  const renderControls = () => {
    if (!showControls) return null;

    return (
      <motion.div 
        className="flex flex-wrap gap-3 pt-6 border-t border-white/10"
        variants={sectionVariants}
      >
        {/* Copy Button */}
        <motion.button
          onClick={handleCopyToClipboard}
          disabled={copy_status === 'copying'}
          className={`
            flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300
            ${copy_status === 'success' 
              ? 'bg-green-600 text-white' 
              : copy_status === 'error'
              ? 'bg-red-600 text-white'
              : 'glass-button bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          whileHover={copy_status === 'idle' ? { scale: 1.05 } : {}}
          whileTap={copy_status === 'idle' ? { scale: 0.95 } : {}}
        >
          {copy_status === 'copying' && (
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
          {copy_status === 'success' && (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Copied!</span>
            </>
          )}
          {copy_status === 'error' && (
            <>
              <Copy className="w-4 h-4" />
              <span>Failed</span>
            </>
          )}
          {copy_status === 'idle' && (
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

        {/* Clear Button */}
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

        {/* New Analysis Button */}
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
          {metadata?.optimized_for ? `Optimized for ${formatEngineName(metadata.optimized_for)}` : 'Comprehensive AI-powered analysis'}
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

      {/* Control Buttons */}
      {renderControls()}

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
            {metadata.goal === 'find_common_features' ? (
              <>
                <p>• Use this analysis to better understand your image composition and elements</p>
                <p>• Look for insights that might improve future photography or design work</p>
              </>
            ) : (
              <>
                <p>• Copy this prompt and paste it into {formatEngineName(metadata.engine) || 'your chosen AI generator'} for best results</p>
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