import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Send, 
  AlertCircle, 
  Clock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import PropTypes from 'prop-types';

// Import components
import ImageUploader from './ImageUploader';
import GoalSelection from './GoalSelection';
import EngineSelection from './EngineSelection';
import CustomPromptInput from './CustomPromptInput';
import FinalOutput from './FinalOutput';

/**
 * Clean Analysis Form Component 
 * Returns clean, professional output using FinalOutput component
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
    selected_goal: initialState.selected_goal || '',
    selected_engine: initialState.selected_engine || '',
    custom_prompt: initialState.custom_prompt || '',
    is_loading: false,
    results: null,
    error: null,
    show_engine_selection: false
  });

  const [validation, setValidation] = useState({
    images: { is_valid: true, message: '' },
    goal: { is_valid: true, message: '' },
    engine: { is_valid: true, message: '' },
    prompt: { is_valid: true, message: '' }
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
  // RESULT HANDLERS
  // =============================================================================

  // REMOVED: handleClearResults function (was causing issues)

  const handleNewAnalysis = () => {
    setFormState({
      images: [],
      selected_goal: '',
      selected_engine: '',
      custom_prompt: '',
      is_loading: false,
      results: null,
      error: null,
      show_engine_selection: false
    });

    setValidation({
      images: { is_valid: true, message: '' },
      goal: { is_valid: true, message: '' },
      engine: { is_valid: true, message: '' },
      prompt: { is_valid: true, message: '' }
    });
  };

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
      error: null
    }));

    try {
      const formData = new FormData();
      
      formState.images.forEach((image) => {
        formData.append('images', image.file);
      });
      
      // Send clean parameters - no tailored prompt generation on frontend
      formData.append('prompt', formState.custom_prompt);
      formData.append('goal', formState.selected_goal);
      if (formState.selected_engine) {
        formData.append('engine', formState.selected_engine);
      }

      console.log('🚀 Sending clean analysis request:', {
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
        submitted_at: new Date().toISOString(),
        image_count: formState.images.length
      };

      console.log('✅ Clean analysis completed:', {
        goal: results.goal,
        engine: results.engine,
        outputType: results.metadata?.output_type,
        analysisLength: results.analysis?.length,
        isClean: !results.analysis?.includes('###')
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
  }, [formState, validateForm, getApiEndpoint, onAnalysisComplete]);

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
        return 'Analyzing your images...';
      } else {
        return `Creating ${formState.selected_engine || 'optimized'} prompt...`;
      }
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
            Creating your {formState.selected_goal === 'find_common_features' ? 'analysis' : 'optimized prompt'}...
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Processing {formState.images.length} image{formState.images.length !== 1 ? 's' : ''}...</span>
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

  // Show clean final output if available
  if (formState.results) {
    return (
      <div ref={resultsRef}>
        <FinalOutput
          analysis={formState.results.analysis}
          metadata={formState.results.metadata || {
            image_count: formState.images.length,
            goal: formState.selected_goal,
            engine: formState.selected_engine,
            has_custom_prompt: Boolean(formState.custom_prompt),
            processing_time: formState.results.processingTime,
            output_type: formState.selected_goal === 'find_common_features' ? 'analysis' : 'prompt'
          }}
          onNewAnalysis={handleNewAnalysis}
          // REMOVED: onClear prop (was causing issues)
        />
      </div>
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
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>
                      {formState.selected_goal === 'find_common_features' 
                        ? `Analyze ${formState.images.length} Image${formState.images.length !== 1 ? 's' : ''}`
                        : `Create ${formState.selected_engine || 'AI'} Prompt`
                      }
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
                <span>Ready to {formState.selected_goal === 'find_common_features' ? 'Analyze' : 'Create Prompt'}</span>
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