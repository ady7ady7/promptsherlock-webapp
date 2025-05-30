/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // =============================================================================
      // CUSTOM COLORS
      // =============================================================================
      colors: {
        // Glass morphism colors
        'glass': 'rgba(255, 255, 255, 0.1)',
        'glass-border': 'rgba(255, 255, 255, 0.2)',
        'glass-hover': 'rgba(255, 255, 255, 0.15)',
        
        // Custom brand colors
        'brand': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        
        // Background gradients
        'bg-primary': '#0f172a',
        'bg-secondary': '#1e293b',
        'bg-accent': '#7c3aed',
      },

      // =============================================================================
      // BACKDROP BLUR EXTENSIONS
      // =============================================================================
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      },

      // =============================================================================
      // CUSTOM ANIMATIONS
      // =============================================================================
      animation: {
        // Required animations
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        
        // Additional utility animations
        'slide-down': 'slideDown 0.6s ease-out',
        'slide-left': 'slideLeft 0.6s ease-out',
        'slide-right': 'slideRight 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'scale-out': 'scaleOut 0.3s ease-in',
        'bounce-slow': 'bounce 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
        'gradient-shift': 'gradientShift 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
      },

      // =============================================================================
      // KEYFRAME DEFINITIONS
      // =============================================================================
      keyframes: {
        // Required keyframes
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { 
            transform: 'translateY(20px)', 
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateY(0)', 
            opacity: '1' 
          },
        },
        pulseGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)' 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(59, 130, 246, 0.8), 0 0 80px rgba(59, 130, 246, 0.6)' 
          },
        },

        // Additional keyframes
        slideDown: {
          '0%': { 
            transform: 'translateY(-20px)', 
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateY(0)', 
            opacity: '1' 
          },
        },
        slideLeft: {
          '0%': { 
            transform: 'translateX(20px)', 
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateX(0)', 
            opacity: '1' 
          },
        },
        slideRight: {
          '0%': { 
            transform: 'translateX(-20px)', 
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateX(0)', 
            opacity: '1' 
          },
        },
        scaleIn: {
          '0%': { 
            transform: 'scale(0.9)', 
            opacity: '0' 
          },
          '100%': { 
            transform: 'scale(1)', 
            opacity: '1' 
          },
        },
        scaleOut: {
          '0%': { 
            transform: 'scale(1)', 
            opacity: '1' 
          },
          '100%': { 
            transform: 'scale(0.9)', 
            opacity: '0' 
          },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        glowPulse: {
          '0%': { 
            textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' 
          },
          '100%': { 
            textShadow: '0 0 30px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.6)' 
          },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translatey(0px)' },
          '50%': { transform: 'translatey(-20px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },

      // =============================================================================
      // TYPOGRAPHY EXTENSIONS
      // =============================================================================
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Monaco', 'monospace'],
      },
      
      fontSize: {
        '2xs': '0.625rem',
        '3xl': '1.953rem',
        '4xl': '2.441rem',
        '5xl': '3.052rem',
        '6xl': '3.815rem',
        '7xl': '4.768rem',
        '8xl': '5.96rem',
        '9xl': '7.451rem',
      },

      // =============================================================================
      // SPACING EXTENSIONS
      // =============================================================================
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '92': '23rem',
        '96': '24rem',
        '104': '26rem',
        '112': '28rem',
        '128': '32rem',
        '144': '36rem',
      },

      // =============================================================================
      // BORDER RADIUS EXTENSIONS
      // =============================================================================
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },

      // =============================================================================
      // BOX SHADOW EXTENSIONS
      // =============================================================================
      boxShadow: {
        'glow-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.6)',
        'glow-xl': '0 0 60px rgba(59, 130, 246, 0.7)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 25px 50px -12px rgba(31, 38, 135, 0.25)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(59, 130, 246, 0.2)',
        'purple-glow': '0 0 20px rgba(147, 51, 234, 0.5)',
        'purple-glow-lg': '0 0 40px rgba(147, 51, 234, 0.6)',
      },

      // =============================================================================
      // GRADIENT EXTENSIONS
      // =============================================================================
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'gradient-shimmer': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
      },

      // =============================================================================
      // Z-INDEX EXTENSIONS
      // =============================================================================
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  
  // =============================================================================
  // PLUGINS AND CUSTOM COMPONENTS
  // =============================================================================
  plugins: [
    // Custom component plugin
    function({ addComponents, addUtilities, theme }) {
      addComponents({
        // =============================================================================
        // GLASS EFFECT COMPONENT
        // =============================================================================
        '.glass-effect': {
          '@apply backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl': {},
          'box-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          'backdrop-filter': 'blur(16px)',
          '-webkit-backdrop-filter': 'blur(16px)',
          'border': '1px solid rgba(255, 255, 255, 0.18)',
        },
        
        '.glass-effect-strong': {
          '@apply backdrop-blur-xl bg-white/15 border border-white/25 rounded-3xl': {},
          'box-shadow': '0 25px 50px -12px rgba(31, 38, 135, 0.25)',
          'backdrop-filter': 'blur(24px)',
          '-webkit-backdrop-filter': 'blur(24px)',
        },

        '.glass-effect-subtle': {
          '@apply backdrop-blur-md bg-white/5 border border-white/10 rounded-xl': {},
          'box-shadow': '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
          'backdrop-filter': 'blur(8px)',
          '-webkit-backdrop-filter': 'blur(8px)',
        },

        // =============================================================================
        // GLOW BUTTON COMPONENT
        // =============================================================================
        '.glow-button': {
          '@apply bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700': {},
          '@apply text-white font-semibold py-3 px-6 rounded-lg': {},
          '@apply transform transition-all duration-200 hover:scale-105': {},
          '@apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50': {},
          'box-shadow': '0 4px 15px rgba(59, 130, 246, 0.3)',
          '&:hover': {
            'box-shadow': '0 8px 25px rgba(59, 130, 246, 0.5)',
          },
          '&:active': {
            '@apply scale-95': {},
          },
        },

        '.glow-button-secondary': {
          '@apply bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700': {},
          '@apply text-white font-semibold py-3 px-6 rounded-lg': {},
          '@apply transform transition-all duration-200 hover:scale-105': {},
          'box-shadow': '0 4px 15px rgba(147, 51, 234, 0.3)',
          '&:hover': {
            'box-shadow': '0 8px 25px rgba(147, 51, 234, 0.5)',
          },
        },

        '.glow-button-outline': {
          '@apply border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white': {},
          '@apply font-semibold py-3 px-6 rounded-lg': {},
          '@apply transform transition-all duration-200 hover:scale-105': {},
          'box-shadow': '0 0 15px rgba(59, 130, 246, 0.2)',
          '&:hover': {
            'box-shadow': '0 0 25px rgba(59, 130, 246, 0.4)',
          },
        },

        // =============================================================================
        // ADDITIONAL UTILITY COMPONENTS
        // =============================================================================
        '.gradient-text': {
          '@apply bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600': {},
          '@apply bg-clip-text text-transparent': {},
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },

        '.gradient-text-glow': {
          '@apply bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600': {},
          '@apply bg-clip-text text-transparent': {},
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'filter': 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
        },

        '.card-glass': {
          '@apply glass-effect p-6 space-y-4': {},
          '@apply hover:bg-white/15 transition-all duration-300': {},
        },

        '.input-glass': {
          '@apply glass-effect px-4 py-3 text-white placeholder-gray-300': {},
          '@apply focus:ring-2 focus:ring-blue-500 focus:border-transparent': {},
          '@apply transition-all duration-200': {},
        },

        '.dropzone-glass': {
          '@apply glass-effect border-2 border-dashed border-white/30': {},
          '@apply hover:border-blue-400 hover:bg-blue-500/10': {},
          '@apply transition-all duration-300 cursor-pointer': {},
        },

        '.spinner-glow': {
          '@apply animate-spin rounded-full border-2 border-white/20': {},
          'border-top-color': theme('colors.blue.500'),
          'box-shadow': '0 0 20px rgba(59, 130, 246, 0.3)',
        },
      });

      // =============================================================================
      // CUSTOM UTILITIES
      // =============================================================================
      addUtilities({
        '.text-shadow': {
          'text-shadow': '0 2px 4px rgba(0, 0, 0, 0.3)',
        },
        '.text-shadow-lg': {
          'text-shadow': '0 4px 8px rgba(0, 0, 0, 0.4)',
        },
        '.text-glow': {
          'text-shadow': '0 0 10px rgba(59, 130, 246, 0.5)',
        },
        '.text-glow-lg': {
          'text-shadow': '0 0 20px rgba(59, 130, 246, 0.6)',
        },
        '.bg-mesh': {
          'background-image': `
            radial-gradient(at 40% 20%, hsla(228,100%,74%,1) 0px, transparent 50%),
            radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%),
            radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%),
            radial-gradient(at 80% 50%, hsla(340,100%,76%,1) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(22,100%,77%,1) 0px, transparent 50%),
            radial-gradient(at 80% 100%, hsla(242,100%,70%,1) 0px, transparent 50%),
            radial-gradient(at 0% 0%, hsla(343,100%,76%,1) 0px, transparent 50%)
          `,
        },
      });
    },
  ],
}