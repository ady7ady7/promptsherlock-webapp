// frontend/src/components/CustomPromptInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Edit3, 
  Info, 
  Lightbulb,
  X,
  Check
} from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Enhanced Custom Prompt Input Component
 * Features placeholder state, click-to-activate, and contextual tips
 */
const CustomPromptInput = ({ 
  value, 
  onChange, 
  disabled = false,
  selectedGoal = '',
  selectedEngine = '',
  imageCount = 0,
  maxLength = 1000
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const textareaRef = useRef(null);

  // Auto-focus when activated
  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isActive]);

  // Context-aware placeholder text
  const getPlaceholderText = () => {
    if (!selectedGoal) {
      return "Click here to add custom analysis instructions...";
    }

    const placeholders = {
      find_common_features: "Add specific details to focus on (e.g., 'Pay attention to architectural styles and color schemes')",
      copy_image: "Specify what aspects to emphasize (e.g., 'Focus on lighting and composition details')",
      copy_character: "Detail character aspects to highlight (e.g., 'Emphasize facial features and clothing style')",
      copy_style: "Mention style elements to capture (e.g., 'Focus on brush strokes and color palette')"
    };

    return placeholders[selectedGoal] || "Add custom instructions for more targeted analysis...";
  };

  // Context-aware tips based on goal and engine
  const getContextualTips = () => {
    const baseTips = [
      "Be specific about what you want to focus on",
      "Mention important details that might be missed",
      "Use descriptive language for better results"
    ];

    const goalTips = {
      find_common_features: [
        "Specify types of features to look for (colors, shapes, themes)",
        "Mention if you want technical or artistic analysis",
        "Ask for specific comparisons between images"
      ],
      copy_image: [
        "Describe the mood or atmosphere you want to capture",
        "Mention specific technical aspects (lighting, composition)",
        "Specify any elements to emphasize or de-emphasize"
      ],
      copy_character: [
        "Detail which character aspects are most important",
        "Mention pose, expression, or clothing preferences",
        "Specify the target style for new scenes"
      ],
      copy_style: [
        "Describe what makes the style unique",
        "Mention color schemes, textures, or techniques",
        "Specify how to adapt the style for new subjects"
      ]
    };

    const engineTips = {
      midjourney: ["Use artistic and creative language", "Mention aesthetic preferences"],
      dalle: ["Be precise and literal", "Include specific details"],
      stable_diffusion: ["Technical terms work well", "Mention specific parameters"],
      gemini_imagen: ["Focus on realistic details", "Describe photographic aspects"],
      flux: ["Modern terminology is effective", "Be specific about quality"],
      leonardo: ["Professional terminology preferred", "Mention output requirements"]
    };

    let tips = [...baseTips];
    
    if (selectedGoal && goalTips[selectedGoal]) {
      tips = [...tips, ...goalTips[selectedGoal]];
    }
    
    if (selectedEngine && engineTips[selectedEngine]) {
      tips = [...tips, ...engineTips[selectedEngine]];
    }

    return tips.slice(0, 4); // Limit to 4 tips
  };

  const handleActivate = () => {
    if (disabled) return;
    setIsActive(true);
  };

  const handleDeactivate = () => {
    if (!value.trim()) {
      setIsActive(false);
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    handleDeactivate();
  };

  const toggleTips = () => {
    setShowTips(!showTips);
  };

  const getCharacterCountColor = () => {
    const percentage = (value.length / maxLength) * 100;
    if (percentage > 90) return 'text-red-400';
    if (percentage > 75) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const containerVariants = {
    inactive: {
      scale: 1,
      transition: { duration: 0.2 }
    },
    active: {
      scale: 1.01,
      transition: { duration: 0.2 }
    }
  };

  const placeholderVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const tipsVariants = {
    hidden: { 
      opacity: 0, 
      height: 0,
      marginTop: 0
    },
    visible: {
      opacity: 1,
      height: 'auto',
      marginTop: 16,
      transition: { 
        duration: 0.3,
        staggerChildren: 0.05
      }
    }
  };

  const tipItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      className="glass-effect p-6 rounded-lg space-y-4"
      variants={containerVariants}
      animate={isActive ? 'active' : 'inactive'}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">
            Custom Analysis Prompt
          </h3>
          <span className="text-sm text-gray-400">(Optional)</span>
        </div>
        
        {/* Tips Toggle */}
        <motion.button
          type="button"
          onClick={toggleTips}
          className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Lightbulb className="w-4 h-4" />
          <span>{showTips ? 'Hide' : 'Show'} Tips</span>
        </motion.button>
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        <div className="relative">
          <AnimatePresence>
            {!isActive && !value && (
              <motion.div
                variants={placeholderVariants}
                initial="visible"
                exit="hidden"
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-white/5 rounded-lg border-2 border-dashed border-gray-500 hover:border-gray-400 transition-colors"
                onClick={handleActivate}
              >
                <div className="text-center space-y-2">
                  <Edit3 className="w-6 h-6 text-gray-400 mx-auto" />
                  <p className="text-gray-400 text-sm">
                    Click to add custom instructions
                  </p>
                  <p className="text-gray-500 text-xs">
                    Get more specific results with detailed prompts
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(isActive || value) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder={getPlaceholderText()}
                  className={`
                    form-textarea min-h-[120px] resize-y w-full
                    ${isFocused ? 'ring-2 ring-blue-400 border-blue-400' : ''}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  disabled={disabled}
                  maxLength={maxLength}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-2 text-gray-400">
            <Info className="w-4 h-4" />
            <span>
              {selectedGoal && selectedEngine 
                ? `Optimized for ${selectedEngine.replace('_', ' ')} ${selectedGoal.replace('copy_', '').replace('_', ' ')}`
                : selectedGoal
                  ? `Focused on ${selectedGoal.replace('_', ' ')}`
                  : 'Provide specific instructions for better analysis'
              }
            </span>
          </div>
          
          {(isActive || value) && (
            <span className={`transition-colors ${getCharacterCountColor()}`}>
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      </div>

      {/* Contextual Tips */}
      <AnimatePresence>
        {showTips && (
          <motion.div
            variants={tipsVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center space-x-2 text-blue-300">
              <Lightbulb className="w-4 h-4" />
              <span className="font-medium">Writing Tips</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {getContextualTips().map((tip, index) => (
                <motion.div
                  key={index}
                  variants={tipItemVariants}
                  className="flex items-start space-x-2 text-sm text-gray-300"
                >
                  <Check className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </motion.div>
              ))}
            </div>

            {selectedGoal && (
              <motion.div
                variants={tipItemVariants}
                className="border-t border-blue-500/30 pt-3 mt-3"
              >
                <div className="text-xs text-blue-200">
                  <strong>For {selectedGoal.replace('_', ' ')}:</strong> Be specific about what makes your images unique and what you want to capture or analyze.
                  {selectedEngine && (
                    <span className="block mt-1">
                      <strong>{selectedEngine.replace('_', ' ')} works best with:</strong> Clear, descriptive language that matches the engine's strengths.
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

CustomPromptInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  selectedGoal: PropTypes.string,
  selectedEngine: PropTypes.string,
  imageCount: PropTypes.number,
  maxLength: PropTypes.number
};

export default CustomPromptInput;