// frontend/src/components/FinalOutput.jsx
// Professional, clean output component for the FINAL PROMPT only

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  Check, 
  RotateCcw, 
  Download, 
  Sparkles,
  FileText,
  Target,
  Zap,
  Clock,
  X
} from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * FinalOutput Component - Clean, Professional Prompt Display
 * Shows ONLY the final prompt/analysis in a beautiful, copy-ready format
 */
const FinalOutput = ({
  analysis,
  metadata = {},
  onClear,
  onNewAnalysis,
  className = ''
}) => {
  const [copy_status, setCopyStatus] = useState('idle');
  const [is_expanded, setIsExpanded] = useState(true);
  const textareaRef = useRef(null);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  const formatGoalName = (goal) => {
    const goalNames = {
      'find_common_features': 'Visual Analysis',
      'copy_image': 'Image Recreation Prompt',
      'copy_character': 'Character Generation Prompt',
      'copy_style': 'Style Guide'
    };
    return goalNames[goal] || 'Analysis Result';
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
    return engineNames[engine] || '';
  };

  const getOutputTitle = () => {
    const goalName = formatGoalName(metadata.goal);
    const engineName = formatEngineName(metadata.engine);
    
    if (metadata.goal === 'find_common_features') {
      return goalName;
    }
    
    return engineName ? `${goalName} for ${engineName}` : goalName;
  };

  const getOutputDescription = () => {
    if (metadata.goal === 'find_common_features') {
      return 'Comprehensive visual analysis of your images';
    }
    
    return 'Copy this prompt and paste it into your AI generator for best results';
  };

  // =============================================================================
  // COPY FUNCTIONALITY
  // =============================================================================

  const handleCopyToClipboard = async () => {
    if (!analysis) return;

    setCopyStatus('copying');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(analysis);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = analysis;
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
      setTimeout(() => setCopyStatus('idle'), 3000);

    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  const handleDownload = () => {
    const filename = `${metadata.goal || 'analysis'}-${Date.now()}.txt`;
    const blob = new Blob([analysis], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && analysis) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 200)}px`;
    }
  }, [analysis]);

  // =============================================================================
  // ANIMATION VARIANTS
  // =============================================================================

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================

  const renderMetadataBar = () => (
    <motion.div 
      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
      variants={itemVariants}
    >
      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2 text-blue-300">
          <FileText className="w-4 h-4" />
          <span>{metadata.image_count || 1} image{metadata.image_count !== 1 ? 's' : ''}</span>
        </div>
        
        {metadata.goal && (
          <div className="flex items-center space-x-2 text-purple-300">
            <Target className="w-4 h-4" />
            <span>{formatGoalName(metadata.goal)}</span>
          </div>
        )}
        
        {metadata.engine && (
          <div className="flex items-center space-x-2 text-green-300">
            <Zap className="w-4 h-4" />
            <span>{formatEngineName(metadata.engine)}</span>
          </div>
        )}
        
        {metadata.processing_time && (
          <div className="flex items-center space-x-2 text-gray-300">
            <Clock className="w-4 h-4" />
            <span>{metadata.processing_time}</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {metadata.has_custom_prompt && (
          <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full">
            Enhanced
          </span>
        )}
        <span className="text-xs text-gray-400">
          {analysis?.length || 0} chars
        </span>
      </div>
    </motion.div>
  );

  const renderOutputBox = () => (
    <motion.div 
      className="space-y-4"
      variants={itemVariants}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">
          {getOutputTitle()}
        </h3>
        
        <button
          onClick={() => setIsExpanded(!is_expanded)}
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          title={is_expanded ? 'Collapse' : 'Expand'}
        >
          <motion.div
            animate={{ rotate: is_expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <X className="w-4 h-4" />
          </motion.div>
        </button>
      </div>

      <p className="text-sm text-gray-400">
        {getOutputDescription()}
      </p>

      <AnimatePresence>
        {is_expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={analysis}
                readOnly
                className="w-full p-6 bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-white/20 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
                style={{
                  minHeight: '250px',
                  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
                  fontSize: '15px',
                  lineHeight: '1.7',
                  letterSpacing: '0.01em'
                }}
                placeholder="Your analysis will appear here..."
              />
              
              {/* Subtle gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none rounded-xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const renderActionButtons = () => (
    <motion.div 
      className="flex flex-wrap gap-3"
      variants={itemVariants}
    >
      {/* Primary Copy Button */}
      <motion.button
        onClick={handleCopyToClipboard}
        disabled={copy_status === 'copying'}
        className={`
          flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300
          ${copy_status === 'success' 
            ? 'bg-green-600 text-white shadow-green-500/25' 
            : copy_status === 'error'
            ? 'bg-red-600 text-white shadow-red-500/25'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-500/25'
          }
          shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed
        `}
        whileHover={copy_status === 'idle' ? { scale: 1.05, y: -2 } : {}}
        whileTap={copy_status === 'idle' ? { scale: 0.95 } : {}}
      >
        {copy_status === 'copying' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Copy className="w-5 h-5" />
            </motion.div>
            <span>Copying...</span>
          </>
        )}
        {copy_status === 'success' && (
          <>
            <Check className="w-5 h-5" />
            <span>Copied!</span>
          </>
        )}
        {copy_status === 'error' && (
          <>
            <Copy className="w-5 h-5" />
            <span>Failed</span>
          </>
        )}
        {copy_status === 'idle' && (
          <>
            <Copy className="w-5 h-5" />
            <span>Copy {metadata.output_type === 'prompt' ? 'Prompt' : 'Analysis'}</span>
          </>
        )}
      </motion.button>

      {/* Secondary Actions */}
      <motion.button
        onClick={handleDownload}
        className="flex items-center space-x-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all duration-300 shadow-emerald-500/25 shadow-lg hover:shadow-xl"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <Download className="w-4 h-4" />
        <span>Download</span>
      </motion.button>

      <motion.button
        onClick={onClear}
        className="flex items-center space-x-2 px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-300 shadow-slate-500/25 shadow-lg hover:shadow-xl"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <RotateCcw className="w-4 h-4" />
        <span>Clear</span>
      </motion.button>

      <motion.button
        onClick={onNewAnalysis}
        className="flex items-center space-x-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all duration-300 shadow-purple-500/25 shadow-lg hover:shadow-xl"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-4 h-4" />
        <span>New Analysis</span>
      </motion.button>
    </motion.div>
  );

  const renderProTips = () => {
    if (!metadata.goal) return null;

    return (
      <motion.div 
        className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4"
        variants={itemVariants}
      >
        <h4 className="text-amber-300 font-semibold mb-2 flex items-center">
          <Sparkles className="w-4 h-4 mr-2" />
          Pro Tips
        </h4>
        <div className="text-sm text-amber-100/90 space-y-1">
          {metadata.goal === 'find_common_features' ? (
            <>
              <p>• Use this analysis to understand visual patterns and improve your creative work</p>
              <p>• Look for insights that could enhance future photography or design projects</p>
            </>
          ) : (
            <>
              <p>• Copy the prompt above and paste it directly into {formatEngineName(metadata.engine) || 'your AI generator'}</p>
              <p>• Fine-tune parameters like aspect ratio, style strength, or seed for variations</p>
              <p>• Experiment with slight modifications to achieve your perfect result</p>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (!analysis) {
    return null;
  }

  return (
    <motion.div
      className={`max-w-4xl mx-auto space-y-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Success Header */}
      <motion.div 
        className="text-center space-y-3"
        variants={itemVariants}
      >
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: "spring", delay: 0.2 }}
        >
          <Check className="w-8 h-8 text-green-400" />
        </motion.div>
        
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          {metadata.output_type === 'prompt' ? 'Your Prompt is Ready!' : 'Analysis Complete!'}
        </h1>
        
        <p className="text-gray-300 text-lg">
          {metadata.output_type === 'prompt' 
            ? 'Copy the optimized prompt below and use it in your AI generator'
            : 'Your detailed visual analysis is ready for review'
          }
        </p>
      </motion.div>

      {/* Metadata Bar */}
      {renderMetadataBar()}

      {/* Main Output Box */}
      {renderOutputBox()}

      {/* Action Buttons */}
      {renderActionButtons()}

      {/* Pro Tips */}
      {renderProTips()}
    </motion.div>
  );
};

FinalOutput.propTypes = {
  analysis: PropTypes.string.isRequired,
  metadata: PropTypes.object,
  onClear: PropTypes.func.isRequired,
  onNewAnalysis: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default FinalOutput;