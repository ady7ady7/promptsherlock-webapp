// frontend/src/components/AnalysisForm.jsx - FIXED VERSION
// Key fix: Ensure API path is constructed correctly
import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText,
  Download,
  Copy,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import PropTypes from 'prop-types';
import ImageUploader from './ImageUploader';
import AnalysisResultsFormatter from './AnalysisResultsFormatter';

/**
 * Main Analysis Form Component - Fixed API path construction
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
    prompt: initialState.prompt || '',
    isLoading: false,
    results: null,
    error: null,
    isSubmitted: false
  });

  const [validation, setValidation] = useState({
    images: { isValid: true, message: '' },
    prompt: { isValid: true, message: '' }
  });

  // Refs for form elements
  const promptRef = useRef(null);
  const resultsRef = useRef(null);

  // =============================================================================
  // API URL CONSTRUCTION (FIXED)
  // =============================================================================
  
  /**
   * Construct the correct API endpoint URL
   * Prevents double /api/ in the path
   */
  const getApiEndpoint = useCallback((endpoint) => {
    // Remove trailing slash from apiUrl if present
    const baseUrl = apiUrl.replace(/\/$/, '');
    
    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Check if baseUrl already ends with /api
    if (baseUrl.endsWith('/api')) {
      // If baseUrl includes /api, don't add it again
      return `${baseUrl}${cleanEndpoint}`;
    } else {
      // If baseUrl doesn't include /api, add it
      return `${baseUrl}/api${cleanEndpoint}`;
    }
  }, [apiUrl]);

  // Debug: Log the constructed URLs
  React.useEffect(() => {
    console.log('🔍 API Configuration:');
    console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('  apiUrl prop:', apiUrl);
    console.log('  Analyze endpoint:', getApiEndpoint('/analyze'));
  }, [apiUrl, getApiEndpoint]);

  // =============================================================================
  // FORM VALIDATION (unchanged)
  // =============================================================================
  
  const validateForm = useCallback(() => {
    const newValidation = {
      images: { isValid: true, message: '' },
      prompt: { isValid: true, message: '' }
    };

    if (!formState.images || formState.images.length === 0) {
      newValidation.images = {
        isValid: false,
        message: 'Please upload at least one image for analysis'
      };
    }

    if (formState.prompt.length > 1000) {
      newValidation.prompt = {
        isValid: false,
        message: 'Prompt must be less than 1000 characters'
      };
    }

    setValidation(newValidation);
    return newValidation.images.isValid && newValidation.prompt.isValid;
  }, [formState.images, formState.prompt]);

  // =============================================================================
  // STATE UPDATERS (unchanged)
  // =============================================================================
  
  const updateFormState = useCallback((updates) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleImagesChange = useCallback((images) => {
    updateFormState({ images });
    
    if (images.length > 0 && !validation.images.isValid) {
      setValidation(prev => ({
        ...prev,
        images: { isValid: true, message: '' }
      }));
    }
  }, [updateFormState, validation.images.isValid]);

  const handlePromptChange = useCallback((event) => {
    const prompt = event.target.value;
    updateFormState({ prompt });
    
    if (prompt.length <= 1000 && !validation.prompt.isValid) {
      setValidation(prev => ({
        ...prev,
        prompt: { isValid: true, message: '' }
      }));
    }
  }, [updateFormState, validation.prompt.isValid]);

  // =============================================================================
  // API COMMUNICATION (FIXED)
  // =============================================================================
  
  const constructFormData = useCallback(() => {
    const formData = new FormData();
    
    formState.images.forEach((imageObj) => {
      if (imageObj.file) {
        formData.append('images', imageObj.file);
      }
    });
    
    if (formState.prompt.trim()) {
      formData.append('prompt', formState.prompt.trim());
    }
    
    return formData;
  }, [formState.images, formState.prompt]);

  const handleApiError = useCallback((error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return data.error || 'Invalid request. Please check your images and try again.';
        case 403:
          return 'Access denied. Please check CORS configuration.';
        case 404:
          return 'API endpoint not found. Please check the server configuration.';
        case 413:
          return 'Files too large. Please reduce image sizes and try again.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return data.error || `Request failed (${status}). Please try again.`;
      }
    } else if (error.request) {
      return 'Network error. Please check your connection and try again.';
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }, []);

  /**
   * Submit form to API - FIXED endpoint construction
   */
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    updateFormState({
      isLoading: true,
      results: null,
      error: null,
      isSubmitted: true
    });

    try {
      const formData = constructFormData();
      
      // FIXED: Use the corrected API endpoint
      const analyzeUrl = getApiEndpoint('/analyze');
      
      console.log('🚀 Making API request to:', analyzeUrl);
      
      const response = await axios.post(
        analyzeUrl, // This should be: https://prompt-sherlock.onrender.com/api/analyze
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 300000, // 5 minutes timeout
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      );
      
      console.log('✅ Analysis response:', response.data);
      
      if (response.data.success) {
        updateFormState({
          results: response.data,
          isLoading: false,
          error: null
        });
        
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 500);
        
        onAnalysisComplete?.(response.data);
        
      } else {
        throw new Error(response.data.error || 'Analysis failed');
      }
      
    } catch (error) {
      const errorMessage = handleApiError(error);
      
      updateFormState({
        isLoading: false,
        error: errorMessage,
        results: null
      });
    }
  }, [validateForm, updateFormState, constructFormData, getApiEndpoint, handleApiError, onAnalysisComplete]);

  // =============================================================================
  // UTILITY FUNCTIONS (unchanged)
  // =============================================================================
  
  const handleReset = useCallback(() => {
    setFormState({
      images: [],
      prompt: '',
      isLoading: false,
      results: null,
      error: null,
      isSubmitted: false
    });
    
    setValidation({
      images: { isValid: true, message: '' },
      prompt: { isValid: true, message: '' }
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCopyResults = useCallback(async () => {
    if (!formState.results?.analysis) return;
    
    try {
      await navigator.clipboard.writeText(formState.results.analysis);
      console.log('Results copied to clipboard');
    } catch (error) {
      console.error('Failed to copy results:', error);
    }
  }, [formState.results]);

  const handleDownloadResults = useCallback(() => {
    if (!formState.results?.analysis) return;
    
    const blob = new Blob([formState.results.analysis], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `image-analysis-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, [formState.results]);

  // =============================================================================
  // ANIMATION VARIANTS (unchanged)
  // =============================================================================
  
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
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
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  };

  const errorVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  const resultsVariants = {
    hidden: { opacity: 0, y: 30 },
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
  // RENDER HELPERS (unchanged)
  // =============================================================================
  
  const renderValidationErrors = () => {
    const hasErrors = !validation.images.isValid || !validation.prompt.isValid;
    
    if (!hasErrors) return null;
    
    return (
      <motion.div
        className="glass-effect border-red-400/50 bg-red-500/10 p-4 rounded-lg space-y-2"
        variants={errorVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h4 className="text-red-400 font-medium">Please fix the following errors:</h4>
        </div>
        
        <ul className="space-y-1 ml-7">
          {!validation.images.isValid && (
            <li className="text-red-300 text-sm">• {validation.images.message}</li>
          )}
          {!validation.prompt.isValid && (
            <li className="text-red-300 text-sm">• {validation.prompt.message}</li>
          )}
        </ul>
      </motion.div>
    );
  };

  const renderApiError = () => {
    if (!formState.error) return null;
    
    return (
      <motion.div
        className="glass-effect border-red-400/50 bg-red-500/10 p-6 rounded-lg"
        variants={errorVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-red-400 font-semibold mb-2">Analysis Failed</h4>
            <p className="text-red-300 mb-4">{formState.error}</p>
            
            {/* Debug info for development */}
            {import.meta.env.DEV && (
              <details className="mt-4">
                <summary className="text-red-400 text-sm cursor-pointer">Debug Info</summary>
                <div className="mt-2 text-xs text-red-200 font-mono">
                  <p>API URL: {apiUrl}</p>
                  <p>Analyze endpoint: {getApiEndpoint('/analyze')}</p>
                  <p>Environment: {import.meta.env.MODE}</p>
                </div>
              </details>
            )}
            
            <button
              onClick={() => updateFormState({ error: null })}
              className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderLoadingState = () => {
    if (!formState.isLoading) return null;
    
    return (
      <motion.div
        className="glass-effect p-8 text-center"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-4">
          <div className="spinner-glow w-12 h-12 mx-auto"></div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Analyzing Your Images
            </h3>
            <p className="text-gray-300">
              Please wait while our AI analyzes your {formState.images.length} image
              {formState.images.length !== 1 ? 's' : ''}...
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>This usually takes 30-60 seconds</span>
          </div>
        </div>
      </motion.div>
    );
  };

const renderResults = () => {
  if (!formState.results) return null;
  
  const { analysis, metadata } = formState.results;
  
  return (
    <motion.div
      ref={resultsRef}
      id="analysis-results"
      className="space-y-6"
      variants={resultsVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Quick Stats Header */}
      <div className="glass-effect p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h2 className="gradient-text text-2xl font-bold">
              Analysis Complete
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyResults}
              className="btn-ghost p-2"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadResults}
              className="btn-ghost p-2"
              title="Download as text file"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-blue-400 font-semibold">Images</div>
            <div className="text-white">{metadata?.processedImages || formState.images.length}</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 font-semibold">Processing Time</div>
            <div className="text-white">
              {metadata?.totalProcessingTimeMs 
                ? `${(metadata.totalProcessingTimeMs / 1000).toFixed(1)}s`
                : 'N/A'
              }
            </div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 font-semibold">Service</div>
            <div className="text-white">Prompt Sherlock</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 font-semibold">Analysis Length</div>
            <div className="text-white">{analysis?.length || 0} chars</div>
          </div>
        </div>
      </div>

      {/* Beautiful Formatted Analysis Results */}
      <AnalysisResultsFormatter analysisText={analysis} />

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleReset}
          className="glow-button-secondary flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Analyze New Images</span>
        </button>
        
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn-outline"
        >
          Back to Top
        </button>
      </div>
    </motion.div>
  );
};

  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  return (
    <motion.div
      className="max-w-6xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
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

        <motion.div 
          className="glass-effect p-6 rounded-lg space-y-4"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">
              Custom Analysis Prompt
            </h3>
            <span className="text-sm text-gray-400">(Optional)</span>
          </div>
          
          <div className="space-y-2">
            <textarea
              ref={promptRef}
              value={formState.prompt}
              onChange={handlePromptChange}
              placeholder="Describe what you'd like me to focus on in the analysis... (e.g., 'Focus on the architectural details' or 'Identify any objects in the scene')"
              className="form-textarea min-h-[120px] resize-y"
              disabled={formState.isLoading}
              maxLength={1000}
            />
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">
                Provide specific instructions for more targeted analysis
              </span>
              <span className={`transition-colors ${
                formState.prompt.length > 900 
                  ? 'text-yellow-400' 
                  : formState.prompt.length > 950 
                    ? 'text-red-400' 
                    : 'text-gray-400'
              }`}>
                {formState.prompt.length}/1000
              </span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {renderValidationErrors()}
        </AnimatePresence>

        <motion.div 
          className="flex justify-center"
          variants={itemVariants}
        >
          <motion.button
            type="submit"
            disabled={formState.isLoading || formState.images.length === 0}
            className="glow-button flex items-center space-x-3 px-8 py-4 text-lg font-semibold"
            whileHover={!formState.isLoading ? { scale: 1.05 } : {}}
            whileTap={!formState.isLoading ? { scale: 0.95 } : {}}
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
              </>
            )}
          </motion.button>
        </motion.div>
      </form>

      <AnimatePresence>
        {renderApiError()}
      </AnimatePresence>

      <AnimatePresence>
        {renderLoadingState()}
      </AnimatePresence>

      <AnimatePresence>
        {renderResults()}
      </AnimatePresence>
    </motion.div>
  );
};

AnalysisForm.propTypes = {
  apiUrl: PropTypes.string,
  onAnalysisComplete: PropTypes.func,
  initialState: PropTypes.shape({
    images: PropTypes.array,
    prompt: PropTypes.string
  })
};

export default AnalysisForm;