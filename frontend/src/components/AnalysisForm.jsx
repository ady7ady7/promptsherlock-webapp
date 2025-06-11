import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Download,
  Copy,
  RefreshCw,
  Sparkles,
  ArrowRight,
  FileText,
  Target,
  Zap,
  RotateCcw
} from 'lucide-react';
import PropTypes from 'prop-types';

// Import the components
import ImageUploader from './ImageUploader';
import GoalSelection from './GoalSelection';
import EngineSelection from './EngineSelection';
import CustomPromptInput from './CustomPromptInput';

/**
 * Clean Analysis Form Component 
 * Consistent snake_case naming throughout
 */
const AnalysisForm = ({
  apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000',
  onAnalysisComplete,
  initialState = {}
}) => {
  // =============================================================================
  // STATE MANAGEMENT - Clean snake_case
  // =============================================================================
  
  const [formState, setFormState] = useState({
    images: initialState.images || [],
    selected_goal: initialState.selected_goal || '',
    selected_engine: initialState.selected_engine || '',
    custom_prompt: initialState.custom_prompt || '',
    is_loading: false,
    results: null,
    error: null,
    is_submitted: false,
    show_engine_selection: false
  });

  const [validation, setValidation] = useState({
    images: { is_valid: true, message: '' },
    goal: { is_valid: true, message: '' },
    engine: { is_valid: true, message: '' },
    prompt: { is_valid: true, message: '' }
  });

  const [outputState, setOutputState] = useState({
    copy_status: 'idle',
    show_raw_output: false
  });

  const resultsRef = useRef(null);

  // =============================================================================
  // API CONFIGURATION
  // =============================================================================
  
  const getApiEndpoint = useCallback((endpoint) => {
    const baseUrl = apiUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    if (baseUrl.includes('/api') && cleanEndpoint.startsWith('/api')) {
      return `${baseUrl}${cleanEndpoint.replace('/api', '')}`;
    }
    
    return `${baseUrl}${cleanEndpoint}`;
  }, [apiUrl]);

  // =============================================================================
  // OUTPUT FUNCTIONALITY
  // =============================================================================

  const handleCopyToClipboard = async () => {
    if (!formState.results?.analysis) return;

    setOutputState(prev => ({ ...prev, copy_status: 'copying' }));

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(formState.results.analysis);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = formState.results.analysis;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setOutputState(prev => ({ ...prev, copy_status: 'success' }));
      setTimeout(() => setOutputState(prev => ({ ...prev, copy_status: 'idle' })), 3000);

    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setOutputState(prev => ({ ...prev, copy_status: 'error' }));
      setTimeout(() => setOutputState(prev => ({ ...prev, copy_status: 'idle' })), 3000);
    }
  };

  const handleClearResults = () => {
    setFormState(prev => ({
      ...prev,
      results: null,
      error: null,
      is_submitted: false
    }));
    
    setOutputState({
      copy_status: 'idle',
      show_raw_output: false
    });
  };

  const handleNewAnalysis = () => {
    setFormState({
      images: [],
      selected_goal: '',
      selected_engine: '',
      custom_prompt: '',
      is_loading: false,
      results: null,
      error: null,
      is_submitted: false,
      show_engine_selection: false
    });

    setValidation({
      images: { is_valid: true, message: '' },
      goal: { is_valid: true, message: '' },
      engine: { is_valid: true, message: '' },
      prompt: { is_valid: true, message: '' }
    });
    
    setOutputState({
      copy_status: 'idle',
      show_raw_output: false
    });
  };

  // =============================================================================
  // PROMPT GENERATION LOGIC
  // =============================================================================
  
  const generateTailoredPrompt = useCallback((goal, engine, customPrompt, imageCount) => {
    const basePrompts = {
      find_common_features: `Analyze these ${imageCount} images and identify shared elements, themes, and characteristics. Look for:
- Common visual elements (colors, shapes, composition)
- Recurring themes or subjects
- Similar artistic or photographic styles
- Shared technical aspects (lighting, perspective, quality)
- Any patterns or connections between the images

Provide a detailed analysis of what makes these images similar and what common features they share.`,

      copy_image: `Create a detailed prompt for recreating these images accurately. Focus on:
- Overall composition and layout
- Color palette and lighting conditions
- Subject matter and positioning
- Artistic or photographic style
- Technical aspects (camera angle, depth of field)
- Mood and atmosphere
- Any specific details that define the image's character

Generate a comprehensive prompt that would allow someone to recreate similar images.`,

      copy_character: `Extract character details to create prompts for generating new scenes with the same character(s). Focus on:
- Physical appearance (facial features, build, proportions)
- Clothing and accessories
- Hairstyle and color
- Distinctive features or markings
- Pose and body language
- Character style and aesthetic
- Any unique characteristics

Create character descriptions that can be used to generate new scenes while maintaining character consistency.`,

      copy_style: `Analyze and describe the artistic/photographic style for recreating it in new images. Focus on:
- Visual style and aesthetic approach
- Color schemes and palettes
- Texture and brushwork (for art) or photographic technique
- Composition and framing choices
- Lighting style and mood
- Level of detail and realism
- Any signature elements of the style

Provide a style guide that can be used to create new images in the same artistic manner.`
    };

    let finalPrompt = basePrompts[goal] || basePrompts.find_common_features;

    // Add engine-specific optimization
    if (engine && ['copy_image', 'copy_character', 'copy_style'].includes(goal)) {
      const engineOptimizations = {
        midjourney: '\n\nOptimize this prompt for Midjourney, using artistic and creative language that works well with Midjourney\'s strengths in composition and artistic interpretation.',
        dalle: '\n\nOptimize this prompt for DALL-E 3, using precise and literal descriptions that take advantage of DALL-E\'s excellent prompt adherence and text rendering capabilities.',
        stable_diffusion: '\n\nOptimize this prompt for Stable Diffusion, using technical terminology and specific parameters that work well with Stable Diffusion\'s customization options.',
        gemini_imagen: '\n\nOptimize this prompt for Gemini Imagen, focusing on photorealistic details and high-quality image generation that showcases Imagen\'s photorealism strengths.',
        flux: '\n\nOptimize this prompt for Flux, using modern terminology and taking advantage of Flux\'s cutting-edge capabilities and speed.',
        leonardo: '\n\nOptimize this prompt for Leonardo AI, using professional terminology that aligns with Leonardo\'s focus on high-quality, professional content creation.'
      };

      finalPrompt += engineOptimizations[engine] || '';
    }

    if (customPrompt.trim()) {
      finalPrompt += `\n\nAdditional specific instructions: ${customPrompt.trim()}`;
    }

    return finalPrompt;
  }, []);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  const handleImagesChange = useCallback((newImages) => {
    setFormState(prev => ({
      ...prev,
      images: newImages,
      error: null
    }));

    setValidation(prev => ({
      ...prev,
      images: { is_valid: true, message: '' }
    }));
  }, []);

  const handleGoalChange = useCallback((goalId, requiresEngineSelection) => {
    setFormState(prev => ({
      ...prev,
      selected_goal: goalId,
      show_engine_selection: requiresEngineSelection,
      selected_engine: requiresEngineSelection ? prev.selected_engine : '',
      error: null
    }));

    setValidation(prev => ({
      ...prev,
      goal: { is_valid: true, message: '' }
    }));
  }, []);

  const handleEngineChange = useCallback((engineId) => {
    setFormState(prev => ({
      ...prev,
      selected_engine: engineId,
      error: null
    }));

    setValidation(prev => ({
      ...prev,
      engine: { is_valid: true, message: '' }
    }));
  }, []);

  const handleCustomPromptChange = useCallback((prompt) => {
    setFormState(prev => ({
      ...prev,
      custom_prompt: prompt,
      error: null
    }));

    setValidation(prev => ({
      ...prev,
      prompt: { is_valid: true, message: '' }
    }));
  }, []);

  // =============================================================================
  // VALIDATION LOGIC
  // =============================================================================
  
  const validateForm = useCallback(() => {
    const newValidation = {
      images: { is_valid: true, message: '' },
      goal: { is_valid: true, message: '' },
      engine: { is_valid: true, message: '' },
      prompt: { is_valid: true, message: '' }
    };

    if (formState.images.length === 0) {
      newValidation.images = {
        is_valid: false,
        message: 'Please upload at least one image'
      };
    } else if (formState.images.length > 10) {
      newValidation.images = {
        is_valid: false,
        message: 'Maximum 10 images allowed'
      };
    }

    if (!formState.selected_goal) {
      newValidation.goal = {
        is_valid: false,
        message: 'Please select an analysis goal'
      };
    }

    if (formState.show_engine_selection && !formState.selected_engine) {
      newValidation.engine = {
        is_valid: false,
        message: 'Please select an AI generation engine'
      };
    }

    if (formState.custom_prompt.length > 1000) {
      newValidation.prompt = {
        is_valid: false,
        message: 'Custom prompt must be less than 1000 characters'
      };
    }

    setValidation(newValidation);
    return Object.values(newValidation).every(field => field.is_valid);
  }, [formState]);

  // =============================================================================
  // FORM SUBMISSION
  // =============================================================================
  
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormState(prev => ({
      ...prev,
      is_loading: true,
      error: null,
      is_submitted: true
    }));

    try {
      const tailoredPrompt = generateTailoredPrompt(
        formState.selected_goal,
        formState.selected_engine,
        formState.custom_prompt,
        formState.images.length
      );

      const formData = new FormData();
      
      formState.images.forEach((image) => {
        formData.append('images', image.file);
      });
      
      // Clean parameter names - no duplication
      formData.append('prompt', tailoredPrompt);
      formData.append('goal', formState.selected_goal);
      if (formState.selected_engine) {
        formData.append('engine', formState.selected_engine);
      }

      console.log('🚀 Sending analysis request:', {
        imageCount: formState.images.length,
        goal: formState.selected_goal,
        engine: formState.selected_engine,
        hasCustomPrompt: Boolean(formState.custom_prompt)
      });

      const response = await axios.post(
        getApiEndpoint('/api/analyze'),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000,
        }
      );

      const results = {
        ...response.data,
        goal: formState.selected_goal,
        engine: formState.selected_engine,
        custom_prompt: formState.custom_prompt,
        tailored_prompt: tailoredPrompt,
        submitted_at: new Date().toISOString(),
        image_count: formState.images.length
      };

      console.log('✅ Analysis completed successfully:', {
        goal: results.goal,
        engine: results.engine,
        hasMetadata: Boolean(results.metadata),
        analysisLength: results.analysis?.length
      });

      setFormState(prev => ({
        ...prev,
        results,
        is_loading: false
      }));

      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }

      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);

    } catch (error) {
      console.error('Analysis failed:', error);
      
      let errorMessage = 'Analysis failed. Please try again.';
      
      if (error.response?.status === 413) {
        errorMessage = 'Files too large. Please reduce file sizes and try again.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again with fewer or smaller images.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      setFormState(prev => ({
        ...prev,
        error: errorMessage,
        is_loading: false
      }));
    }
  }, [formState, validateForm, generateTailoredPrompt, getApiEndpoint, onAnalysisComplete]);

  // =============================================================================
  // UTILITY FUNCTIONS
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
  // RENDER METHODS
  // =============================================================================
  
  const renderValidationErrors = () => {
    const errors = Object.entries(validation)
      .filter(([, field]) => !field.is_valid)
      .map(([key, field]) => ({ key, message: field.message }));

    if (errors.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-red-500/20 border border-red-500/50 rounded-lg p-4"
      >
        <div className="flex items-center space-x-2 text-red-300 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Please fix the following:</span>
        </div>
        <ul className="space-y-1 text-sm text-red-200">
          {errors.map(({ key, message }) => (
            <li key={key}>• {message}</li>
          ))}
        </ul>
      </motion.div>
    );
  };

  const renderApiError = () => {
    if (!formState.error) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-red-500/20 border border-red-500/50 rounded-lg p-4"
      >
        <div className="flex items-center space-x-2 text-red-300">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-medium">Analysis Failed</p>
            <p className="text-sm text-red-200 mt-1">{formState.error}</p>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderLoadingState = () => {
    if (!formState.is_loading) return null;

    const getLoadingMessage = () => {
      if (formState.selected_goal === 'find_common_features') {
        return 'Analyzing common features across your images...';
      } else if (formState.selected_goal.startsWith('copy_')) {
        return `Generating ${formState.selected_engine || 'AI'} prompts for ${formState.selected_goal.replace('copy_', '')} recreation...`;
      }
      return 'Analyzing your images...';
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div className="glass-effect p-8 rounded-lg text-center max-w-md mx-4">
          <div className="flex justify-center mb-4">
            <div className="spinner w-12 h-12"></div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {getLoadingMessage()}
          </h3>
          <p className="text-gray-300">
            This usually takes 30-60 seconds depending on image complexity and your selected goal.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Processing {formState.images.length} image{formState.images.length !== 1 ? 's' : ''}...</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderEnhancedResults = () => {
    if (!formState.results) return null;

    const { analysis, metadata } = formState.results;

    return (
      <motion.div
        ref={resultsRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Success Header */}
        <div className="text-center space-y-2">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <CheckCircle className="w-8 h-8 text-green-400" />
          </motion.div>
          
          <h2 className="text-2xl font-bold gradient-text">
            Analysis Complete!
          </h2>
          
          <p className="text-gray-300">
            Your {metadata?.image_count || formState.images.length} image{metadata?.image_count !== 1 ? 's' : ''} 
            {metadata?.image_count === 1 ? ' has' : ' have'} been analyzed successfully.
          </p>
        </div>

        {/* Enhanced Metadata Display */}
        <div className="glass-effect p-4 rounded-lg border border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-blue-300">
              <FileText className="w-4 h-4" />
              <span>Images: {metadata?.image_count || formState.images.length}</span>
            </div>
            
            {(metadata?.goal || formState.selected_goal) && (
              <div className="flex items-center space-x-2 text-purple-300">
                <Target className="w-4 h-4" />
                <span>Goal: {formatGoalName(metadata?.goal || formState.selected_goal)}</span>
              </div>
            )}
            
            {(metadata?.engine || formState.selected_engine) && (
              <div className="flex items-center space-x-2 text-green-300">
                <Zap className="w-4 h-4" />
                <span>Engine: {formatEngineName(metadata?.engine || formState.selected_engine)}</span>
              </div>
            )}
            
            {(metadata?.processing_time || formState.results.processingTime) && (
              <div className="flex items-center space-x-2 text-gray-300">
                <Clock className="w-4 h-4" />
                <span>{metadata?.processing_time || formState.results.processingTime}</span>
              </div>
            )}
          </div>
          
          {(metadata?.has_custom_prompt || formState.custom_prompt) && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <span className="text-xs text-yellow-300 font-medium">
                ✨ Enhanced with custom prompt
              </span>
            </div>
          )}
        </div>

        {/* Main Analysis Output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              Analysis Results
            </h3>
          </div>

          <textarea
            value={analysis}
            readOnly
            className="w-full p-4 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
            style={{
              minHeight: '300px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              fontSize: '14px',
              lineHeight: '1.6'
            }}
            placeholder="Analysis results will appear here..."
          />
          
          <div className="text-xs text-gray-400 text-right">
            {analysis?.length || 0} characters
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Copy Button */}
          <motion.button
            onClick={handleCopyToClipboard}
            disabled={outputState.copy_status === 'copying'}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
              ${outputState.copy_status === 'success' 
                ? 'bg-green-600 text-white' 
                : outputState.copy_status === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            whileHover={outputState.copy_status === 'idle' ? { scale: 1.05 } : {}}
            whileTap={outputState.copy_status === 'idle' ? { scale: 0.95 } : {}}
          >
            {outputState.copy_status === 'copying' && (
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
            {outputState.copy_status === 'success' && (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Copied!</span>
              </>
            )}
            {outputState.copy_status === 'error' && (
              <>
                <Copy className="w-4 h-4" />
                <span>Failed</span>
              </>
            )}
            {outputState.copy_status === 'idle' && (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy to Clipboard</span>
              </>
            )}
          </motion.button>

          {/* Clear Button */}
          <motion.button
            onClick={handleClearResults}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear</span>
          </motion.button>

          {/* Download Button */}
          <motion.button
            onClick={() => {
              const blob = new Blob([analysis], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `analysis-${Date.now()}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </motion.button>

          {/* New Analysis Button */}
          <motion.button
            onClick={handleNewAnalysis}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-4 h-4" />
            <span>New Analysis</span>
          </motion.button>
        </div>

        {/* Pro Tips */}
        <div className="glass-effect p-4 rounded-lg border border-white/10">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
            Pro Tips
          </h4>
          <div className="text-xs text-gray-300 space-y-1">
            {(metadata?.goal || formState.selected_goal) === 'find_common_features' ? (
              <>
                <p>• Use this analysis to better understand your image composition and elements</p>
                <p>• Look for insights that might improve future photography or design work</p>
              </>
            ) : (
              <>
                <p>• Copy this prompt and paste it into {formatEngineName(metadata?.engine || formState.selected_engine) || 'your chosen AI generator'} for best results</p>
                <p>• You may need to adjust parameters based on your specific use case</p>
                <p>• Experiment with variations to achieve your desired output</p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  if (formState.results) {
    return (
      <motion.div
        className="max-w-4xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {renderEnhancedResults()}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Image Upload */}
        <motion.div variants={itemVariants}>
          <ImageUploader
            onImagesChange={handleImagesChange}
            initialImages={formState.images}
            maxFiles={10}
            maxFileSize={10 * 1024 * 1024}
            disabled={formState.is_loading}
            loading={formState.is_loading}
          />
        </motion.div>

        {/* Step 2: Goal Selection */}
        <AnimatePresence>
          {formState.images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ 
                opacity: 1, 
                height: 'auto', 
                marginTop: 32,
                transition: { duration: 0.5, delay: 0.2 }
              }}
              exit={{ 
                opacity: 0, 
                height: 0, 
                marginTop: 0,
                transition: { duration: 0.3 }
              }}
            >
              <GoalSelection
                selectedGoal={formState.selected_goal}
                onGoalChange={handleGoalChange}
                disabled={formState.is_loading}
                imageCount={formState.images.length}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Engine Selection */}
        <AnimatePresence>
          {formState.show_engine_selection && formState.selected_goal && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ 
                opacity: 1, 
                height: 'auto', 
                marginTop: 32,
                transition: { duration: 0.5, delay: 0.1 }
              }}
              exit={{ 
                opacity: 0, 
                height: 0, 
                marginTop: 0,
                transition: { duration: 0.3 }
              }}
            >
              <EngineSelection
                selectedEngine={formState.selected_engine}
                onEngineChange={handleEngineChange}
                disabled={formState.is_loading}
                goalType={formState.selected_goal}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 4: Custom Prompt Input */}
        <AnimatePresence>
          {formState.selected_goal && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ 
                opacity: 1, 
                height: 'auto', 
                marginTop: 32,
                transition: { duration: 0.5, delay: 0.1 }
              }}
              exit={{ 
                opacity: 0, 
                height: 0, 
                marginTop: 0,
                transition: { duration: 0.3 }
              }}
            >
              <CustomPromptInput
                value={formState.custom_prompt}
                onChange={handleCustomPromptChange}
                disabled={formState.is_loading}
                selectedGoal={formState.selected_goal}
                selectedEngine={formState.selected_engine}
                imageCount={formState.images.length}
                maxLength={1000}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Errors */}
        <AnimatePresence>
          {renderValidationErrors()}
        </AnimatePresence>

        {/* Step 5: Submit Button */}
        <AnimatePresence>
          {formState.selected_goal && (!formState.show_engine_selection || formState.selected_engine) && (
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { duration: 0.5, delay: 0.2 }
              }}
              exit={{ opacity: 0, y: 20 }}
            >
              <motion.button
                type="submit"
                disabled={formState.is_loading || formState.images.length === 0 || !formState.selected_goal}
                className={`
                  glow-button flex items-center space-x-3 px-8 py-4 text-lg font-semibold
                  ${formState.is_loading || formState.images.length === 0 || !formState.selected_goal
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105 active:scale-95'
                  }
                `}
                whileHover={!formState.is_loading && formState.images.length > 0 && formState.selected_goal ? { scale: 1.05 } : {}}
                whileTap={!formState.is_loading && formState.images.length > 0 && formState.selected_goal ? { scale: 0.95 } : {}}
              >
                {formState.is_loading ? (
                  <>
                    <div className="spinner w-5 h-5"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>
                      Analyze {formState.images.length} Image{formState.images.length !== 1 ? 's' : ''}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Indicator */}
        <AnimatePresence>
          {formState.images.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center space-x-4 text-sm text-gray-400"
            >
              <div className={`flex items-center space-x-2 ${formState.images.length > 0 ? 'text-green-400' : ''}`}>
                <div className={`w-3 h-3 rounded-full ${formState.images.length > 0 ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span>Images Uploaded</span>
              </div>
              <ArrowRight className="w-4 h-4" />
              <div className={`flex items-center space-x-2 ${formState.selected_goal ? 'text-green-400' : ''}`}>
                <div className={`w-3 h-3 rounded-full ${formState.selected_goal ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span>Goal Selected</span>
              </div>
              {formState.show_engine_selection && (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <div className={`flex items-center space-x-2 ${formState.selected_engine ? 'text-green-400' : ''}`}>
                    <div className={`w-3 h-3 rounded-full ${formState.selected_engine ? 'bg-green-400' : 'bg-gray-600'}`} />
                    <span>Engine Selected</span>
                  </div>
                </>
              )}
              <ArrowRight className="w-4 h-4" />
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-600" />
                <span>Ready to Analyze</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* API Error Display */}
      <AnimatePresence>
        {renderApiError()}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {renderLoadingState()}
      </AnimatePresence>
    </motion.div>
  );
};

AnalysisForm.propTypes = {
  apiUrl: PropTypes.string,
  onAnalysisComplete: PropTypes.func,
  initialState: PropTypes.shape({
    images: PropTypes.array,
    selected_goal: PropTypes.string,
    selected_engine: PropTypes.string,
    custom_prompt: PropTypes.string
  })
};

export default AnalysisForm;