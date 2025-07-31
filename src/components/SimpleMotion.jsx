// =============================================================================
// WEBAPP SIMPLE MOTION - LIGHTWEIGHT ANIMATION WRAPPER
// File: src/components/SimpleMotion.jsx
// =============================================================================

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// SIMPLE MOTION COMPONENT
// =============================================================================

/**
 * Simple Motion wrapper - loads Framer Motion lazily
 */
export const SimpleMotion = ({ 
  children, 
  type = 'fadeIn', 
  delay = 0, 
  duration = 0.5,
  className = ''
}) => {
  const [MotionDiv, setMotionDiv] = useState(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Load Framer Motion on first use
  useEffect(() => {
    let mounted = true;

    const loadFramerMotion = async () => {
      try {
        const { motion } = await import('framer-motion');
        if (mounted) {
          setMotionDiv(() => motion.div);
          setShouldAnimate(true);
        }
      } catch (error) {
        console.warn('Failed to load Framer Motion, falling back to CSS animations');
        if (mounted) {
          setShouldAnimate(true);
        }
      }
    };

    loadFramerMotion();

    return () => {
      mounted = false;
    };
  }, []);

  // Animation variants for Framer Motion
  const variants = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    slideUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    },
    slideDown: {
      hidden: { opacity: 0, y: -20 },
      visible: { opacity: 1, y: 0 }
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 }
    }
  };

  // CSS class fallback if Framer Motion doesn't load
  const cssAnimationClass = `animate-${type}`;

  // If Framer Motion loaded successfully
  if (MotionDiv && shouldAnimate) {
    return (
      <MotionDiv
        className={className}
        initial="hidden"
        animate="visible"
        variants={variants[type] || variants.fadeIn}
        transition={{ 
          duration, 
          delay,
          ease: "easeOut"
        }}
      >
        {children}
      </MotionDiv>
    );
  }

  // Fallback to CSS animations or immediate render
  return (
    <div 
      className={`${shouldAnimate ? cssAnimationClass : ''} ${className}`}
      style={{ 
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }}
    >
      {children}
    </div>
  );
};

SimpleMotion.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['fadeIn', 'slideUp', 'slideDown', 'scaleIn']),
  delay: PropTypes.number,
  duration: PropTypes.number,
  className: PropTypes.string
};

// =============================================================================
// PRELOAD FUNCTION
// =============================================================================

/**
 * Preload Framer Motion for better performance
 */
export const preloadMotion = () => {
  if (typeof window !== 'undefined' && window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      import('framer-motion').catch(() => {
        console.log('Framer Motion preload failed - will fallback to CSS');
      });
    });
  }
};

export default SimpleMotion;