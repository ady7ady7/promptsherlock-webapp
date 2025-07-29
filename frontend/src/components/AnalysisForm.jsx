// =============================================================================
// OPTIMIZED ANALYSIS FORM WITH LAZY LOADING
// File: frontend/src/components/AnalysisForm.jsx - REPLACE EXISTING
// =============================================================================

import React, { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// LAZY IMPORTS - LOAD ONLY WHEN NEEDED
// =============================================================================

// Icons - load immediately (small size)
import {
  Send,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

// Component imports - keep immediate (needed for initial render)
import ImageUploader from './ImageUploader';
import GoalSelection from './GoalSelection';
import EngineSelection from './EngineSelection';
import CustomPromptInput from './CustomPromptInput';
import FinalOutput from './FinalOutput';

// Auth context - already optimized with lazy loading
import { useAuth } from './AuthContext';

// =============================================================================
// LAZY LOADERS FOR HEAVY DEPENDENCIES
// =============================================================================

/**
 * Lazy load Framer Motion components
 */
let motionModules = null;
const loadMotionModules = async () => {
  if (motionModules) return motionModules;
  
  try {
    const { motion, AnimatePresence } = await import('framer-motion');
    motionModules = { motion, AnimatePresence };
    console.log('✅ Framer Motion loaded for form interactions');
    return motionModules;
  } catch (error) {
    console.error('❌ Failed to load Framer Motion:', error);
    // Fallback to regular div components
    motionModules = {
      motion: {
        div: 'div',
        button: 'button',
        form: 'form'
      },
      AnimatePresence: ({ children }) => children
    };
    return motionModules;
  }
};

/**
 * Lazy load Axios for form submission
 */
let axiosModule = null;
const loadAxios = async () => {
  if (axiosModule) return axiosModule;
  
  try {
    axiosModule = await import('axios');
    console.log('✅ Axios loaded for form submission');
    return axiosModule.default;
  } catch (error) {
    console.error('❌ Failed to load Axios:', error);
    throw new Error('Network module failed to load');
  }
};

// =============================================================================
// LIGHTWEIGHT MOTION WRAPPER COMPONENTS
// =============================================================================

/**
 * Lightweight wrapper that loads motion on first interaction
 */
const LazyMotionDiv = ({ children, className, variants, initial, animate, exit, ...props }) => {
  const [MotionDiv, setMotionDiv] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const handleInteraction = useCallback(async () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      const { motion } = await loadMotionModules();
      setMotionDiv(() => motion.div);
    }
  }, [hasInteracted]);
  
  // Load on hover, focus, or scroll into view
  const interactionProps = {
    onMouseEnter: handleInteraction,
    onFocus: handleInteraction,
    onTouchStart: handleInteraction,
    ...props
  };
  
  if (!MotionDiv) {
    return (
      <div className={className} {...interactionProps}>
        {children}
      </div>
    );
  }
  
  return (
    <MotionDiv 
      className={className}
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit}
      {...props}
    >
      {children}
    </MotionDiv>
  );
};

/**
 * Lazy AnimatePresence wrapper
 */
const LazyAnimatePresence = ({ children, ...props }) => {
  const [AnimatePresence, setAnimatePresence] = useState(null);
  
  React.useEffect(() => {
    loadMotionModules().then(({ AnimatePresence: AP }) => {
      setAnimatePresence(() => AP);
    });
  }, []);
  
  if (!AnimatePresence) {
    return <>{children}</>;
  }
  
  return (
    <AnimatePresence {...props}>
      {children}
    </AnimatePresence>
  );
};

// =============================================================================
// MAIN ANALYSIS FORM COMPONENT
// =============================================================================

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
  const [axiosLoaded, setAxiosLoaded] = useState(false);

  // Get user from auth context (already lazy loaded)
  const { currentUser, loading } = useAuth();

  // =============================================================================
  // API CONFIGURATION
  // =============================================================================

  const getApiEndpoint = useCallback((endpoint) => {
    const baseUrl = apiUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  }, [apiUrl]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleNewAnalysis = useCallback(() => {
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
  }, []);

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
  // FORM SUBMISSION WITH LAZY AXIOS LOADING
  // =============================================================================

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Validate form and auth
    if (!validateForm() || !currentUser || loading) {
      if (!currentUser) {
        setFormState(prev => ({ ...prev, error: "Authentication not ready. Please wait." }));
      }
      return;
    }

    setFormState(prev => ({
      ...prev,
      is_loading: true,
      error: null
    }));

    try {
      // LAZY LOAD AXIOS ONLY WHEN FORM IS SUBMITTED
      console.log('🚀 Loading Axios for form submission...');
      const axios = await loadAxios();
      setAxiosLoaded(true);

      // Get auth token
      const idToken = await currentUser.getIdToken();

      const formData = new FormData();

      formState.images.forEach((image) => {
        formData.append('images', image.file);
      });

      // Send clean parameters
      formData.append('prompt', formState.custom_prompt);
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
            'Authorization': `Bearer ${idToken}`,
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

      console.log('✅ Analysis completed:', {
        goal: results.goal,
        engine: results.engine,
        outputType: results.metadata?.output_type,
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
      } else if (error.message.includes("auth/")) {
        errorMessage = "Authentication error: " + error.message;
      } else if (error.message.includes("Network module failed")) {
        errorMessage = "Network connection failed. Please check your internet connection.";
      }

      setFormState(prev => ({
        ...prev,
        error: errorMessage,
        is_loading: false
      }));
    }
  }, [formState, validateForm, getApiEndpoint, onAnalysisComplete, currentUser, loading]);

  // =============================================================================
  // RENDER METHODS WITH LAZY MOTION
  // =============================================================================

  const renderValidationErrors = () => {
    const errors = Object.entries(validation)
      .filter(([, field]) => !field.is_valid)
      .map(([key, field]) => ({ key, message: field.message }));

    if (errors.length === 0) return null;

    return (
      <LazyMotionDiv
        className="bg-red-500/20 border border-red-500/50 rounded-lg p-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
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
      </LazyMotionDiv>
    );
  };

  const renderApiError = () => {
    if (!formState.error) return null;

    return (
      <LazyMotionDiv
        className="bg-red-500/20 border border-red-500/50 rounded-lg p-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <div className="flex items-center space-x-2 text-red-300">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-medium">Analysis Failed</p>
            <p className="text-sm text-red-200 mt-1">{formState.error}</p>
            {!axiosLoaded && (
              <p className="text-xs text-red-300 mt-2">
                Tip: This might be a network connectivity issue.
              </p>
            )}
          </div>
        </div>
      </LazyMotionDiv>
    );
  };

  const renderLoadingState = () => {
    if (!formState.is_loading) return null;

    const getLoadingMessage = () => {
      if (!axiosLoaded) {
        return 'Loading network components...';
      }
      if (formState.selected_goal === 'find_common_features') {
        return 'Analyzing your images...';
      } else {
        return `Creating ${formState.selected_engine || 'optimized'} prompt...`;
      }
    };

    return (
      <LazyMotionDiv
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="glass-effect p-8 rounded-lg text-center max-w-md mx-4">
          <div className="flex justify-center mb-4">
            <div className="spinner w-12 h-12"></div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {getLoadingMessage()}
          </h3>
          <p className="text-gray-300">
            {!axiosLoaded ? 'Preparing for analysis...' : 
             formState.selected_goal === 'find_common_features' ? 'Creating your analysis...' : 'Creating your optimized prompt...'}
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Processing {formState.images.length} image{formState.images.length !== 1 ? 's' : ''}...</span>
          </div>
        </div>
      </LazyMotionDiv>
    );
  };

  // =============================================================================
  // LAZY MOTION BUTTON COMPONENT
  // =============================================================================

  const LazyMotionButton = ({ children, disabled, onClick, className, ...props }) => {
    const [MotionButton, setMotionButton] = useState(null);
    
    const handleInteraction = useCallback(async () => {
      if (!MotionButton) {
        const { motion } = await loadMotionModules();
        setMotionButton(() => motion.button);
      }
    }, [MotionButton]);

    const buttonProps = {
      type: "submit",
      disabled,
      onClick,
      className,
      onMouseEnter: handleInteraction,
      onFocus: handleInteraction,
      ...props
    };

    if (!MotionButton) {
      return <button {...buttonProps}>{children}</button>;
    }

    return (
      <MotionButton
        {...buttonProps}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        {children}
      </MotionButton>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  // Show final output if available
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
        />
      </div>
    );
  }

  return (
    <LazyMotionDiv
      className="max-w-4xl mx-auto space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Image Upload */}
        <LazyMotionDiv>
          <ImageUploader
            onImagesChange={handleImagesChange}
            initialImages={formState.images}
            maxFiles={10}
            maxFileSize={10 * 1024 * 1024}
            disabled={formState.is_loading || loading}
            loading={formState.is_loading}
          />
        </LazyMotionDiv>

        {/* Step 2: Goal Selection */}
        <LazyAnimatePresence>
          {formState.images.length > 0 && (
            <LazyMotionDiv
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
                disabled={formState.is_loading || loading}
                imageCount={formState.images.length}
              />
            </LazyMotionDiv>
          )}
        </LazyAnimatePresence>

        {/* Step 3: Engine Selection */}
        <LazyAnimatePresence>
          {formState.show_engine_selection && formState.selected_goal && (
            <LazyMotionDiv
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
                disabled={formState.is_loading || loading}
                goalType={formState.selected_goal}
              />
            </LazyMotionDiv>
          )}
        </LazyAnimatePresence>

        {/* Step 4: Custom Prompt Input */}
        <LazyAnimatePresence>
          {formState.selected_goal && (
            <LazyMotionDiv
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
                disabled={formState.is_loading || loading}
                selectedGoal={formState.selected_goal}
                selectedEngine={formState.selected_engine}
                imageCount={formState.images.length}
                maxLength={1000}
              />
            </LazyMotionDiv>
          )}
        </LazyAnimatePresence>

        {/* Validation Errors */}
        <LazyAnimatePresence>
          {renderValidationErrors()}
        </LazyAnimatePresence>

        {/* Step 5: Submit Button */}
        <LazyAnimatePresence>
          {formState.selected_goal && (!formState.show_engine_selection || formState.selected_engine) && (
            <LazyMotionDiv
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, delay: 0.2 }
              }}
              exit={{ opacity: 0, y: 20 }}
            >
              <LazyMotionButton
                disabled={formState.is_loading || formState.images.length === 0 || !formState.selected_goal || loading}
                className={`
                  glow-button flex items-center space-x-3 px-8 py-4 text-lg font-semibold
                  ${formState.is_loading || formState.images.length === 0 || !formState.selected_goal || loading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105 active:scale-95'
                  }
                `}
              >
                {formState.is_loading ? (
                  <>
                    <div className="spinner w-5 h-5"></div>
                    <span>{axiosLoaded ? 'Creating...' : 'Loading...'}</span>
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
              </LazyMotionButton>
            </LazyMotionDiv>
          )}
        </LazyAnimatePresence>

        {/* Progress Indicator */}
        <LazyAnimatePresence>
          {formState.images.length > 0 && (
            <LazyMotionDiv
              className="flex items-center justify-center space-x-4 text-sm text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
            </LazyMotionDiv>
          )}
        </LazyAnimatePresence>
      </form>

      {/* API Error Display */}
      <LazyAnimatePresence>
        {renderApiError()}
      </LazyAnimatePresence>

      {/* Loading Overlay */}
      <LazyAnimatePresence>
        {renderLoadingState()}
      </LazyAnimatePresence>
    </LazyMotionDiv>
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