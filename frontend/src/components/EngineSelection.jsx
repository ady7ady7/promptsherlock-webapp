// frontend/src/components/EngineSelection.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Bot, 
  Sparkles, 
  Camera, 
  Palette,
  CheckCircle,
  Star,
  Cpu
} from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * AI Engine Selection Component
 * Conditional component that appears when user selects a "Generate Prompt" goal
 */
const EngineSelection = ({ 
  selectedEngine, 
  onEngineChange, 
  disabled = false,
  goalType = ''
}) => {
  const [hoveredEngine, setHoveredEngine] = useState(null);

  // AI Engine definitions with metadata
  const engines = [
    {
      id: 'midjourney',
      name: 'Midjourney',
      description: 'Artistic and creative image generation with exceptional quality',
      icon: Palette,
      category: 'Creative',
      strengths: ['Artistic style', 'Composition', 'Creativity'],
      color: 'purple',
      popularity: 5,
      bestFor: 'Artistic and stylized images'
    },
    {
      id: 'dalle',
      name: 'DALL-E 3',
      description: 'Advanced AI image generation with excellent prompt adherence',
      icon: Bot,
      category: 'Versatile',
      strengths: ['Prompt accuracy', 'Text rendering', 'Consistency'],
      color: 'green',
      popularity: 5,
      bestFor: 'Precise prompt following'
    },
    {
      id: 'stable_diffusion',
      name: 'Stable Diffusion',
      description: 'Open-source powerhouse with extensive customization options',
      icon: Cpu,
      category: 'Technical',
      strengths: ['Customization', 'Speed', 'Community'],
      color: 'blue',
      popularity: 4,
      bestFor: 'Technical and customizable generation'
    },
    {
      id: 'gemini_imagen',
      name: 'Gemini Imagen',
      description: 'Google\'s advanced image generator with photorealistic results',
      icon: Camera,
      category: 'Photorealistic',
      strengths: ['Photorealism', 'Detail', 'Quality'],
      color: 'orange',
      popularity: 4,
      bestFor: 'Photorealistic images'
    },
    {
      id: 'flux',
      name: 'Flux',
      description: 'Next-generation model with cutting-edge capabilities',
      icon: Zap,
      category: 'Next-Gen',
      strengths: ['Innovation', 'Speed', 'Quality'],
      color: 'cyan',
      popularity: 4,
      bestFor: 'Latest AI capabilities'
    },
    {
      id: 'leonardo',
      name: 'Leonardo AI',
      description: 'Professional-grade image generation for creators',
      icon: Sparkles,
      category: 'Professional',
      strengths: ['Professional quality', 'Control', 'Consistency'],
      color: 'indigo',
      popularity: 3,
      bestFor: 'Professional content creation'
    }
  ];

  const handleEngineClick = (engineId) => {
    if (disabled) return;
    onEngineChange(engineId);
  };

  const getColorClasses = (color, isSelected = false, isHovered = false) => {
    const colors = {
      purple: {
        border: isSelected ? 'border-purple-400' : isHovered ? 'border-purple-300' : 'border-purple-500/30',
        bg: isSelected ? 'bg-purple-500/20' : isHovered ? 'bg-purple-500/10' : 'bg-purple-500/5',
        icon: isSelected ? 'text-purple-300' : 'text-purple-400',
        text: isSelected ? 'text-purple-200' : 'text-purple-300',
        accent: 'text-purple-400'
      },
      green: {
        border: isSelected ? 'border-green-400' : isHovered ? 'border-green-300' : 'border-green-500/30',
        bg: isSelected ? 'bg-green-500/20' : isHovered ? 'bg-green-500/10' : 'bg-green-500/5',
        icon: isSelected ? 'text-green-300' : 'text-green-400',
        text: isSelected ? 'text-green-200' : 'text-green-300',
        accent: 'text-green-400'
      },
      blue: {
        border: isSelected ? 'border-blue-400' : isHovered ? 'border-blue-300' : 'border-blue-500/30',
        bg: isSelected ? 'bg-blue-500/20' : isHovered ? 'bg-blue-500/10' : 'bg-blue-500/5',
        icon: isSelected ? 'text-blue-300' : 'text-blue-400',
        text: isSelected ? 'text-blue-200' : 'text-blue-300',
        accent: 'text-blue-400'
      },
      orange: {
        border: isSelected ? 'border-orange-400' : isHovered ? 'border-orange-300' : 'border-orange-500/30',
        bg: isSelected ? 'bg-orange-500/20' : isHovered ? 'bg-orange-500/10' : 'bg-orange-500/5',
        icon: isSelected ? 'text-orange-300' : 'text-orange-400',
        text: isSelected ? 'text-orange-200' : 'text-orange-300',
        accent: 'text-orange-400'
      },
      cyan: {
        border: isSelected ? 'border-cyan-400' : isHovered ? 'border-cyan-300' : 'border-cyan-500/30',
        bg: isSelected ? 'bg-cyan-500/20' : isHovered ? 'bg-cyan-500/10' : 'bg-cyan-500/5',
        icon: isSelected ? 'text-cyan-300' : 'text-cyan-400',
        text: isSelected ? 'text-cyan-200' : 'text-cyan-300',
        accent: 'text-cyan-400'
      },
      indigo: {
        border: isSelected ? 'border-indigo-400' : isHovered ? 'border-indigo-300' : 'border-indigo-500/30',
        bg: isSelected ? 'bg-indigo-500/20' : isHovered ? 'bg-indigo-500/10' : 'bg-indigo-500/5',
        icon: isSelected ? 'text-indigo-300' : 'text-indigo-400',
        text: isSelected ? 'text-indigo-200' : 'text-indigo-300',
        accent: 'text-indigo-400'
      }
    };
    return colors[color] || colors.blue;
  };

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

  const containerVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: {
      opacity: 1,
      height: 'auto',
      marginTop: 24,
      transition: {
        duration: 0.5,
        staggerChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      marginTop: 0,
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

  return (
    <AnimatePresence>
      <motion.div
        className="glass-effect p-6 rounded-lg overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        layout
      >
        {/* Header */}
        <motion.div 
          className="text-center space-y-2 mb-6"
          variants={itemVariants}
        >
          <h4 className="text-xl font-bold text-white">
            Choose Your AI Generation Engine
          </h4>
          <p className="text-gray-300 text-sm">
            Select the AI model that best fits your {goalType.replace('copy_', '')} generation needs
          </p>
        </motion.div>

        {/* Engine Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={itemVariants}
        >
          {engines.map((engine) => {
            const Icon = engine.icon;
            const isSelected = selectedEngine === engine.id;
            const isHovered = hoveredEngine === engine.id;
            const colorClasses = getColorClasses(engine.color, isSelected, isHovered);

            return (
              <motion.div
                key={engine.id}
                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer
                  transition-all duration-300 backdrop-blur-sm
                  ${colorClasses.border} ${colorClasses.bg}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
                `}
                onClick={() => handleEngineClick(engine.id)}
                onMouseEnter={() => setHoveredEngine(engine.id)}
                onMouseLeave={() => setHoveredEngine(null)}
                whileHover={!disabled ? { scale: 1.02 } : {}}
                whileTap={!disabled ? { scale: 0.98 } : {}}
                layout
              >
                {/* Selection Indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute top-2 right-2"
                    >
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Header */}
                <div className="flex items-start space-x-3 mb-3">
                  <div className={`p-2 rounded-lg ${colorClasses.bg} border ${colorClasses.border}`}>
                    <Icon className={`w-5 h-5 ${colorClasses.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className={`font-semibold text-sm ${colorClasses.text} truncate`}>
                      {engine.name}
                    </h5>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">
                      {engine.category}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-xs mb-3 line-clamp-2 leading-relaxed">
                  {engine.description}
                </p>

                {/* Popularity */}
                <div className="flex items-center space-x-1 mb-3">
                  {renderPopularityStars(engine.popularity)}
                  <span className="text-xs text-gray-400 ml-1">
                    {engine.popularity}/5
                  </span>
                </div>

                {/* Best For */}
                <div className={`text-xs p-2 rounded ${colorClasses.bg} border ${colorClasses.border} mb-3`}>
                  <span className={colorClasses.text}>
                    Best for: {engine.bestFor}
                  </span>
                </div>

                {/* Strengths */}
                <div className="space-y-1">
                  <span className="text-xs text-gray-400">Key strengths:</span>
                  <div className="flex flex-wrap gap-1">
                    {engine.strengths.map((strength, index) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-1 rounded-full ${colorClasses.bg} ${colorClasses.text} border ${colorClasses.border}`}
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Help Text */}
        <motion.div 
          className="text-center text-xs text-gray-400 mt-4"
          variants={itemVariants}
        >
          The prompt will be optimized specifically for your selected engine
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

EngineSelection.propTypes = {
  selectedEngine: PropTypes.string,
  onEngineChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  goalType: PropTypes.string
};

export default EngineSelection;