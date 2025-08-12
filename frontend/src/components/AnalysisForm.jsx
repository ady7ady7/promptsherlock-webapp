// =============================================================================
// FIXED ANALYSIS FORM - PROPER ERROR HANDLING FOR AUTH ISSUES
// File: frontend/src/components/AnalysisForm.jsx - REPLACE EXISTING
// =============================================================================

import React, { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import {
  Send,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

// Component imports
import ImageUploader from './ImageUploader';
import GoalEngineSelection from './GoalEngineSelection';
import FinalOutput from './FinalOutput';

// Auth context
import { useAuth } from './AuthContext';

// =============================================================================
// LAZY LOADERS FOR HEAVY DEPENDENCIES
// =============================================================================

let axiosModule = null;
const loadAxios = async () => {
  if (axiosModule) return axiosModule;
  
  try {
    const module = await import('axios');
    axiosModule = module.default || module;
    console.log('✅ Axios loaded successfully');
    return axiosModule;
  } catch (error) {
    console.error('❌ Failed to load Axios:', error);
    throw new Error('Failed to load network module. Please refresh the page.');
  }
};

// =============================================================================
// LAZY MOTION COMPONENTS
// =============================================================================

const LazyMotionDiv = ({ children, ...props }) => {
  return <motion.div {...props}>{children}</motion.div>;
};

const LazyMotionButton = ({ children, disabled, className, ...props }) => {
  const MotionButton = motion.button;
  
  return (
    <MotionButton
      className={className}
      disabled={disabled}
      {...props}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {children}
    </MotionButton>
  );
};

const LazyAnimatePresence = ({ children, ...props }) => {
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
    is_loading: false,
    results: null,
    error: null
  });

  const [validation, setValidation] = useState({
    images: { is_valid: true, message: '' },
    goal: { is_valid: true, message: '' },
    engine: { is_valid: true, message: '' }
  });

  const resultsRef = useRef(null);
  const [axiosLoaded, setAxiosLoaded] = useState(false);

  // Get user from auth context
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
    console.log('🔄 Starting new analysis - resetting all state');
    
    setFormState({
      images: [],
      selected_goal: '',
      selected_engine: '',
      is_loading: false,
      results: null,
      error: null
    });

    setValidation({
      images: { is_valid: true, message: '' },
      goal: { is_valid: true, message: '' },
      engine: { is_valid: true, message: '' }
    });

    // Reset axios loaded state to allow re-loading if needed
    setAxiosLoaded(false);
    
    console.log('✅ New analysis state reset complete');
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

  const handleGoalChange = useCallback((goalId) => {
    setFormState(prev => ({
      ...prev,
      selected_goal: goalId,
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

  // =============================================================================
  // VALIDATION LOGIC
  // =============================================================================

  const validateForm = useCallback(() => {
    const newValidation = {
      images: { is_valid: true, message: '' },
      goal: { is_valid: true, message: '' },
      engine: { is_valid: true, message: '' }
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

    if (!formState.selected_engine) {
      newValidation.engine = {
        is_valid: false,
        message: 'Please select an AI generation engine'
      };
    }

    setValidation(newValidation);
    return Object.values(newValidation).every(field => field.is_valid);
  }, [formState]);

  // =============================================================================
  // 🔥 FIXED FORM SUBMISSION WITH PROPER ERROR HANDLING
  // =============================================================================

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    console.log('🚀 Form submission started');
    console.log('📊 Auth state:', { currentUser: !!currentUser, loading });
    console.log('📊 Form state:', { 
      images: formState.images.length, 
      goal: formState.selected_goal, 
      engine: formState.selected_engine 
    });

    // Clear any previous errors
    setFormState(prev => ({ ...prev, error: null }));

    // Validate form first
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      setFormState(prev => ({ 
        ...prev, 
        error: 'Please complete all required fields before submitting.' 
      }));
      return;
    }

    // 🔥 FIXED: Proper authentication check with user-visible error
    if (!currentUser) {
      console.log('❌ No authenticated user');
      setFormState(prev => ({ 
        ...prev, 
        error: 'Authentication required. Please wait for authentication to complete, then try again.' 
      }));
      return;
    }

    if (loading) {
      console.log('❌ Authentication still loading');
      setFormState(prev => ({ 
        ...prev, 
        error: 'Authentication in progress. Please wait a moment and try again.' 
      }));
      return;
    }

    // Start loading state
    setFormState(prev => ({
      ...prev,
      is_loading: true,
      error: null
    }));

    try {
      // Load Axios
      console.log('🚀 Loading Axios for form submission...');
      const axios = await loadAxios();
      setAxiosLoaded(true);

      // Get auth token
      const idToken = await currentUser.getIdToken();
      console.log('🔐 Auth token obtained');

      const formData = new FormData();

      formState.images.forEach((image) => {
        formData.append('images', image.file);
      });

      // Send parameters
      formData.append('goal', formState.selected_goal);
      formData.append('engine', formState.selected_engine);

      console.log('🚀 Sending analysis request:', {
        imageCount: formState.images.length,
        goal: formState.selected_goal,
        engine: formState.selected_engine,
        endpoint: getApiEndpoint('/api/analyze')
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
        is_loading: false,
        error: null
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
      console.error('❌ Analysis failed:', error);

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
  }, [formState, currentUser, loading, validateForm, getApiEndpoint, onAnalysisComplete]);

  // =============================================================================
  // RENDER HELPER FUNCTIONS
  // =============================================================================

  const renderValidationErrors = () => {
    const hasErrors = Object.values(validation).some(field => !field.is_valid);
    if (!hasErrors) return null;

    return (
      <motion.div
        className="glass-effect border-red-400/50 bg-red-500/10 p-4 rounded-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-red-400 font-medium mb-2">Please fix the following:</h4>
            <ul className="space-y-1">
              {Object.entries(validation).map(([field, { is_valid, message }]) => (
                !is_valid && (
                  <li key={field} className="text-red-300 text-sm">
                    • {message}
                  </li>
                )
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderApiError = () => {
    if (!formState.error) return null;

    return (
      <motion.div
        className="glass-effect border-red-400/50 bg-red-500/10 p-4 rounded-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-red-400 font-medium mb-1">Analysis Failed</h4>
            <p className="text-red-300 text-sm">{formState.error}</p>
          </div>
          <button
            onClick={() => setFormState(prev => ({ ...prev, error: null }))}
            className="text-red-400 hover:text-red-300 transition-colors"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      </motion.div>
    );
  };

  const renderLoadingState = () => {
    if (!formState.is_loading) return null;

    return (
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="glass-effect p-8 rounded-xl text-center max-w-md mx-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {axiosLoaded ? 'Creating Your Prompt...' : 'Loading...'}
          </h3>
          <p className="text-gray-300 text-sm">
            {axiosLoaded 
              ? 'Analyzing your images and generating the perfect prompt. This usually takes 30-60 seconds.'
              : 'Preparing the analysis tools...'
            }
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-blue-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Please wait...</span>
          </div>
        </motion.div>
      </motion.div>
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
            processing_time: formState.results.processingTime,
            output_type: 'prompt'
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

        {/* Step 2: Goal & Engine Selection */}
        <AnimatePresence>
          {formState.images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { 
                  duration: 0.5,
                  ease: "easeOut",
                  delay: 0.2 
                }
              }}
              exit={{
                opacity: 0,
                y: -20,
                transition: { duration: 0.3 }
              }}
            >
              <GoalEngineSelection
                selectedGoal={formState.selected_goal}
                selectedEngine={formState.selected_engine}
                onGoalChange={handleGoalChange}
                onEngineChange={handleEngineChange}
                disabled={formState.is_loading || loading}
                imageCount={formState.images.length}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Errors */}
        <LazyAnimatePresence>
          {renderValidationErrors()}
        </LazyAnimatePresence>

        {/* Step 3: Submit Button */}
        <LazyAnimatePresence>
          {formState.selected_goal && formState.selected_engine && (
            <LazyMotionDiv
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, delay: 0.2 }
              }}
              exit={{ opacity: 0, y: 20 }}
            >
              <LazyMotionButton
                disabled={
                  formState.is_loading || 
                  formState.images.length === 0 || 
                  !formState.selected_goal || 
                  !formState.selected_engine || 
                  loading ||
                  !currentUser
                }
                className={`
                  glow-button flex items-center space-x-3 px-10 py-4 text-lg font-semibold
                  ${formState.is_loading || 
                    formState.images.length === 0 || 
                    !formState.selected_goal || 
                    !formState.selected_engine || 
                    loading ||
                    !currentUser
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
                    <span>Create Prompt</span>
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
              <ArrowRight className="w-4 h-4" />
              <div className={`flex items-center space-x-2 ${formState.selected_engine ? 'text-green-400' : ''}`}>
                <div className={`w-3 h-3 rounded-full ${formState.selected_engine ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span>Engine Selected</span>
              </div>
              <ArrowRight className="w-4 h-4" />
              <div className={`flex items-center space-x-2 ${currentUser && !loading ? 'text-green-400' : ''}`}>
                <div className={`w-3 h-3 rounded-full ${currentUser && !loading ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span>Ready to Create</span>
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
    selected_engine: PropTypes.string
  })
};

export default AnalysisForm;