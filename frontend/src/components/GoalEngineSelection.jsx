// =============================================================================
// MERGED GOAL + ENGINE SELECTION COMPONENT
// File: frontend/src/components/GoalEngineSelection.jsx - CREATE NEW FILE
// =============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  Palette, 
  CheckCircle,
  Zap, 
  Bot, 
  Sparkles, 
  Camera, 
  Cpu,
  Star
} from 'lucide-react';
import PropTypes from 'prop-types';

// =============================================================================
// GOAL DEFINITIONS
// =============================================================================
const goals = [
  {
    id: 'copy_image',
    title: 'Copy Image',
    description: 'Create a prompt to recreate the entire image accurately.',
    icon: Copy,
    color: 'green',
    bestFor: 'Recreating specific images'
  },
  {
    id: 'copy_style',
    title: 'Copy Style',
    description: 'Isolate and describe the artistic style for new creations.',
    icon: Palette,
    color: 'orange',
    bestFor: 'Applying style to new subjects'
  }
];

// =============================================================================
// ENGINE DEFINITIONS
// =============================================================================
const engines = [
  {
    id: 'midjourney',
    name: 'Midjourney',
    description: 'Artistic and creative generation',
    icon: Palette,
    color: 'purple',
    popularity: 5
  },
  {
    id: 'dalle',
    name: 'DALL-E 3',
    description: 'Excellent prompt adherence',
    icon: Bot,
    color: 'green',
    popularity: 4
  },
  {
    id: 'stable_diffusion',
    name: 'Stable Diffusion',
    description: 'Open-source powerhouse',
    icon: Cpu,
    color: 'blue',
    popularity: 4
  },
  {
    id: 'gemini_imagen',
    name: 'Gemini Imagen',
    description: 'Photorealistic results',
    icon: Camera,
    color: 'orange',
    popularity: 3
  },
  {
    id: 'flux',
    name: 'Flux',
    description: 'Next-generation model',
    icon: Zap,
    color: 'cyan',
    popularity: 4
  },
  {
    id: 'leonardo',
    name: 'Leonardo AI',
    description: 'Professional-grade generation',
    icon: Sparkles,
    color: 'indigo',
    popularity: 3
  }
];

// =============================================================================
// STYLING HELPER FUNCTION
// =============================================================================
const getColorClasses = (color, isSelected = false, isHovered = false) => {
  const colors = {
    green: {
      border: isSelected ? 'border-green-400' : isHovered ? 'border-green-300' : 'border-green-500/30',
      bg: isSelected ? 'bg-green-500/20' : isHovered ? 'bg-green-500/10' : 'bg-green-500/5',
      icon: isSelected ? 'text-green-300' : 'text-green-400',
      text: isSelected ? 'text-green-200' : 'text-green-300'
    },
    orange: {
      border: isSelected ? 'border-orange-400' : isHovered ? 'border-orange-300' : 'border-orange-500/30',
      bg: isSelected ? 'bg-orange-500/20' : isHovered ? 'bg-orange-500/10' : 'bg-orange-500/5',
      icon: isSelected ? 'text-orange-300' : 'text-orange-400',
      text: isSelected ? 'text-orange-200' : 'text-orange-300'
    },
    purple: {
      border: isSelected ? 'border-purple-400' : isHovered ? 'border-purple-300' : 'border-purple-500/30',
      bg: isSelected ? 'bg-purple-500/20' : isHovered ? 'bg-purple-500/10' : 'bg-purple-500/5',
      icon: isSelected ? 'text-purple-300' : 'text-purple-400',
      text: isSelected ? 'text-purple-200' : 'text-purple-300'
    },
    blue: {
      border: isSelected ? 'border-blue-400' : isHovered ? 'border-blue-300' : 'border-blue-500/30',
      bg: isSelected ? 'bg-blue-500/20' : isHovered ? 'bg-blue-500/10' : 'bg-blue-500/5',
      icon: isSelected ? 'text-blue-300' : 'text-blue-400',
      text: isSelected ? 'text-blue-200' : 'text-blue-300'
    },
    cyan: {
      border: isSelected ? 'border-cyan-400' : isHovered ? 'border-cyan-300' : 'border-cyan-500/30',
      bg: isSelected ? 'bg-cyan-500/20' : isHovered ? 'bg-cyan-500/10' : 'bg-cyan-500/5',
      icon: isSelected ? 'text-cyan-300' : 'text-cyan-400',
      text: isSelected ? 'text-cyan-200' : 'text-cyan-300'
    },
    indigo: {
      border: isSelected ? 'border-indigo-400' : isHovered ? 'border-indigo-300' : 'border-indigo-500/30',
      bg: isSelected ? 'bg-indigo-500/20' : isHovered ? 'bg-indigo-500/10' : 'bg-indigo-500/5',
      icon: isSelected ? 'text-indigo-300' : 'text-indigo-400',
      text: isSelected ? 'text-indigo-200' : 'text-indigo-300'
    }
  };
  return colors[color] || colors.blue;
};

// =============================================================================
// POPULARITY STARS COMPONENT
// =============================================================================
const renderPopularityStars = (popularity) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`w-3 h-3 ${
        i < popularity ? 'text-yellow-400 fill-current' : 'text-gray-600'
      }`}
    />
  ));
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
function GoalEngineSelection({ 
  selectedGoal,
  selectedEngine,
  onGoalChange, 
  onEngineChange,
  disabled = false,
  imageCount = 0 
}) {
  const [hoveredGoal, setHoveredGoal] = useState(null);
  const [hoveredEngine, setHoveredEngine] = useState(null);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  const handleGoalClick = (goalId) => {
    if (disabled) return;
    onGoalChange(goalId);
  };

  const handleEngineClick = (engineId) => {
    if (disabled) return;
    onEngineChange(engineId);
  };

  // =============================================================================
  // ANIMATION VARIANTS - OPTIMIZED FOR PERFORMANCE
  // =============================================================================
  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        staggerChildren: 0.08
      }
    }
  };

  const sectionVariants = {
    hidden: { 
      opacity: 0, 
      y: 15
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  // =============================================================================
  // RENDER METHODS
  // =============================================================================
  const renderGoalSection = () => (
    <motion.div
      className="space-y-4"
      variants={sectionVariants}
    >
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          Choose Your Goal
        </h3>
        <p className="text-gray-300 text-sm">
          What do you want to achieve with your {imageCount} image{imageCount !== 1 ? 's' : ''}?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoal === goal.id;
          const isHovered = hoveredGoal === goal.id;
          const colorClasses = getColorClasses(goal.color, isSelected, isHovered);

          return (
            <motion.div
              key={goal.id}
              className={`
                relative p-5 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${colorClasses.border} ${colorClasses.bg}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
              `}
              onClick={() => handleGoalClick(goal.id)}
              onMouseEnter={() => !disabled && setHoveredGoal(goal.id)}
              onMouseLeave={() => setHoveredGoal(null)}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
            >
              {/* Selection Indicator */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute top-3 right-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Content */}
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-lg ${colorClasses.bg} border ${colorClasses.border}`}>
                  <Icon className={`w-5 h-5 ${colorClasses.icon}`} />
                </div>
                <div>
                  <h4 className={`font-semibold ${colorClasses.text}`}>
                    {goal.title}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {goal.bestFor}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-300">
                {goal.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );

  const renderEngineSection = () => (
    <motion.div
      className="space-y-4"
      variants={sectionVariants}
    >
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          Select AI Engine
        </h3>
        <p className="text-gray-300 text-sm">
          Choose the AI model you'll use to generate your images
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {engines.map((engine) => {
          const Icon = engine.icon;
          const isSelected = selectedEngine === engine.id;
          const isHovered = hoveredEngine === engine.id;
          const colorClasses = getColorClasses(engine.color, isSelected, isHovered);

          return (
            <motion.div
              key={engine.id}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 text-center
                ${colorClasses.border} ${colorClasses.bg}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.05]'}
              `}
              onClick={() => handleEngineClick(engine.id)}
              onMouseEnter={() => !disabled && setHoveredEngine(engine.id)}
              onMouseLeave={() => setHoveredEngine(null)}
              whileHover={!disabled ? { scale: 1.05 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
            >
              {/* Selection Indicator */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute -top-1 -right-1"
                  >
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Engine Icon */}
              <div className={`mx-auto p-2 rounded-lg ${colorClasses.bg} border ${colorClasses.border} mb-2`}>
                <Icon className={`w-5 h-5 ${colorClasses.icon} mx-auto`} />
              </div>

              {/* Engine Name */}
              <h5 className={`font-medium text-sm ${colorClasses.text} mb-1`}>
                {engine.name}
              </h5>

              {/* Description */}
              <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                {engine.description}
              </p>

              {/* Popularity Stars */}
              <div className="flex justify-center space-x-0.5">
                {renderPopularityStars(engine.popularity)}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  return (
    <motion.div
      className="glass-effect p-6 rounded-lg space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Goal Selection */}
      {renderGoalSection()}

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Engine Selection */}
      {renderEngineSection()}

      {/* Status Indicator */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className={`flex items-center space-x-2 ${selectedGoal ? 'text-green-400' : 'text-gray-500'}`}>
          <div className={`w-3 h-3 rounded-full ${selectedGoal ? 'bg-green-400' : 'bg-gray-600'}`} />
          <span>Goal Selected</span>
        </div>
        <div className={`flex items-center space-x-2 ${selectedEngine ? 'text-green-400' : 'text-gray-500'}`}>
          <div className={`w-3 h-3 rounded-full ${selectedEngine ? 'bg-green-400' : 'bg-gray-600'}`} />
          <span>Engine Selected</span>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// PROP TYPES
// =============================================================================
GoalEngineSelection.propTypes = {
  selectedGoal: PropTypes.string,
  selectedEngine: PropTypes.string,
  onGoalChange: PropTypes.func.isRequired,
  onEngineChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  imageCount: PropTypes.number
};

// =============================================================================
// EXPORT
// =============================================================================
export default GoalEngineSelection;