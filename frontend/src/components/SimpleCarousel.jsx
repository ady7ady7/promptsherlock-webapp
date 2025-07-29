// =============================================================================
// SIMPLE CAROUSEL - FIXED & PERFORMANT
// File: frontend/src/components/SimpleCarousel.jsx - CREATE NEW FILE
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { SimpleMotion } from './SimpleMotion';

/**
 * Simple Feature Carousel - Working auto-scroll, minimal overhead
 */
export const SimpleCarousel = ({ features = [] }) => {
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const carouselRef = useRef(null);
  const autoScrollRef = useRef(null);

  // Constants
  const CARD_WIDTH = 320;
  const AUTO_SCROLL_SPEED = 0.3;
  const TOTAL_WIDTH = features.length * CARD_WIDTH;

  // Create infinite features
  const infiniteFeatures = [...features, ...features, ...features];

  // Auto-scroll effect
  useEffect(() => {
    if (!isDragging && !isHovered) {
      autoScrollRef.current = setInterval(() => {
        setCurrentOffset(prev => {
          const newOffset = prev - AUTO_SCROLL_SPEED;
          // Seamless loop
          if (Math.abs(newOffset) >= TOTAL_WIDTH) {
            return 0;
          }
          return newOffset;
        });
      }, 16);
    } else {
      clearInterval(autoScrollRef.current);
    }

    return () => clearInterval(autoScrollRef.current);
  }, [isDragging, isHovered, TOTAL_WIDTH]);

  // Progress for belt indicator
  const progressPercentage = (Math.abs(currentOffset) % TOTAL_WIDTH) / TOTAL_WIDTH * 100;

  return (
    <div className="max-w-7xl mx-auto overflow-hidden px-4 py-4">
      <div className="relative">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        </div>

        {/* Carousel */}
        <div 
          className="flex space-x-6 cursor-grab active:cursor-grabbing transition-transform duration-75 ease-out"
          style={{ transform: `translateX(${currentOffset}px)` }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          ref={carouselRef}
        >
          {infiniteFeatures.map((feature, index) => (
            <SimpleMotion
              key={`${feature.title}-${index}`}
              className="glass-effect p-6 rounded-xl hover:bg-white/15 transition-all duration-300 flex-shrink-0 relative overflow-hidden"
              style={{ width: '300px' }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Background Pattern */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-50`} />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                <SimpleMotion
                  className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full backdrop-blur-sm"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </SimpleMotion>
                
                <h3 className="text-white font-semibold text-lg">
                  {feature.title}
                </h3>
                
                <p className="text-gray-300 text-sm">
                  {feature.description}
                </p>
              </div>
            </SimpleMotion>
          ))}
        </div>

        {/* FIXED Belt Indicator */}
        <div className="relative w-full max-w-md mx-auto mt-8 mb-4">
          <div className="h-1 bg-white/20 rounded-full relative">
            <div 
              className="absolute w-4 h-4 bg-blue-400 rounded-full shadow-lg transition-all duration-100 ease-out"
              style={{ 
                left: `${progressPercentage}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};