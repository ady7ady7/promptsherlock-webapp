// frontend/src/components/GoalSelection.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Copy, 
  User, 
  Palette, 
  Info,
  CheckCircle,
  Clock
} from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Goal Selection Component
 * Allows users to choose their primary analysis goal
 * Note: Copy Style and Copy Character are temporarily disabled
 */
const GoalSelection = ({ 
  selectedGoal, 
  onGoalChange, 
  disabled = false,
  imageCount = 0 
}) => {
  const [hoveredGoal, setHoveredGoal] = useState(null);

  // Goal definitions with metadata
  const goals = [
    {
      id: 'find_common_features',
      title: 'Find Common Features',
      description: 'Identify shared elements, themes, and characteristics across images.',
      icon: Search,
      category: 'analysis',
      requiresSubSelection: false,
      tip: 'For more meaningful results, upload multiple high-quality images.',
      recommendedImages: 'Multiple images (3+)',
      color: 'blue',
      isEnabled: true
    },
    {
      id: 'copy_image',
      title: 'Generate Prompt: Copy Image',
      description: 'Create a prompt to recreate the entire image accurately.',
      icon: Copy,
      category: 'generation',
      requiresSubSelection: true,
      tip: 'Works best with clear, well-composed images.',
      recommendedImages: '1-3 images',
      color: 'green',
      isEnabled: true
    },
    {
      id: 'copy_character',
      title: 'Generate Prompt: Copy Character',
      description: 'Extract character details to generate prompts for new scenes.',
      icon: User,
      category: 'generation',
      requiresSubSelection: true,
      tip: 'Ensure characters are clearly visible and well-lit.',
      recommendedImages: '1-2 images',
      color: 'purple',
      isEnabled: false, // DISABLED
      comingSoon: true
    },
    {
      id: 'copy_style',
      title: 'Generate Prompt: Copy Style',
      description: 'Isolate and describe the artistic or photographic style for new creations.',
      icon: Palette,
      category: 'generation',
      requiresSubSelection: true,
      tip: 'Upload images with consistent, distinctive styles.',
      recommendedImages: '2-4 images',
      color: 'orange',
      isEnabled: false, // DISABLED
      comingSoon: true
    }
  ];

  const handleGoalClick = (goalId) => {
    if (disabled) return;
    
    const goal = goals.find(g => g.id === goalId);
    
    // Prevent selection of disabled goals
    if (!goal.isEnabled) return;
    
    onGoalChange(goalId, goal.requiresSubSelection);
  };

  const getColorClasses = (color, isSelected = false, isHovered = false, isDisabled = false) => {
    // If disabled, return grey colors
    if (isDisabled) {
      return {
        border: 'border-gray-600/50',
        bg: 'bg-gray-800/30',
        icon: 'text-gray-500',
        text: 'text-gray-500'
      };
    }

    const colors = {
      blue: {
        border: isSelected ? 'border-blue-400' : isHovered ? 'border-blue-300' : 'border-blue-500/30',
        bg: isSelected ? 'bg-blue-500/20' : isHovered ? 'bg-blue-500/10' : 'bg-blue-500/5',
        icon: isSelected ? 'text-blue-300' : 'text-blue-400',
        text: isSelected ? 'text-blue-200' : 'text-blue-300'
      },
      green: {
        border: isSelected ? 'border-green-400' : isHovered ? 'border-green-300' : 'border-green-500/30',
        bg: isSelected ? 'bg-green-500/20' : isHovered ? 'bg-green-500/10' : 'bg-green-500/5',
        icon: isSelected ? 'text-green-300' : 'text-green-400',
        text: isSelected ? 'text-green-200' : 'text-green-300'
      },
      purple: {
        border: isSelected ? 'border-purple-400' : isHovered ? 'border-purple-300' : 'border-purple-500/30',
        bg: isSelected ? 'bg-purple-500/20' : isHovered ? 'bg-purple-500/10' : 'bg-purple-500/5',
        icon: isSelected ? 'text-purple-300' : 'text-purple-400',
        text: isSelected ? 'text-purple-200' : 'text-purple-300'
      },
      orange: {
        border: isSelected ? 'border-orange-400' : isHovered ? 'border-orange-300' : 'border-orange-500/30',
        bg: isSelected ? 'bg-orange-500/20' : isHovered ? 'bg-orange-500/10' : 'bg-orange-500/5',
        icon: isSelected ? 'text-orange-300' : 'text-orange-400',
        text: isSelected ? 'text-orange-200' : 'text-orange-300'
      }
    };
    return colors[color] || colors.blue;
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
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

  return (
    <motion.div
      className="glass-effect p-6 rounded-lg space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="text-center space-y-2"
        variants={itemVariants}
      >
        <h3 className="text-2xl font-bold text-white">
          Choose Your Analysis Goal
        </h3>
        <p className="text-gray-300">
          Select what you want to achieve with your {imageCount} image{imageCount !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {/* Goal Cards Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={itemVariants}
      >
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoal === goal.id;
          const isHovered = hoveredGoal === goal.id;
          const isDisabled = !goal.isEnabled;
          const colorClasses = getColorClasses(goal.color, isSelected, isHovered, isDisabled);

          return (
            <motion.div
              key={goal.id}
              className={`
                relative p-6 rounded-lg border-2 transition-all duration-300 backdrop-blur-sm
                ${colorClasses.border} ${colorClasses.bg}
                ${disabled || isDisabled 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'cursor-pointer hover:scale-[1.02]'
                }
              `}
              onClick={() => handleGoalClick(goal.id)}
              onMouseEnter={() => !isDisabled && setHoveredGoal(goal.id)}
              onMouseLeave={() => setHoveredGoal(null)}
              whileHover={!disabled && !isDisabled ? { scale: 1.02 } : {}}
              whileTap={!disabled && !isDisabled ? { scale: 0.98 } : {}}
              layout
            >
              {/* Coming Soon Badge */}
              <AnimatePresence>
                {isDisabled && goal.comingSoon && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute top-3 right-3 bg-gray-700/80 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-600"
                  >
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400 font-medium">Available Soon</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Selection Indicator */}
              <AnimatePresence>
                {isSelected && !isDisabled && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute top-3 right-3"
                  >
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon */}
              <div className="flex items-center space-x-4 mb-4">
                <div className={`p-3 rounded-lg ${colorClasses.bg} border ${colorClasses.border}`}>
                  <Icon className={`w-6 h-6 ${colorClasses.icon}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`text-lg font-semibold ${colorClasses.text}`}>
                    {goal.title}
                  </h4>
                  <span className={`text-xs uppercase tracking-wider ${
                    isDisabled ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {goal.category}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className={`text-sm mb-4 leading-relaxed ${
                isDisabled ? 'text-gray-500' : 'text-gray-300'
              }`}>
                {goal.description}
              </p>

              {/* Metadata */}
              <div className="space-y-2">
                <div className={`flex items-center space-x-2 text-xs ${
                  isDisabled ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  <Info className="w-3 h-3" />
                  <span>Recommended: {goal.recommendedImages}</span>
                </div>
                
                {/* Tip */}
                {!isDisabled && (
                  <div className={`text-xs p-2 rounded ${colorClasses.bg} border ${colorClasses.border}`}>
                    <span className={colorClasses.text}>💡 {goal.tip}</span>
                  </div>
                )}

                {/* Coming Soon Message */}
                {isDisabled && goal.comingSoon && (
                  <div className="text-xs p-2 rounded bg-gray-800/50 border border-gray-600">
                    <span className="text-gray-400">
                      🚧 This feature is currently being enhanced and will be available soon!
                    </span>
                  </div>
                )}
              </div>

              {/* Sub-selection indicator */}
              {goal.requiresSubSelection && !isDisabled && (
                <div className="mt-3 text-xs text-gray-400 italic">
                  • Requires AI engine selection
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Help Text */}
      <motion.div 
        className="text-center text-sm text-gray-400"
        variants={itemVariants}
      >
        You can change your selection anytime before analysis
      </motion.div>
    </motion.div>
  );
};

GoalSelection.propTypes = {
  selectedGoal: PropTypes.string,
  onGoalChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  imageCount: PropTypes.number
};

export default GoalSelection;