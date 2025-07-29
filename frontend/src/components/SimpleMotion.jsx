// =============================================================================
// SIMPLE BLANK LOADING - NO PERFORMANCE HIT
// File: frontend/src/components/SimpleMotion.jsx - CREATE NEW FILE
// =============================================================================

import React, { useState, useEffect } from 'react';

/**
 * Simple Motion Loader - Blank until ready, then animate
 * No complex state management, no flash, minimal overhead
 */
export const SimpleMotion = ({ 
  children, 
  className = "", 
  style = {},
  whileHover,
  whileTap,
  initial,
  animate,
  variants,
  transition,
  ...props 
}) => {
  const [MotionComponent, setMotionComponent] = useState(null);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Load motion after a tiny delay to not block initial render
    const timer = setTimeout(async () => {
      try {
        const { motion } = await import('framer-motion');
        setMotionComponent(() => motion.div);
        setShowContent(true);
      } catch (error) {
        // Fallback: just show content without motion
        setShowContent(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Don't render anything until motion is loaded or fallback is triggered
  if (!showContent) {
    return null; // Blank until ready
  }

  // Use motion if available, otherwise plain div
  if (MotionComponent) {
    return (
      <MotionComponent
        className={className}
        style={style}
        initial={initial}
        animate={animate}
        variants={variants}
        whileHover={whileHover}
        whileTap={whileTap}
        transition={transition}
        {...props}
      >
        {children}
      </MotionComponent>
    );
  }

  // Plain fallback
  return (
    <div 
      className={className} 
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Preload motion globally after initial page load
 */
let motionPreloaded = false;

export const preloadMotion = () => {
  if (!motionPreloaded) {
    motionPreloaded = true;
    // Preload after page is fully loaded
    setTimeout(() => {
      import('framer-motion').catch(() => {});
    }, 2000);
  }
};