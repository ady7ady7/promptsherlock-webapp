// frontend/src/components/AnalysisForm.jsx - ENHANCED VERSION
// Implements the new goal-based user flow with separate components

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
  ArrowRight
} from 'lucide-react';
import PropTypes from 'prop-types';

// Import the new components
import ImageUploader from './ImageUploader';
import GoalSelection from './GoalSelection';
import EngineSelection from './EngineSelection';
import CustomPromptInput from './CustomPromptInput';

/**
 * Enhanced Analysis Form Component with Goal-Based User Flow
 * 
 * New Flow:
 * 1. Image Upload
 * 2. Goal Selection (appears after images uploaded)
 * 3. Engine Selection (conditional, for prompt generation goals)
 * 4. Custom Prompt Input (enhanced with contextual tips)
 * 5. Final Analysis with tailored prompts
 */
const AnalysisForm = ({
  apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000',
  onAnalysisComplete,
  initialState = {}
}) => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [formState, setFormState] = useState({
    images: initialState.images || [],
    selectedGoal: initialState.selectedGoal || '',
    selectedEngine: initialState.selectedEngine || '',
    customPrompt: initialState.customPrompt || '',
    isLoading: false,
    results: null,
    error: null,
    isSubmitted: false,
    showEngineSelection: false
  });

  const [validation, setValidation] = useState({
    images: { isValid: true, message: '' },
    goal: { isValid: true, message: '' },
    engine: { isValid: true, message: '' },
    prompt: { isValid: true, message: '' }
  });

  // Refs for form elements
  const resultsRef = useRef(null);

  // =============================================================================
  // API CONFIGURATION
  // =============================================================================
  
  const getApiEndpoint = useCallback((endpoint) => {
    const baseUrl = apiUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Avoid double /api/ in URL
    if (baseUrl.includes('/api') && cleanEndpoint.startsWith('/api')) {
      return `${baseUrl}${cleanEndpoint.replace('/api', '')}`;
    }
    
    return `${baseUrl}${cleanEndpoint}`;
  }, [apiUrl]);

  // =============================================================================
  // PROMPT GENERATION LOGIC
  // =============================================================================
  
  /**
   * Generate tailored prompts based on selected goal and engine
   */
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

    // Add custom prompt if provided
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

    // Clear image validation
    setValidation(prev => ({
      ...prev,
      images: { isValid: true, message: '' }
    }));
  }, []);

  const handleGoalChange = useCallback((goalId, requiresEngineSelection) => {
    setFormState(prev => ({
      ...prev,
      selectedGoal: goalId,
      showEngineSelection: requiresEngineSelection,
      selectedEngine: requiresEngineSelection ? prev.selectedEngine : '',
      error: null
    }));

    // Clear goal validation
    setValidation(prev => ({
      ...prev,
      goal: { isValid: true, message: '' }
    }));
  }, []);

  const handleEngineChange = useCallback((engineId) => {
    setFormState(prev => ({
      ...prev,
      selectedEngine: engineId,
      error: null
    }));

    // Clear engine validation
    setValidation(prev => ({
      ...prev,
      engine: { isValid: true, message: '' }
    }));
  }, []);

  const handleCustomPromptChange = useCallback((prompt) => {
    setFormState(prev => ({
      ...prev,
      customPrompt: prompt,
      error: null
    }));

    // Clear prompt validation
    setValidation(prev => ({
      ...prev,
      prompt: { isValid: true, message: '' }
    }));
  }, []);

  // =============================================================================
  // VALIDATION LOGIC
  // =============================================================================
  
  const validateForm = useCallback(() => {
    const newValidation = {
      images: { isValid: true, message: '' },
      goal: { isValid: true, message: '' },
      engine: { isValid: true, message: '' },
      prompt: { isValid: true, message: '' }
    };

    // Validate images
    if (formState.images.length === 0) {
      newValidation.images = {
        isValid: false,
        message: 'Please upload at least one image'
      };
    } else if (formState.images.length > 10) {
      newValidation.images = {
        isValid: false,
        message: 'Maximum 10 images allowed'
      };
    }

    // Validate goal selection
    if (!formState.selectedGoal) {
      newValidation.goal = {
        isValid: false,
        message: 'Please select an analysis goal'
      };
    }

    // Validate engine selection (if required)
    if (formState.showEngineSelection && !formState.selectedEngine) {
      newValidation.engine = {
        isValid: false,
        message: 'Please select an AI generation engine'
      };
    }

    // Validate custom prompt length
    if (formState.customPrompt.length > 1000) {
      newValidation.prompt = {
        isValid: false,
        message: 'Custom prompt must be less than 1000 characters'
      };
    }

    setValidation(newValidation);

    // Return overall validity
    return Object.values(newValidation).every(field => field.isValid);
  }, [formState]);

  // =============================================================================
  // FORM SUBMISSION
  // =============================================================================
  
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setFormState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isSubmitted: true
    }));

    try {
      // Generate the tailored prompt
      const tailoredPrompt = generateTailoredPrompt(
        formState.selectedGoal,
        formState.selectedEngine,
        formState.customPrompt,
        formState.images.length
      );

      // Prepare form data
      const formData = new FormData();
      
      // Add images
      formState.images.forEach((image) => {
        formData.append('images', image.file);
      });
      
      // Add the tailored prompt
      formData.append('prompt', tailoredPrompt);
      
      // Add metadata for backend processing
      formData.append('goal', formState.selectedGoal);
      if (formState.selectedEngine) {
        formData.append('engine', formState.selectedEngine);
      }

      // Submit to API
      const response = await axios.post(
        getApiEndpoint('/api/analyze'),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 minute timeout
        }
      );

      const results = {
        ...response.data,
        goal: formState.selectedGoal,
        engine: formState.selectedEngine,
        customPrompt: formState.customPrompt,
        tailoredPrompt: tailoredPrompt,
        submittedAt: new Date().toISOString(),
        imageCount: formState.images.length
      };

      setFormState(prev => ({
        ...prev,
        results,
        isLoading: false
      }));

      // Callback to parent
      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }

      // Scroll to results
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
        isLoading: false
      }));
    }
  }, [formState, validateForm, generateTailoredPrompt, getApiEndpoint, onAnalysisComplete]);

  // =============================================================================
  // FORM RESET
  // =============================================================================
  
  const handleReset = useCallback(() => {
    setFormState({
      images: [],
      selectedGoal: '',
      selectedEngine: '',
      customPrompt: '',
      isLoading: false,
      results: null,
      error: null,
      isSubmitted: false,
      showEngineSelection: false
    });

    setValidation({
      images: { isValid: true, message: '' },
      goal: { isValid: true, message: '' },
      engine: { isValid: true, message: '' },
      prompt: { isValid: true, message: '' }
    });
  }, []);

  // =============================================================================
  // RENDER METHODS
  // =============================================================================
  
  const renderValidationErrors = () => {
    const errors = Object.entries(validation)
      .filter(([, field]) => !field.isValid)
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
    if (!formState.isLoading) return null;

    const getLoadingMessage = () => {
      if (formState.selectedGoal === 'find_common_features') {
        return 'Analyzing common features across your images...';
      } else if (formState.selectedGoal.startsWith('copy_')) {
        return `Generating ${formState.selectedEngine || 'AI'} prompts for ${formState.selectedGoal.replace('copy_', '')} recreation...`;
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

  const renderResults = () => {
    if (!formState.results) return null;

    return (
      <motion.div
        ref={resultsRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-effect p-6 rounded-lg space-y-6"
      >
        {/* Success Header */}
        <div className="flex items-center space-x-3 text-green-400">
          <CheckCircle className="w-6 h-6" />
          <h3 className="text-2xl font-bold">Analysis Complete!</h3>
        </div>

        {/* Analysis Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-blue-500/10 p-3 rounded-lg">
            <span className="text-blue-300 font-medium">Goal:</span>
            <p className="text-white mt-1 capitalize">
              {formState.results.goal?.replace('_', ' ') || 'Analysis'}
            </p>
          </div>
          <div className="bg-purple-500/10 p-3 rounded-lg">
            <span className="text-purple-300 font-medium">Images:</span>
            <p className="text-white mt-1">{formState.results.imageCount}</p>
          </div>
          {formState.results.engine && (
            <div className="bg-green-500/10 p-3 rounded-lg">
              <span className="text-green-300 font-medium">Engine:</span>
              <p className="text-white mt-1 capitalize">
                {formState.results.engine.replace('_', ' ')}
              </p>
            </div>
          )}
          <div className="bg-orange-500/10 p-3 rounded-lg">
            <span className="text-orange-300 font-medium">Processing Time:</span>
            <p className="text-white mt-1">
              {formState.results.processingTime || 'N/A'}
            </p>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span>Analysis Results</span>
          </h4>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
            <pre className="whitespace-pre-wrap text-gray-100 leading-relaxed">
              {formState.results.analysis}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <motion.button
            type="button"
            onClick={() => navigator.clipboard.writeText(formState.results.analysis)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Copy className="w-4 h-4" />
            <span>Copy Results</span>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => {
              const blob = new Blob([formState.results.analysis], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `analysis-${Date.now()}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </motion.button>

          <motion.button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Analyze New Images</span>
          </motion.button>
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

  // Show results if available
  if (formState.results) {
    return (
      <motion.div
        className="max-w-4xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {renderResults()}
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
            disabled={formState.isLoading}
            loading={formState.isLoading}
          />
        </motion.div>

        {/* Step 2: Goal Selection (appears after images uploaded) */}
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
                selectedGoal={formState.selectedGoal}
                onGoalChange={handleGoalChange}
                disabled={formState.isLoading}
                imageCount={formState.images.length}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Engine Selection (conditional, for prompt generation goals) */}
        <AnimatePresence>
          {formState.showEngineSelection && formState.selectedGoal && (
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
                selectedEngine={formState.selectedEngine}
                onEngineChange={handleEngineChange}
                disabled={formState.isLoading}
                goalType={formState.selectedGoal}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 4: Custom Prompt Input (enhanced) */}
        <AnimatePresence>
          {formState.selectedGoal && (
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
                value={formState.customPrompt}
                onChange={handleCustomPromptChange}
                disabled={formState.isLoading}
                selectedGoal={formState.selectedGoal}
                selectedEngine={formState.selectedEngine}
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
          {formState.selectedGoal && (!formState.showEngineSelection || formState.selectedEngine) && (
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
                disabled={formState.isLoading || formState.images.length === 0 || !formState.selectedGoal}
                className={`
                  glow-button flex items-center space-x-3 px-8 py-4 text-lg font-semibold
                  ${formState.isLoading || formState.images.length === 0 || !formState.selectedGoal
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105 active:scale-95'
                  }
                `}
                whileHover={!formState.isLoading && formState.images.length > 0 && formState.selectedGoal ? { scale: 1.05 } : {}}
                whileTap={!formState.isLoading && formState.images.length > 0 && formState.selectedGoal ? { scale: 0.95 } : {}}
              >
                {formState.isLoading ? (
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
              <div className={`flex items-center space-x-2 ${formState.selectedGoal ? 'text-green-400' : ''}`}>
                <div className={`w-3 h-3 rounded-full ${formState.selectedGoal ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span>Goal Selected</span>
              </div>
              {formState.showEngineSelection && (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <div className={`flex items-center space-x-2 ${formState.selectedEngine ? 'text-green-400' : ''}`}>
                    <div className={`w-3 h-3 rounded-full ${formState.selectedEngine ? 'bg-green-400' : 'bg-gray-600'}`} />
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
    selectedGoal: PropTypes.string,
    selectedEngine: PropTypes.string,
    customPrompt: PropTypes.string
  })
};

export default AnalysisForm;